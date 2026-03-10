import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Shop from "@/models/Shop";
import ShopMedicine from "@/models/ShopMedicine";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const shop = await Shop.findOne({ owner: session.user.email });
    if (!shop) {
      return NextResponse.json([]);
    }

    const inventory = await ShopMedicine.find({ shop: shop._id })
      .populate("medicine")
      .sort({ quantity: 1 })
      .lean();

    return NextResponse.json(inventory);
  } catch (error) {
    console.error("Vendor inventory GET error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const shop = await Shop.findOne({ owner: session.user.email });
    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const body = await request.json();
    const { id, quantity, price } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updateData: Record<string, number> = {};
    if (quantity !== undefined) updateData.quantity = Number(quantity);
    if (price !== undefined) updateData.price = Number(price);

    const updated = await ShopMedicine.findOneAndUpdate(
      { _id: id, shop: shop._id },
      updateData,
      { new: true }
    ).populate("medicine");

    if (!updated) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Vendor inventory PUT error:", error);
    return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 });
  }
}
