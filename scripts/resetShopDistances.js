import mongoose from "mongoose";

// Load environment variables
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const ShopSchema = new mongoose.Schema({
  shopId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  phone: { type: String, required: true },
  location: { type: String, required: true },
  distance_from_user: { type: Number },
  openingTime: { type: String },
  closingTime: { type: String },
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

ShopSchema.index({ owner: 1 });

const Shop = mongoose.model("Shop", ShopSchema);

function generateRealisticDistance() {
  const random = Math.random();

  // Realistic distribution:
  // 30% - Very close (0.2 to 0.8 km)
  // 40% - Close (0.8 to 2.5 km)
  // 20% - Moderate (2.5 to 5 km)
  // 10% - Far (5 to 15 km)

  if (random < 0.3) {
    return parseFloat((Math.random() * 0.6 + 0.2).toFixed(1));
  } else if (random < 0.7) {
    return parseFloat((Math.random() * 1.7 + 0.8).toFixed(1));
  } else if (random < 0.9) {
    return parseFloat((Math.random() * 2.5 + 2.5).toFixed(1));
  } else {
    return parseFloat((Math.random() * 10 + 5).toFixed(1));
  }
}

async function resetDistances() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "");
    console.log("Connected to MongoDB");

    const shops = await Shop.find({});
    console.log(`Found ${shops.length} shops to update`);

    let updated = 0;
    for (const shop of shops) {
      shop.distance_from_user = generateRealisticDistance();
      await shop.save();
      updated++;
      if (updated % 100 === 0) {
        console.log(`Updated ${updated} shops...`);
      }
    }

    console.log(
      `✅ Successfully updated ${updated} shops with realistic distances`,
    );
    process.exit(0);
  } catch (error) {
    console.error("Error resetting distances:", error);
    process.exit(1);
  }
}

resetDistances();
