import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import medicines from "../../../data/medicines.json";
import shops from "../../../data/shops.json";

export interface MedicineWithShops {
  name: string;
  id: string;
  dosage?: string;
  shops: {
    id: string;
    name: string;
    distance: number;
    price: number;
  }[];
}

export interface ShopInfo {
  name: string;
  id: string;
  distance: string;
  location: string;
  phone: string;
}

export interface GeminiResponse {
  medicines?: MedicineWithShops[];
  response: string;
  shops?: ShopInfo[];
}

export async function POST(request: NextRequest) {
  try {
    const { userPrompt } = await request.json();

    if (!userPrompt) {
      return NextResponse.json(
        { error: "User prompt is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not configured");
      return NextResponse.json(
        { error: "API configuration error" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-2.5-flash-lite"; // Using flash for better reliability

    // Prepare context data more efficiently
    const medicinesContext = JSON.stringify(medicines);
    const shopsContext = JSON.stringify(shops);

    const prompt = `
You are a medical assistant for a medicine price comparison platform. 

CONTEXT DATA:
Medicines Database: ${medicinesContext}
Shops Database: ${shopsContext}

INSTRUCTIONS:
Analyze the user's prompt and respond accordingly:
1. For health symptoms: Provide brief diagnosis + relevant medicines along with their dosage (like how many tablets to take) along with their shop availability
2. For shop queries (e.g. "shops within 1km"): Return shop list 
3. For general queries: Provide helpful response about the platform

User Query: "${userPrompt}"

Respond in JSON format with this structure (only include relevant fields):
{
  "response": "Your helpful response here (always include this field)",
  "medicines": [{"name": "Medicine", "id": "MED_ID", "dosage": "dose info", "shops": [{"id": "SHOP_ID", "name": "Shop", "distance": 150, "price": 25}]}],
  "shops": [{"name": "Shop", "id": "SHOP_ID", "distance": 500, "location": "Address", "phone": "+91-1234567890"}]
}

Always include medical disclaimers for health advice.
`;

    const config = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["response"],
        properties: {
          medicines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["shops"],
              properties: {
                name: {
                  type: Type.STRING,
                },
                id: {
                  type: Type.STRING,
                },
                dosage: {
                  type: Type.STRING,
                },
                shops: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ["distance", "price"],
                    properties: {
                      id: {
                        type: Type.STRING,
                      },
                      name: {
                        type: Type.STRING,
                      },
                      distance: {
                        type: Type.STRING,
                      },
                      price: {
                        type: Type.NUMBER,
                      },
                    },
                  },
                },
              },
            },
          },
          response: {
            type: Type.STRING,
          },
          shops: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["name", "id", "distance", "location", "phone"],
              properties: {
                name: {
                  type: Type.STRING,
                },
                id: {
                  type: Type.STRING,
                },
                distance: {
                  type: Type.STRING,
                },
                location: {
                  type: Type.STRING,
                },
                phone: {
                  type: Type.STRING,
                },
              },
            },
          },
        },
      },
    };

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model,
      config,
      contents,
    });

    const responseText = await response.text;
    if (!responseText) {
      throw new Error("No response received from Gemini API");
    }

    const parsedResponse = JSON.parse(responseText) as GeminiResponse;

    // Ensure we always have a response field
    if (!parsedResponse.response) {
      parsedResponse.response =
        "I'm here to help you with your health concerns and find the best medicine prices nearby.";
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return NextResponse.json(
      {
        response:
          "I'm sorry, I'm experiencing some technical difficulties. Please try again later or consult with a healthcare professional for medical advice.",
      },
      { status: 500 }
    );
  }
}
