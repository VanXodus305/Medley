import { Schema, models, model } from "mongoose";

const MedicineSchema = new Schema(
  {
    medicineId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    brand: { type: String },
    form: {
      type: String,
      required: true,
      enum: [
        "Capsule",
        "Cream",
        "Drops",
        "Ear Drops",
        "Eye Drops",
        "Film",
        "Gel",
        "Granules",
        "Gum",
        "Implant",
        "Inhaled Gas",
        "Inhaler",
        "Injection",
        "Lotion",
        "Lozenge",
        "Mouthwash",
        "Nasal Spray",
        "Ointment",
        "Paste",
        "Patch",
        "Powder",
        "Shampoo",
        "Solution",
        "Spray",
        "Suspension",
        "Syrup",
        "Tablet",
        "Toothpaste",
        "Wafer",
      ],
    },
    uses: [{ type: String }], // e.g., ["Fever", "Headache"]
    manufacturer: { type: String },
    composition: [{ type: String }],
  },
  {
    timestamps: true,
  },
);

const Medicine = models["Medicine"] || model("Medicine", MedicineSchema);
export default Medicine;
