import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import mongoose from "mongoose";
import Medicine from "@/models/Medicine";
import Shop from "@/models/Shop";

// interface MedicineDoc {
//   medicineId: string;
//   name: string;
//   brand: string;
//   form: string;
//   uses: string[];
// }

// interface ShopDoc {
//   shopId: string;
//   name: string;
//   owner: string;
//   phone: string;
//   location: string;
//   distance_from_user: number;
// }

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

interface MLBackendResponse {
  query_type: "symptoms" | "medicine";
  query: string;
  matched_medicines: { id: string; name: string; brand: string }[];
  best_shops: {
    shop_id: string;
    shop_name: string;
    distance: number;
    coverage: number;
    covered_count: number;
    required_count: number;
    total_price: number;
    score: number;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const { userPrompt } = await request.json();

    if (!userPrompt) {
      return NextResponse.json(
        { error: "User prompt is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not configured");
      return NextResponse.json(
        { error: "API configuration error" },
        { status: 500 },
      );
    }

    // Connect to MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || "");
    }

    // Step 1: Call the ML backend to get matched medicines and best shops
    let mlBackendResponse: MLBackendResponse;
    try {
      const backendBaseUrl =
        process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:8000";
      const backendUrl = `${backendBaseUrl}/chat`;

      const backendResponse = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userPrompt }),
      });

      if (!backendResponse.ok) {
        throw new Error(
          `ML Backend error: ${backendResponse.status} ${backendResponse.statusText}`,
        );
      }

      mlBackendResponse = await backendResponse.json();
    } catch (error) {
      console.error("Error calling ML backend:", error);
      return NextResponse.json(
        {
          response:
            "I'm sorry, I couldn't reach the AI assistant service. Please try again later.",
        },
        { status: 500 },
      );
    }

    // Step 2: Extract only IDs from ML backend response
    const medicineIds = mlBackendResponse.matched_medicines.map((m) => m.id);
    const shopIds = mlBackendResponse.best_shops.map((s) => s.shop_id);

    // Step 3: Fetch FULL data from MongoDB using IDs
    const medicineDetails = await Medicine.find({
      medicineId: { $in: medicineIds },
    }).lean();

    const shopDetails = await Shop.find({ shopId: { $in: shopIds } }).lean();

    // Step 4: Build context using ONLY database data (no ML response data)
    const dbContext = {
      matched_medicines: medicineDetails.map((med) => ({
        id: med.medicineId,
        name: med.name,
        brand: med.brand || "N/A",
        form: med.form || "N/A",
        uses: med.uses || [],
      })),
      best_shops: shopDetails.map((shop) => ({
        shop_id: shop.shopId,
        shop_name: shop.name,
        distance: shop.distance_from_user,
        location: shop.location,
        phone: shop.phone,
      })),
    };

    const prompt = `
You are a medical assistant for a medicine price comparison platform called Medley.

The user asked: "${userPrompt}"

Here is the matched medicines and best shops from our database:
Matched Medicines: ${JSON.stringify(dbContext.matched_medicines, null, 2)}
Best Shops: ${JSON.stringify(dbContext.best_shops, null, 2)}

INSTRUCTIONS:
1. Generate a natural, friendly response based on the matched medicines and best shops data
2. For symptoms queries: Provide brief medical information + recommend the matched medicines + suggest the best shops where they can be found
3. For medicine queries: Mention the available medicines and the best shops to find them
4. Always include relevant dosage information and usage tips if available
5. Include a brief medical disclaimer

Format your response in JSON with this structure:
{
  "response": "Your friendly natural language response here",
  "medicines": [{"name": "Medicine", "id": "ID", "dosage": "dose info", "shops": [{"id": "SHOP_ID", "name": "Shop", "distance": 15.5, "price": 50}]}],
  "shops": [{"name": "Shop", "id": "SHOP_ID", "distance": 15.5, "location": "Address", "phone": "Phone"}]
}
`;

    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-3.1-flash-lite-preview";

    // Step 5: Use Gemini to get appropriate dosages for the matched medicines
    const dosagePrompt = `
You are a medical assistant. Based on the user's query and the matched medicines, provide appropriate dosage recommendations.

User's Query: "${userPrompt}"

Matched Medicines:
${JSON.stringify(
  dbContext.matched_medicines.map((med) => ({
    name: med.name,
    brand: med.brand,
    form: med.form,
    uses: med.uses,
  })),
  null,
  2,
)}

For each medicine, suggest an appropriate dosage based on the query and medicine form (e.g., "2 tablets every 6 hours", "1 teaspoon thrice daily", "1-2 capsules every 8 hours", etc.).

Respond with ONLY a JSON object in this format (no markdown, no extra text):
{
  "dosages": {
    "MEDICINE_NAME": "dosage recommendation"
  }
}

Example:
{
  "dosages": {
    "Paracetamol": "1-2 tablets every 6 hours (max 3000mg/day)",
    "Ibuprofen": "1 tablet every 8 hours with food"
  }
}
`;

    let dosageData: { dosages: Record<string, string> } = { dosages: {} };
    try {
      const dosageConfigContent = [
        {
          role: "user",
          parts: [
            {
              text: dosagePrompt,
            },
          ],
        },
      ];

      const dosageResponse = await ai.models.generateContent({
        model,
        contents: dosageConfigContent,
      });

      const dosageResponseText = dosageResponse.text;
      if (dosageResponseText) {
        // Try to parse as JSON, extracting just the JSON part if needed
        const jsonMatch = dosageResponseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          dosageData = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (error) {
      console.error("Error getting dosages from Gemini:", error);
      // Continue without dosages if Gemini call fails
    }

    // Step 6: Transform database data into frontend format with dosages
    const medicinesWithShops: MedicineWithShops[] =
      dbContext.matched_medicines.map((med) => {
        // Get top 3 shops for this medicine from database
        const shopsForMedicine = dbContext.best_shops
          .slice(0, 3)
          .map((shop) => ({
            id: shop.shop_id,
            name: shop.shop_name,
            distance: shop.distance,
            price: 0, // Price not in database, will be 0
          }));

        // Get dosage from Gemini recommendation
        const geminiDosage = dosageData.dosages[med.name];

        return {
          name: med.name,
          id: med.id,
          dosage:
            geminiDosage ||
            (med.uses.length > 0 ? `For: ${med.uses[0]}` : undefined),
          shops: shopsForMedicine,
        };
      });

    const shopsForDisplay: ShopInfo[] = dbContext.best_shops
      .slice(0, 5)
      .map((shop) => ({
        name: shop.shop_name,
        id: shop.shop_id,
        distance: `${shop.distance.toFixed(1)} km`,
        location: shop.location,
        phone: shop.phone,
      }));

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

    // Include the transformed medicines and shops data
    if (!parsedResponse.medicines) {
      parsedResponse.medicines = medicinesWithShops;
    }

    if (!parsedResponse.shops) {
      parsedResponse.shops = shopsForDisplay;
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return NextResponse.json(
      {
        response:
          "I'm sorry, I'm experiencing some technical difficulties. Please try again later or consult with a healthcare professional for medical advice.",
      },
      { status: 500 },
    );
  }
}
