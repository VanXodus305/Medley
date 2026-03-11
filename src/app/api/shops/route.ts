import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Shop from "@/models/Shop";
import ShopMedicine from "@/models/ShopMedicine";

interface ShopDoc {
  _id: string;
  shopId: string;
  name: string;
  owner: { name: string } | string;
  phone: string;
  location: string;
  distance_from_user: number;
}

interface ShopMedicineDoc {
  medicine: {
    medicineId: string;
  };
  quantity: number;
  price: number;
}

export async function GET(request: NextRequest) {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || "");
    }

    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "1000"), 1000); // Max 1000
    const skip = Math.max(parseInt(searchParams.get("skip") || "0"), 0);

    const shops = (await Shop.find({})
      .populate("owner", "name")
      .lean()
      .skip(skip)
      .limit(limit)) as unknown as ShopDoc[];

    // For each shop, get its medicines
    const shopsWithMedicines = await Promise.all(
      shops.map(async (shop) => {
        const shopMedicines = (await ShopMedicine.find({
          shop: shop._id,
        })
          .populate("medicine")
          .lean()) as unknown as ShopMedicineDoc[];

        const medicines = shopMedicines.map((sm) => ({
          medicine_id: sm.medicine.medicineId,
          quantity: sm.quantity,
          price: sm.price,
        }));

        // Extract owner name from populated owner object or fallback to string
        const ownerName =
          typeof shop.owner === "string"
            ? shop.owner
            : ((shop.owner as unknown as { name: string }) || {}).name ||
              "Unknown";

        return {
          id: shop.shopId,
          name: shop.name,
          owner: ownerName,
          phone: shop.phone,
          location: shop.location,
          distance_from_user: `${shop.distance_from_user} km`,
          medicines,
        };
      }),
    );

    return NextResponse.json(shopsWithMedicines);
  } catch (error) {
    console.error("Error fetching shops:", error);
    return NextResponse.json(
      { error: "Failed to fetch shops" },
      { status: 500 },
    );
  }
}
