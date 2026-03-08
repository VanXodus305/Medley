const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Create a log file
const logFile = path.join(__dirname, "seed.log");
const logStream = fs.createWriteStream(logFile, { flags: "a" });

function log(message) {
  console.log(message);
  logStream.write(message + "\n");
}

log(`\n${new Date().toISOString()} - Starting seed script`);

// Helper function to convert distance strings to numbers (in kilometers)
function parseDistance(distanceStr) {
  if (typeof distanceStr === "number") return distanceStr;
  if (!distanceStr) return 0;

  const str = distanceStr.toLowerCase().trim();

  // Extract number
  const match = str.match(/([\d.]+)/);
  if (!match) return 0;

  const num = parseFloat(match[1]);

  // Convert to kilometers
  if (str.includes("km")) {
    return num;
  } else if (str.includes("m")) {
    return num / 1000; // Convert meters to km
  }

  return num;
}

// Import models
const medicineSchema = new mongoose.Schema({
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
  uses: [{ type: String }],
  manufacturer: { type: String },
  composition: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const shopSchema = new mongoose.Schema({
  shopId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  owner: { type: String, required: true },
  phone: { type: String, required: true },
  location: { type: String, required: true },
  distance_from_user: { type: Number }, // in kilometers
  openingTime: { type: String },
  closingTime: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const shopMedicineSchema = new mongoose.Schema({
  shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Medicine =
  mongoose.models.Medicine || mongoose.model("Medicine", medicineSchema);
const Shop = mongoose.models.Shop || mongoose.model("Shop", shopSchema);
const ShopMedicine =
  mongoose.models.ShopMedicine || mongoose.model("ShopMedicine", shopMedicineSchema);

const MONGODB_URI = process.env.MONGODB_URI;

async function seedDatabase() {
  try {
    log("🔄 Connecting to MongoDB...");
    if (!MONGODB_URI) {
      throw new Error(
        "MONGODB_URI environment variable is not set. Please add it to your .env file.",
      );
    }

    await mongoose.connect(MONGODB_URI);
    log("✅ Connected to MongoDB");

    // Read JSON files
    const medicinesPath = path.join(__dirname, "../src/data/medicines.json");
    const shopsPath = path.join(__dirname, "../src/data/shops.json");

    if (!fs.existsSync(medicinesPath)) {
      throw new Error(`Medicines JSON file not found at ${medicinesPath}`);
    }
    if (!fs.existsSync(shopsPath)) {
      throw new Error(`Shops JSON file not found at ${shopsPath}`);
    }

    const medicinesData = JSON.parse(fs.readFileSync(medicinesPath, "utf-8"));
    const shopsData = JSON.parse(fs.readFileSync(shopsPath, "utf-8"));

    log(`\n📊 Data loaded:`);
    log(`   - Medicines: ${medicinesData.length} records`);
    log(`   - Shops: ${shopsData.length} records`);

    // Clear existing data
    log("\n🧹 Clearing existing data...");
    await Medicine.deleteMany({});
    await Shop.deleteMany({});
    await ShopMedicine.deleteMany({});
    
    // Drop all indexes except _id to remove stale unique constraints
    try {
      await Shop.collection.dropIndexes();
      log("   - Dropped old Shop indexes");
    } catch (err) {
      if (err.code !== 27) {
        // 27 = no indexes to drop
        log(`   ⚠️  Warning dropping indexes: ${err.message}`);
      }
    }
    
    try {
      await ShopMedicine.collection.dropIndexes();
      log("   - Dropped old ShopMedicine indexes");
    } catch (err) {
      if (err.code !== 27) {
        log(`   ⚠️  Warning dropping indexes: ${err.message}`);
      }
    }
    
    log("✅ Existing data cleared");

    // Transform and insert medicines
    log("\n💊 Uploading medicines...");
    const transformedMedicines = medicinesData.map((med) => ({
      medicineId: med.id,
      name: med.name,
      brand: med.brand,
      form: med.form,
      uses: med.uses || [],
    }));

    const medicineResult = await Medicine.insertMany(transformedMedicines);
    log(`✅ ${medicineResult.length} medicines uploaded successfully`);

    // Create a map of medicineId to MongoDB _id
    const medicineIdMap = {};
    medicineResult.forEach((med) => {
      medicineIdMap[med.medicineId] = med._id;
    });

    // Transform and insert shops
    log("\n🏪 Uploading shops...");
    const transformedShops = shopsData.map((shop) => ({
      shopId: shop.id,
      name: shop.name,
      owner: shop.owner,
      phone: shop.phone,
      location: shop.location,
      distance_from_user: parseDistance(shop.distance_from_user),
    }));

    const shopResult = await Shop.insertMany(transformedShops);
    log(`✅ ${shopResult.length} shops uploaded successfully`);

    // Create ShopMedicine entries
    log("\n🔗 Linking medicines to shops...");
    const shopMedicineData = [];
    const shopMedicineMap = new Map(); // To prevent duplicates

    for (let i = 0; i < shopsData.length; i++) {
      const shop = shopsData[i];
      const shopDoc = shopResult[i];

      if (!shop.medicines || shop.medicines.length === 0) {
        log(`⚠️  Shop "${shop.name}" has no medicines`);
        continue;
      }

      // Group medicines by medicine_id to get the latest entry
      const medicinesByID = {};
      for (const medItem of shop.medicines) {
        const medId = medItem.medicine_id;
        // Keep the last occurrence (or you could keep first, doesn't matter for this data)
        medicinesByID[medId] = medItem;
      }

      // Now create ShopMedicine entries
      for (const medId in medicinesByID) {
        const medItem = medicinesByID[medId];
        const medicineObjectId = medicineIdMap[medId];
        
        if (medicineObjectId) {
          // Create unique key to prevent duplicate entries
          const key = `${shopDoc._id}-${medicineObjectId}`;
          
          if (!shopMedicineMap.has(key)) {
            shopMedicineData.push({
              shop: shopDoc._id,
              medicine: medicineObjectId,
              quantity: medItem.quantity || 0,
              price: medItem.price || 0,
            });
            shopMedicineMap.set(key, true);
          }
        } else {
          log(
            `⚠️  Medicine "${medId}" not found in medicineIdMap for shop "${shop.name}"`
          );
        }
      }
    }

    let shopMedicineResult = [];
    if (shopMedicineData.length > 0) {
      try {
        shopMedicineResult = await ShopMedicine.insertMany(shopMedicineData, {
          ordered: false,
        });
        log(`✅ ${shopMedicineResult.length} shop-medicine relationships created`);
      } catch (insertError) {
        // If there are some errors due to duplicates, still log success for inserted documents
        if (insertError.insertedDocs && insertError.insertedDocs.length > 0) {
          log(
            `⚠️  Inserted ${insertError.insertedDocs.length} shop-medicine relationships (${insertError.writeErrors.length} duplicates skipped)`
          );
          shopMedicineResult = insertError.insertedDocs;
        } else {
          throw insertError;
        }
      }
    } else {
      log("⚠️  No shop-medicine relationships to create");
    }

    log("\n🎉 Database seeding completed successfully!");
    log(`\n📈 Summary:`);
    log(`   - Total medicines: ${medicineResult.length}`);
    log(`   - Total shops: ${shopResult.length}`);
    log(`   - Total shop-medicine links: ${shopMedicineResult.length}`);

    await mongoose.disconnect();
    log("\n✅ Disconnected from MongoDB");
    logStream.end();
    process.exit(0);
  } catch (error) {
    log("\n❌ Error during seeding: " + error.message);
    if (error.errors) {
      log("Validation errors: " + JSON.stringify(error.errors));
    }
    log("Full error: " + JSON.stringify(error, null, 2));
    try {
      await mongoose.disconnect();
    } catch {}
    logStream.end();
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
