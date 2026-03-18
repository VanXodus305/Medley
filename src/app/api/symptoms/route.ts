import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import mongoose from "mongoose";
import Medicine from "@/models/Medicine";
import Shop from "@/models/Shop";
import ShopMedicine from "@/models/ShopMedicine";

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

export interface SymptomsResponse {
  response: string;
  medicines?: MedicineWithShops[];
  shops?: ShopInfo[];
}

interface MLBackendResponse {
  query_type: "symptoms";
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
    const { symptoms } = await request.json();

    if (!symptoms || typeof symptoms !== "string" || symptoms.trim() === "") {
      return NextResponse.json(
        { error: "Symptoms must be a non-empty string" },
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

    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-3.1-flash-lite-preview";

    // Check if this is a medical query or just a normal chat message
    const symptomKeywords = [
      "symptom",
      "pain",
      "ache",
      "fever",
      "cough",
      "cold",
      "headache",
      "medicine",
      "drug",
      "tablet",
      "capsule",
      "treatment",
      "disease",
      "illness",
      "sick",
      "hurt",
      "itch",
      "allergy",
      "nausea",
      "vomit",
      "diarrhea",
      "constipation",
      "inflammation",
      "infection",
      "relief",
      "cure",
      "health",
      "medical",
      "pharma",
      "prescription",
      "dosage",
      "dose",
    ];

    const lowerSymptoms = symptoms.toLowerCase();
    const isMedicalQuery = symptomKeywords.some((keyword) =>
      lowerSymptoms.includes(keyword),
    );

    // If it's not a medical query, just respond with Gemini directly
    if (!isMedicalQuery) {
      const genericResponsePrompt = `You are a helpful assistant for Medley, a medicine price comparison platform. 

The user asked: "${symptoms}"

Provide a friendly, helpful response. Keep it concise and conversational. If relevant, you can mention that Medley helps find medicines and compare prices, but don't push it if the question is unrelated.`;

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [{ text: genericResponsePrompt }],
          },
        ],
      });

      const responseText = await response.text;
      return NextResponse.json(
        {
          response:
            responseText ||
            "I'm here to help! How can I assist you with Medley?",
        },
        { status: 200 },
      );
    }

    // Step 1: Call the ML backend /symptoms endpoint
    let mlBackendResponse: MLBackendResponse;
    try {
      const backendBaseUrl =
        process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:8000";
      const backendUrl = `${backendBaseUrl}/symptoms`;

      const backendResponse = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms }),
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

    // Step 2: Extract IDs and distance data from ML backend response
    const medicineIds = mlBackendResponse.matched_medicines.map((m) => m.id);
    const shopIds = mlBackendResponse.best_shops.map((s) => s.shop_id);

    // Create a map of shop_id to distance from ML backend
    const shopDistanceMap = new Map(
      mlBackendResponse.best_shops.map((s) => [s.shop_id, s.distance]),
    );

    // Step 3: Fetch FULL data from MongoDB using IDs
    const medicineDetails = await Medicine.find({
      medicineId: { $in: medicineIds },
    }).lean();

    const shopDetails = await Shop.find({ shopId: { $in: shopIds } }).lean();

    // Step 4: Build context using database data and ML-calculated distances
    const dbContext = {
      matched_medicines: medicineDetails.map((med) => ({
        id: med.medicineId,
        name: med.name,
        brand: med.brand || "N/A",
        form: med.form || "N/A",
        uses: med.uses || [],
      })),
      best_shops: shopDetails.map((shop) => {
        // Use the distance calculated by ML backend, fallback to MongoDB value
        const mlDistance = shopDistanceMap.get(shop.shopId);
        const distance =
          mlDistance !== undefined ? mlDistance : shop.distance_from_user || 0;
        return {
          shop_id: shop.shopId,
          shop_name: shop.name,
          distance: distance,
          location: shop.location,
          phone: shop.phone,
        };
      }),
    };

    const prompt = `
You are a medical assistant for a medicine price comparison platform called Medley.

The user has the following symptoms: "${symptoms}"

Based on their symptoms, here are the recommended medicines and the best shops where they can be found:

Recommended Medicines: ${JSON.stringify(dbContext.matched_medicines, null, 2)}
Best Shops Near You: ${JSON.stringify(dbContext.best_shops, null, 2)}

INSTRUCTIONS:
1. Generate a natural, friendly response addressing their symptoms
2. Explain why these medicines are recommended for their symptoms
3. Provide brief information about each medicine
4. Suggest the best shops where they can find these medicines (consider distance and availability)
5. Always include a medical disclaimer suggesting they consult a healthcare professional for diagnosis

Format your response in JSON with this structure:
{
  "response": "Your friendly natural language response here",
  "medicines": [{"name": "Medicine", "id": "ID", "dosage": "dose info", "shops": [{"id": "SHOP_ID", "name": "Shop", "distance": 15.5}]}],
  "shops": [{"name": "Shop", "id": "SHOP_ID", "distance": "15.5 km", "location": "Address", "phone": "Phone"}]
}
`;

    // Step 5: Get dosage recommendations from Gemini
    const dosagePrompt = `
You are a medical assistant. Based on the user's symptoms and the recommended medicines, provide appropriate dosage recommendations.

Symptoms: "${symptoms}"

Recommended Medicines:
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

For each medicine, suggest an appropriate dosage based on the symptoms and medicine form (e.g., "1-2 tablets every 6 hours", "1 teaspoon thrice daily", etc.).

Respond with ONLY a JSON object (no markdown, no extra text):
{
  "dosages": {
    "MEDICINE_NAME": "dosage recommendation"
  }
}
`;

    let dosageData: { dosages: Record<string, string> } = { dosages: {} };
    try {
      const dosageResponse = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [{ text: dosagePrompt }],
          },
        ],
      });

      const dosageResponseText = dosageResponse.text;
      if (dosageResponseText) {
        const jsonMatch = dosageResponseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          dosageData = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (error) {
      console.error("Error getting dosages from Gemini:", error);
    }

    // Step 6: Transform data with dosages and fetch prices
    // First create a map of medicineId -> MongoDB _id for price lookups
    const medicineIdToObjectId = new Map(
      medicineDetails.map((med) => [med.medicineId, med._id]),
    );

    const medicinesWithShops: MedicineWithShops[] = [];

    // Create a map of shopId -> MongoDB _id for ShopMedicine queries
    const shopIdToObjectId = new Map(
      shopDetails.map((shop) => [shop.shopId, shop._id]),
    );

    for (const med of dbContext.matched_medicines) {
      // Get MongoDB ObjectId for this medicine
      const medObjectId = medicineIdToObjectId.get(med.id);

      let shopsForMedicine: Array<{
        id: string;
        name: string;
        distance: number;
        price: number;
      }> = [];

      // Fetch shop data for this medicine (with or without prices)
      if (medObjectId && dbContext.best_shops.length > 0) {
        const shopObjectIds = dbContext.best_shops
          .slice(0, 3)
          .map((s) => shopIdToObjectId.get(s.shop_id))
          .filter((id): id is object => id !== undefined);

        if (shopObjectIds.length > 0) {
          // Query ShopMedicine with both medicine and shops
          const pricesData = await ShopMedicine.find({
            medicine: medObjectId,
            shop: { $in: shopObjectIds },
          }).lean();

          // Create a map of shop ObjectId -> price for quick lookup
          const priceMap = new Map(
            pricesData.map((p) => [String(p.shop), p.price || 0]),
          );

          // Build shops list from best_shops, falling back to price 0 if not found
          shopsForMedicine = dbContext.best_shops
            .slice(0, 3)
            .map((shop) => {
              const shopObjId = shopIdToObjectId.get(shop.shop_id);
              const price = shopObjId
                ? (priceMap.get(String(shopObjId)) ?? 0)
                : 0;

              return {
                id: shop.shop_id,
                name: shop.shop_name,
                distance: shop.distance || 0,
                price: price,
              };
            })
            .filter((shop) => shop.price > 0); // Only show shops where medicine is actually available
        }
      }

      const geminiDosage = dosageData.dosages[med.name];

      medicinesWithShops.push({
        name: med.name,
        id: med.id,
        dosage:
          geminiDosage ||
          (med.uses.length > 0 ? `For: ${med.uses[0]}` : undefined),
        shops: shopsForMedicine,
      });
    }

    const shopsForDisplay: ShopInfo[] = dbContext.best_shops
      .slice(0, 5)
      .map((shop) => {
        const distance = shop.distance || 0;
        const distanceStr =
          typeof distance === "number"
            ? `${distance.toFixed(1)} km`
            : String(distance);

        return {
          name: shop.shop_name,
          id: shop.shop_id,
          distance: distanceStr,
          location: shop.location,
          phone: shop.phone,
        };
      });

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
              properties: {
                name: { type: Type.STRING },
                id: { type: Type.STRING },
                dosage: { type: Type.STRING },
                shops: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      distance: { type: Type.NUMBER },
                      price: { type: Type.NUMBER },
                    },
                  },
                },
              },
            },
          },
          response: { type: Type.STRING },
          shops: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                id: { type: Type.STRING },
                distance: { type: Type.STRING },
                location: { type: Type.STRING },
                phone: { type: Type.STRING },
              },
            },
          },
        },
      },
    };

    const response = await ai.models.generateContent({
      model,
      config,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const responseText = await response.text;
    if (!responseText) {
      throw new Error("No response received from Gemini API");
    }

    const parsedResponse = JSON.parse(responseText) as SymptomsResponse;

    if (!parsedResponse.response) {
      parsedResponse.response =
        "I'm here to help you with your health concerns and find the best medicine options nearby.";
    }

    // Always use our calculated medicines with correct distances and prices
    if (!parsedResponse.medicines || parsedResponse.medicines.length === 0) {
      parsedResponse.medicines = medicinesWithShops;
    } else {
      // Merge Gemini's response with our calculated data to ensure distances and prices are correct
      parsedResponse.medicines = parsedResponse.medicines.map((med) => {
        const ourMed = medicinesWithShops.find(
          (m) => m.name.toLowerCase() === med.name.toLowerCase(),
        );
        return {
          ...med,
          shops: ourMed?.shops || med.shops || [],
        };
      });
    }

    if (!parsedResponse.shops) {
      parsedResponse.shops = shopsForDisplay;
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error("Error in symptoms endpoint:", error);
    return NextResponse.json(
      {
        response:
          "I'm sorry, I'm experiencing some technical difficulties. Please try again later or consult with a healthcare professional for medical advice.",
      },
      { status: 500 },
    );
  }
}
