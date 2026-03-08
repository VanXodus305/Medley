import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Shop from "@/models/Shop";
import ShopMedicine from "@/models/ShopMedicine";

export async function GET() {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || "");
    }

    const shops = await Shop.find({}).lean();

    // For each shop, get its medicines
    const shopsWithMedicines = await Promise.all(
      shops.map(async (shop: any) => {
        const shopMedicines = await ShopMedicine.find({
          shop: shop._id,
        })
          .populate("medicine")
          .lean();

        const medicines = shopMedicines.map((sm: any) => ({
          medicine_id: sm.medicine.medicineId,
          quantity: sm.quantity,
          price: sm.price,
        }));

        return {
          id: shop.shopId,
          name: shop.name,
          owner: shop.owner,
          phone: shop.phone,
          location: shop.location,
          distance_from_user: `${shop.distance_from_user} km`,
          medicines,
        };
      })
    );

    return NextResponse.json(shopsWithMedicines);
  } catch (error) {
    console.error("Error fetching shops:", error);
    return NextResponse.json(
      { error: "Failed to fetch shops" },
      { status: 500 }
    );
  }
}
