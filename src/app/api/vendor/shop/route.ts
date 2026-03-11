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

    // Find user by email to get their _id
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find shop by owner (now using User _id)
    const shop = await Shop.findOne({ owner: user._id })
      .populate("owner", "email name")
      .lean();

    if (!shop) {
      return NextResponse.json({ error: "No shop found" }, { status: 404 });
    }

    return NextResponse.json(shop);
  } catch (error) {
    console.error("Vendor shop GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shop" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Find user by email to get their _id
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if shop already exists for this user
    const existing = await Shop.findOne({ owner: user._id });
    if (existing) {
      return NextResponse.json(
        { error: "Shop already exists. Use PUT to update." },
        { status: 409 },
      );
    }

    const body = await request.json();
    const { name, phone, location, openingTime, closingTime } = body;

    if (!name || !phone || !location) {
      return NextResponse.json(
        { error: "Name, phone, and location are required" },
        { status: 400 },
      );
    }

    // Generate random distance between 0.5 and 50 km
    const distance_from_user = Math.random() * 49.5 + 0.5;

    const shop = await Shop.create({
      shopId: `shop_${Date.now()}`,
      name,
      owner: user._id, // Use User _id as reference
      phone,
      location,
      distance_from_user: Math.round(distance_from_user * 10) / 10, // Round to 1 decimal
      openingTime: openingTime || "",
      closingTime: closingTime || "",
    });

    // Update user shopName
    await User.findByIdAndUpdate(user._id, { shopName: name });

    return NextResponse.json(shop, { status: 201 });
  } catch (error) {
    console.error("Vendor shop POST error:", error);
    return NextResponse.json(
      { error: "Failed to create shop" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Find user by email to get their _id
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, phone, location, openingTime, closingTime } = body;

    const shop = await Shop.findOneAndUpdate(
      { owner: user._id }, // Find by User _id
      { name, phone, location, openingTime, closingTime },
      { new: true },
    );

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    if (name) {
      await User.findByIdAndUpdate(user._id, { shopName: name });
    }

    return NextResponse.json(shop);
  } catch (error) {
    console.error("Vendor shop PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update shop" },
      { status: 500 },
    );
  }
}
