import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

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
  distance: number;
  location: string;
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
    const model = "gemini-2.5-pro";

    // Read JSON files and convert to base64 for inline data
    const medicinesPath = path.join(
      process.cwd(),
      "src",
      "data",
      "medicines.json"
    );
    const shopsPath = path.join(process.cwd(), "src", "data", "shops.json");

    const medicinesData = Buffer.from(fs.readFileSync(medicinesPath)).toString(
      "base64"
    );
    const shopsData = Buffer.from(fs.readFileSync(shopsPath)).toString(
      "base64"
    );

    const prompt = `
Analyze the user's prompt. If the user describes a health related condition/situation, diagnose the problems of the user and suggest what could have happened as a general message or a list of medicines nearby based on the data available in the attached JSON files (medicines.json and shops.json). Give the response based on the structure and the general diagnosis should only be of a few lines giving a general idea about the problem that the user might be facing. In case of a query like - "give me the list of shops within 1km", it should only return a list of shops. If a user asks a simple non medicine/shop related query then simple return a normal response, keeping in context that this website gives users a way to find medicines at the best prices at their closest medicine shops while also providing them with appropriate medicines along with their availability if the user provides their health information.

User Prompt: ${userPrompt}

Please respond in JSON format following this exact structure. Only include the relevant fields based on the query type:

For health conditions: Include medicines array with relevant medicines and shops where they're available
For shop queries: Include shops array with shop information  
For general queries: Include only response field

Example response structure:
{
  "medicines": [
    {
      "name": "Medicine Name",
      "id": "MED_ID", 
      "dosage": "Recommended dosage if applicable",
      "shops": [
        {
          "id": "SHOP_ID",
          "name": "Shop Name",
          "distance": 150,
          "price": 25
        }
      ]
    }
  ],
  "response": "Your diagnostic message or general response here. Keep it concise and helpful.",
  "shops": [
    {
      "name": "Shop Name",
      "id": "SHOP_ID",
      "distance": 500, 
      "location": "Shop Address"
    }
  ]
}

IMPORTANT: Always include a "response" field. For medicine recommendations, include proper medical disclaimers.
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
                        type: Type.NUMBER,
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
              required: ["name", "id", "distance", "location"],
              properties: {
                name: {
                  type: Type.STRING,
                },
                id: {
                  type: Type.STRING,
                },
                distance: {
                  type: Type.NUMBER,
                },
                location: {
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
          {
            inlineData: {
              mimeType: "application/json",
              data: medicinesData,
            },
          },
          {
            inlineData: {
              mimeType: "application/json",
              data: shopsData,
            },
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
