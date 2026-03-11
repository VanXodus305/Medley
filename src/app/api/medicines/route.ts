import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Medicine from "@/models/Medicine";

export async function GET() {
  try {
    await connectDB();
    const medicines = await Medicine.find({}).lean();
    // Return _id so vendors can reference it when adding to their shop
    const result = medicines.map((med: Record<string, unknown>) => ({
      _id: (med._id as { toString: () => string }).toString(),
      medicineId: med.medicineId,
      name: med.name,
      brand: med.brand,
      form: med.form,
      uses: med.uses || [],
      manufacturer: med.manufacturer,
    }));
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching medicines:", error);
    return NextResponse.json({ error: "Failed to fetch medicines" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, brand, form, uses, manufacturer, composition } = body;

    if (!name || !form) {
      return NextResponse.json({ error: "name and form are required" }, { status: 400 });
    }

    // Generate a unique medicineId
    const medicineId = `med_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const medicine = await Medicine.create({
      medicineId,
      name: name.trim(),
      brand: brand?.trim() || undefined,
      form,
      uses: Array.isArray(uses) ? uses : (uses ? [uses] : []),
      manufacturer: manufacturer?.trim() || undefined,
      composition: Array.isArray(composition) ? composition : (composition ? [composition] : []),
    });

    return NextResponse.json(
      {
        _id: medicine._id.toString(),
        medicineId: medicine.medicineId,
        name: medicine.name,
        brand: medicine.brand,
        form: medicine.form,
        uses: medicine.uses,
        manufacturer: medicine.manufacturer,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating medicine:", error);
    const msg = error instanceof Error ? error.message : "Failed to create medicine";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
