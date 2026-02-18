import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

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

    // Create user object based on type
    const userData: any = {
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

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: { _id: user._id, userType: user.userType },
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
