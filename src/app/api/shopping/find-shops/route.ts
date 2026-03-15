import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import mongoose from "mongoose";
import Medicine from "@/models/Medicine";
import Shop from "@/models/Shop";

export interface ShopWithCoverage {
  name: string;
  id: string;
  distance: number;
  location: string;
  phone: string;
  coverage: number;
  coveredCount: number;
  requiredCount: number;
  totalPrice: number;
  available: boolean;
}

export interface FindShopsResponse {
  response: string;
  shops: ShopWithCoverage[];
  requestedMedicines: { id: string; name: string }[];
}

interface MLBackendResponse {
  query_type: "medicines";
  requested_medicines: string[];
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
    const { medicines } = await request.json();

    if (!Array.isArray(medicines) || medicines.length === 0) {
      return NextResponse.json(
        {
          error: "Medicines must be a non-empty array of medicine IDs or names",
        },
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

    // Step 1: Call the ML backend /medicines endpoint
    let mlBackendResponse: MLBackendResponse;
    try {
      const backendBaseUrl =
        process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:8000";
      const backendUrl = `${backendBaseUrl}/medicines`;

      const backendResponse = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicines }),
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
            "I'm sorry, I couldn't reach the medicine lookup service. Please try again later.",
        },
        { status: 500 },
      );
    }

    // Step 2: Extract IDs from ML backend response and distance data
    const medicineIds = mlBackendResponse.matched_medicines.map((m) => m.id);
    const shopIds = mlBackendResponse.best_shops.map((s) => s.shop_id);

    // Create a map of shop_id to distance from ML backend
    const shopDistanceMap = new Map(
      mlBackendResponse.best_shops.map((s) => [s.shop_id, s.distance]),
    );

    // Step 3: Fetch FULL data from MongoDB
    const medicineDetails = await Medicine.find({
      medicineId: { $in: medicineIds },
    }).lean();

    const shopDetails = await Shop.find({ shopId: { $in: shopIds } }).lean();

    // Step 4: Build context with ML-calculated distances
    const dbContext = {
      requested_medicines: medicineDetails.map((med) => ({
        id: med.medicineId,
        name: med.name,
        brand: med.brand || "N/A",
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
You are a medicine availability assistant for Medley, a medicine price comparison platform.

The user is looking for these medicines: ${medicineDetails.map((m) => m.name).join(", ")}

Based on our database, here are the best shops where they can find these medicines:

Requested Medicines: ${JSON.stringify(dbContext.requested_medicines, null, 2)}
Best Shops: ${JSON.stringify(dbContext.best_shops, null, 2)}

Best Shops Details from ML:
${JSON.stringify(mlBackendResponse.best_shops, null, 2)}

INSTRUCTIONS:
1. Generate a concise response helping the user find all the requested medicines
2. Recommend the best shop(s) considering:
   - Shops that have ALL or MOST of the requested medicines (coverage)
   - Shortest distance from the user
   - Lowest total price
3. If multiple shops are needed (no single shop has all medicines), suggest the visit plan
4. Include shop details (distance, location, phone) to help them visit

Format your response in JSON with this structure:
{
  "response": "Your natural language response here",
  "shops": [{"name": "Shop", "id": "SHOP_ID", "distance": 5.5, "location": "Address", "phone": "Phone", "coverage": 0.8, "coveredCount": 4, "requiredCount": 5, "totalPrice": 250, "available": true}]
}
`;

    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-3.1-flash-lite-preview";

    const config = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["response", "shops"],
        properties: {
          response: { type: Type.STRING },
          shops: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["name", "id", "distance", "location", "phone"],
              properties: {
                name: { type: Type.STRING },
                id: { type: Type.STRING },
                distance: { type: Type.NUMBER },
                location: { type: Type.STRING },
                phone: { type: Type.STRING },
                coverage: { type: Type.NUMBER },
                coveredCount: { type: Type.NUMBER },
                requiredCount: { type: Type.NUMBER },
                totalPrice: { type: Type.NUMBER },
                available: { type: Type.BOOLEAN },
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

    const parsedResponse = JSON.parse(responseText) as FindShopsResponse;

    // Enrich shops data with ML backend metrics
    const enrichedShops: ShopWithCoverage[] = (parsedResponse.shops || []).map(
      (shop) => {
        const mlShop = mlBackendResponse.best_shops.find(
          (s) => s.shop_id === shop.id,
        );
        const dbShop = dbContext.best_shops.find((s) => s.shop_id === shop.id);

        return {
          ...shop,
          distance: mlShop?.distance ?? dbShop?.distance ?? shop.distance ?? 0,
          coverage: mlShop?.coverage ?? 0,
          coveredCount: mlShop?.covered_count ?? 0,
          requiredCount: mlShop?.required_count ?? medicineIds.length,
          totalPrice: mlShop?.total_price ?? 0,
          available: (mlShop?.coverage ?? 0) > 0,
        };
      },
    );

    // Ensure we always have a response
    if (!parsedResponse.response) {
      parsedResponse.response =
        "Here are the best shops where you can find all the requested medicines.";
    }

    return NextResponse.json({
      response: parsedResponse.response,
      shops: enrichedShops,
      requestedMedicines: dbContext.requested_medicines,
    } as FindShopsResponse);
  } catch (error) {
    console.error("Error in find-shops endpoint:", error);
    return NextResponse.json(
      {
        response:
          "I'm sorry, I'm experiencing some technical difficulties. Please try again later.",
        shops: [],
        requestedMedicines: [],
      },
      { status: 500 },
    );
  }
}
