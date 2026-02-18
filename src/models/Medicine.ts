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
  }
);

export default models.Medicine || model("Medicine", MedicineSchema);
