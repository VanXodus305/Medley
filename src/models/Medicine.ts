import { Schema, models, model } from "mongoose";

const MedicineSchema = new Schema(
  {
    name: { type: String, required: true },
    manufacturer: { type: String },
    composition: [{ type: String }], // key ingredients
    category: {
      type: String,
      required: true,
      enum: ["Tablet", "Syrup", "Ointment", "Capsule"], // restrict values
    }, // Tablet or syrup or ointment
  },
  {
    timestamps: true,
  },
);

const Medicine = models["Medicine"] || model("Medicine", MedicineSchema);
export default Medicine;
