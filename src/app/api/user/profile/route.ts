import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();
    const User = await import("@/models/User").then((m) => m.default);

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        userType: user.userType,
        phoneNumber: user.phoneNumber,
        address: user.address,
        shopName: user.shopName,
        licenseNumber: user.licenseNumber,
        createdAt: user.createdAt,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phoneNumber, address, shopName, licenseNumber } = body;

    await connectDB();
    const User = await import("@/models/User").then((m) => m.default);

    const updateData: Record<string, string | undefined> = {};
    if (name !== undefined) updateData.name = name;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (address !== undefined) updateData.address = address;
    if (shopName !== undefined) updateData.shopName = shopName;
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      updateData,
      { new: true },
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        userType: user.userType,
        phoneNumber: user.phoneNumber,
        address: user.address,
        shopName: user.shopName,
        licenseNumber: user.licenseNumber,
        createdAt: user.createdAt,
        message: "Profile updated successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
