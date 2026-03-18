import { Schema, models, model } from "mongoose";

const PurchaseSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    purchaseId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["complete", "pending", "cancelled"],
      default: "complete",
    },
    items: [
      {
        medicineId: String,
        shopId: String,
        quantity: Number,
        pricePaid: Number,
      },
    ],
    total: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries on userId
PurchaseSchema.index({ userId: 1, date: -1 });

const Purchase = models["Purchase"] || model("Purchase", PurchaseSchema);
export default Purchase;
