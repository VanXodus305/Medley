import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Shop from "@/models/Shop";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const shop = await Shop.findOne({ owner: session.user.email }).lean();
    if (!shop) {
      return NextResponse.json({ error: "No shop found" }, { status: 404 });
    }

    return NextResponse.json(shop);
  } catch (error) {
    console.error("Vendor shop GET error:", error);
    return NextResponse.json({ error: "Failed to fetch shop" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const existing = await Shop.findOne({ owner: session.user.email });
    if (existing) {
      return NextResponse.json({ error: "Shop already exists. Use PUT to update." }, { status: 409 });
    }

    const body = await request.json();
    const { name, phone, location, openingTime, closingTime } = body;

    if (!name || !phone || !location) {
      return NextResponse.json({ error: "Name, phone, and location are required" }, { status: 400 });
    }

    const shop = await Shop.create({
      shopId: `shop_${Date.now()}`,
      name,
      owner: session.user.email,
      phone,
      location,
      openingTime: openingTime || "",
      closingTime: closingTime || "",
    });

    await User.findOneAndUpdate({ email: session.user.email }, { shopName: name });

    return NextResponse.json(shop, { status: 201 });
  } catch (error) {
    console.error("Vendor shop POST error:", error);
    return NextResponse.json({ error: "Failed to create shop" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { name, phone, location, openingTime, closingTime } = body;

    const shop = await Shop.findOneAndUpdate(
      { owner: session.user.email },
      { name, phone, location, openingTime, closingTime },
      { new: true }
    );

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    if (name) {
      await User.findOneAndUpdate({ email: session.user.email }, { shopName: name });
    }

    return NextResponse.json(shop);
  } catch (error) {
    console.error("Vendor shop PUT error:", error);
    return NextResponse.json({ error: "Failed to update shop" }, { status: 500 });
  }
}
