import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter required" },
        { status: 400 },
      );
    }

    await connectDB();
    const User = await import("@/models/User").then((m) => m.default);

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { exists: false, userType: null },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        exists: true,
        userType: user.userType,
        id: user._id.toString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("User check error:", error);
    return NextResponse.json(
      { error: "Failed to check user" },
      { status: 500 },
    );
  }
}
