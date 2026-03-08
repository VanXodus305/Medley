import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Medicine from "@/models/Medicine";

interface MedicineDoc {
  medicineId: string;
  name: string;
  brand: string;
  form: string;
  uses: string[];
}

export async function GET() {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || "");
    }

    const medicines = (await Medicine.find({}).lean()) as unknown as MedicineDoc[];

    // Transform the data to match the JSON format (id instead of _id, medicineId)
    const transformedMedicines = medicines.map((med) => ({
      id: med.medicineId,
      name: med.name,
      brand: med.brand,
      form: med.form,
      uses: med.uses || [],
    }));

    return NextResponse.json(transformedMedicines);
  } catch (error) {
    console.error("Error fetching medicines:", error);
    return NextResponse.json(
      { error: "Failed to fetch medicines" },
      { status: 500 }
    );
  }
}
