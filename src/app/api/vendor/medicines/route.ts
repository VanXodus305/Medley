import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Shop from "@/models/Shop";
import Medicine from "@/models/Medicine";
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

    const shopMedicines = await ShopMedicine.find({ shop: shop._id })
      .populate("medicine")
      .lean();

    return NextResponse.json(shopMedicines);
  } catch (error) {
    console.error("Vendor medicines GET error:", error);
    return NextResponse.json({ error: "Failed to fetch medicines" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const shop = await Shop.findOne({ owner: session.user.email });
    if (!shop) {
      return NextResponse.json(
        { error: "Shop not found. Please create your pharmacy profile first." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { medicineId, price, quantity } = body;

    if (!medicineId || price === undefined || quantity === undefined) {
      return NextResponse.json(
        { error: "medicineId, price, and quantity are required" },
        { status: 400 }
      );
    }

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
    }

    // Upsert: update if exists, create if not
    const shopMedicine = await ShopMedicine.findOneAndUpdate(
      { shop: shop._id, medicine: medicine._id },
      { price: Number(price), quantity: Number(quantity) },
      { new: true, upsert: true }
    ).populate("medicine");

    return NextResponse.json(shopMedicine, { status: 201 });
  } catch (error) {
    console.error("Vendor medicines POST error:", error);
    return NextResponse.json({ error: "Failed to add medicine" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });
    }

    await connectDB();
    const shop = await Shop.findOne({ owner: session.user.email });
    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const deleted = await ShopMedicine.findOneAndDelete({ _id: id, shop: shop._id });
    if (!deleted) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vendor medicines DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete medicine" }, { status: 500 });
  }
}
