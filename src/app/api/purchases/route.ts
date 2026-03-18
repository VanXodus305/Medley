import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Purchase from "@/models/Session";

interface PurchaseItem {
  medicineId: string;
  shopId: string;
  quantity: number;
  pricePaid: number;
}

interface EnrichedItem extends PurchaseItem {
  medicineName: string;
  brand: string;
  form: string;
  shopName: string;
}

interface ShopData {
  name?: string;
  location?: string;
  phone?: string;
}

interface MedicineData {
  name?: string;
  brand?: string;
  form?: string;
}

interface ShopSummary {
  shopId: string;
  shopName: string;
  shopLocation: string;
  shopPhone: string;
  subtotal: number;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get user from email
    const User = (await import("@/models/User")).default;
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch all purchases for this user, sorted by date descending
    const purchases = await Purchase.find({ userId: user._id })
      .sort({ date: -1 })
      .lean();

    // Enrich purchases with medicine and shop details
    const Medicine = (await import("@/models/Medicine")).default;
    const Shop = (await import("@/models/Shop")).default;

    const enrichedPurchases = await Promise.all(
      purchases.map(async (purchase: Record<string, unknown>) => {
        const items = purchase.items as PurchaseItem[];

        // Fetch unique shops and medicines once
        const uniqueShopIds = [...new Set(items.map((i) => i.shopId))];
        const shopsMap: Record<string, ShopData> = {};

        await Promise.all(
          uniqueShopIds.map(async (shopId) => {
            const shop = (await Shop.findOne({
              shopId,
            }).lean()) as ShopData | null;
            shopsMap[shopId] = {
              name: shop?.name,
              location: shop?.location,
              phone: shop?.phone,
            };
          }),
        );

        const medicineIds = [...new Set(items.map((i) => i.medicineId))];
        const medicinesMap: Record<string, MedicineData> = {};

        await Promise.all(
          medicineIds.map(async (medicineId) => {
            const medicine = (await Medicine.findOne({
              medicineId,
            }).lean()) as MedicineData | null;
            medicinesMap[medicineId] = {
              name: medicine?.name,
              brand: medicine?.brand,
              form: medicine?.form,
            };
          }),
        );

        // Enrich items with cached data
        const enrichedItems: EnrichedItem[] = items.map(
          (item: PurchaseItem) => {
            const medicine = medicinesMap[item.medicineId];
            const shop = shopsMap[item.shopId];
            return {
              ...item,
              medicineName: medicine?.name || "Unknown",
              brand: medicine?.brand || "",
              form: medicine?.form || "",
              shopName: shop?.name || "Unknown",
            };
          },
        );

        // Build shops summary
        const shopSummaryMap: Record<string, ShopSummary> = {};
        enrichedItems.forEach((item: EnrichedItem) => {
          if (!shopSummaryMap[item.shopId]) {
            const shop = shopsMap[item.shopId];
            shopSummaryMap[item.shopId] = {
              shopId: item.shopId,
              shopName: item.shopName,
              shopLocation: shop?.location || "",
              shopPhone: shop?.phone || "",
              subtotal: 0,
            };
          }
          shopSummaryMap[item.shopId].subtotal +=
            item.pricePaid * item.quantity;
        });

        return {
          ...purchase,
          items: enrichedItems,
          shops: Object.values(shopSummaryMap),
        };
      }),
    );

    return NextResponse.json(enrichedPurchases);
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchases" },
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

    // Get user from email
    const User = (await import("@/models/User")).default;
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { purchaseId, date, items, total, status } = body;

    if (!purchaseId || !date || !items || total === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create purchase record
    const purchase = await Purchase.create({
      userId: user._id,
      purchaseId,
      date: new Date(date),
      items,
      total,
      status: status || "complete",
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase:", error);
    const msg =
      error instanceof Error ? error.message : "Failed to create purchase";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
