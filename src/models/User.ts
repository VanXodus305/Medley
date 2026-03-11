import { Schema, models, model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    image: String,
    userType: {
      type: String,
      enum: ["customer", "vendor"],
      required: true,
    },
    phoneNumber: String,
    address: String,
    // Customer-specific fields
    // (can be added later for customer preferences)
    // list: [
    //   {
    //     shop: { type: Schema.Types.ObjectId, ref: "Shop", required: false },
    //     medicine: {
    //       type: Schema.Types.ObjectId,
    //       ref: "Medicine",
    //       required: false,
    //     },
    //     quantity: { type: Number, default: 1 },
    //     _id: false,
    //   },
    // ],
  },
  {
    timestamps: true,
  },
);

const User = models["User"] || model("User", UserSchema);
export default User;
