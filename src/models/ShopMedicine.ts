import { Schema, models, model, Types } from "mongoose";

const ShopMedicineSchema = new Schema(
  {
    shop: { type: Types.ObjectId, ref: "Shop", required: true },
    medicine: { type: Types.ObjectId, ref: "Medicine", required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

// Prevent duplicate entries (same shop & medicine)
ShopMedicineSchema.index({ shop: 1, medicine: 1 }, { unique: true });

// For fast lookups
ShopMedicineSchema.index({ medicine: 1 }); // find shops by medicine
ShopMedicineSchema.index({ shop: 1 }); // find medicines by shop
ShopMedicineSchema.index({ shop: 1, price: 1 }); // stock price check for shop
ShopMedicineSchema.index({ shop: 1, quantity: 1 }); //  stock check for a shop
ShopMedicineSchema.index({ medicine: 1, price: 1 }); // find cheapest medicine

const ShopMedicine =
  models["ShopMedicine"] || model("ShopMedicine", ShopMedicineSchema);
export default ShopMedicine;
