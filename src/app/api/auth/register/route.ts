import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const User = await import("@/models/User").then((m) => m.default);
    const Shop = await import("@/models/Shop").then((m) => m.default);

    const body = await request.json();
    const {
      email,
      name,
      userType,
      phoneNumber,
      address,
      shopName,
      licenseNumber,
      image,
      shopPhone,
      shopLocation,
    } = body;

    // Validate required fields
    if (!email || !name || !userType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }

    // Validate vendor-specific fields
    if (userType === "vendor" && (!shopName || !shopPhone || !shopLocation)) {
      return NextResponse.json(
        { error: "Shop name, phone, and location are required for vendors" },
        { status: 400 },
      );
    }

    // Create user object based on type
    const userData: Record<string, string | string[] | null | undefined> = {
      email,
      name,
      userType,
      image,
      list: [],
    };

    // Add type-specific fields
    if (userType === "customer") {
      if (phoneNumber) userData.phoneNumber = phoneNumber;
      if (address) userData.address = address;
    } else if (userType === "vendor") {
      if (shopName) userData.shopName = shopName;
      if (phoneNumber) userData.phoneNumber = phoneNumber;
      if (address) userData.address = address;
      if (licenseNumber) userData.licenseNumber = licenseNumber;
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    // Create shop for vendor and link to user
    if (userType === "vendor") {
      // Generate random distance between 0.5 and 50 km
      const distance_from_user =
        Math.round((Math.random() * 49.5 + 0.5) * 10) / 10;

      const shop = new Shop({
        shopId: `shop_${Date.now()}`,
        name: shopName,
        owner: user._id, // Reference to the newly created user
        phone: shopPhone,
        location: shopLocation,
        distance_from_user,
      });
      await shop.save();
    }

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          _id: user._id,
          userType: user.userType,
          licenseNumber: user.licenseNumber,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 },
    );
  }
}
