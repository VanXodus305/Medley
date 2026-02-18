import { Schema, models, model, Types } from "mongoose";

const ShopSchema = new Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    openingTime: { type: String, required: true },
    closingTime: { type: String, required: true },
    owner: { type: Types.ObjectId, ref: "User", required: true, unique: true },
  },
  {
    timestamps: true,
  }
);

export default models.Shop || model("Shop", ShopSchema);
