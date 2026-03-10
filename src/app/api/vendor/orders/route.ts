import { NextResponse } from "next/server";
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
    const shop = await Shop.findOne({ owner: session.user.email });
    if (!shop) {
      return NextResponse.json([]);
    }

    // Find customers who have items from this shop in their list
    const customers = await User.find({
      "list.shop": shop._id,
      userType: "customer",
    })
      .populate("list.medicine")
      .lean();

    const orders = customers.map((customer) => ({
    //   customerId: customer._id.toString(),
        customerId: String(customer._id),
      customerName: customer.name,
      customerEmail: customer.email,
      items: (customer.list as Array<{
        shop?: { toString: () => string };
        medicine?: unknown;
        quantity?: number;
      }>)
        .filter((item) => item.shop?.toString() === shop._id.toString())
        .map((item) => ({
          medicine: item.medicine,
          quantity: item.quantity ?? 1,
        })),
    }));

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Vendor orders GET error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
