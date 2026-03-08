import { Schema, models, model } from "mongoose";

const ShopSchema = new Schema(
  {
    shopId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    owner: { type: String, required: true },
    phone: { type: String, required: true },
    location: { type: String, required: true },
    distance_from_user: { type: Number }, // in kilometers
    openingTime: { type: String },
    closingTime: { type: String },
  },
  {
    timestamps: true,
  },
);

const Shop = models["Shop"] || model("Shop", ShopSchema);
export default Shop;
