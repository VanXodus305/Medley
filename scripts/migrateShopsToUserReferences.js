const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Create a log file
const logFile = path.join(__dirname, "migrate.log");
const logStream = fs.createWriteStream(logFile, { flags: "a" });

function log(message) {
  console.log(message);
  logStream.write(message + "\n");
}

log(`\n${new Date().toISOString()} - Starting migration script`);

// Import models
const userSchema = new mongoose.Schema(
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
    shopName: String,
    licenseNumber: String,
    list: [
      {
        shop: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Shop",
          required: false,
        },
        medicine: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Medicine",
          required: false,
        },
        quantity: { type: Number, default: 1 },
        _id: false,
      },
    ],
  },
  {
    timestamps: true,
  },
);

const shopSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
  },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Shop = mongoose.models.Shop || mongoose.model("Shop", shopSchema);

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateShops() {
  try {
    log("🔄 Connecting to MongoDB...");
    if (!MONGODB_URI) {
      throw new Error(
        "MONGODB_URI environment variable is not set. Please add it to your .env file.",
      );
    }

    await mongoose.connect(MONGODB_URI);
    log("✅ Connected to MongoDB");

    // Check for shops with string owners (old format)
    log("\n🔍 Checking for shops with string owners...");
    const shopsWithStringOwners = await Shop.find({
      owner: { $type: "string" },
    }).limit(5);

    if (shopsWithStringOwners.length === 0) {
      log("✅ All shops already have ObjectId owners. Migration not needed.");
      await mongoose.connection.close();
      return;
    }

    log(`Found ${shopsWithStringOwners.length} shops with string owners`);

    // Create test vendor users
    log("\n👥 Creating test vendor users...");
    const testVendors = [
      {
        name: "Vendor One",
        email: "vendor1@medley.com",
        shopName: "MediCare Pharmacy",
        phoneNumber: "+1-555-0001",
        address: "123 Main St",
      },
      {
        name: "Vendor Two",
        email: "vendor2@medley.com",
        shopName: "Health Plus",
        phoneNumber: "+1-555-0002",
        address: "456 Oak Ave",
      },
      {
        name: "Vendor Three",
        email: "vendor3@medley.com",
        shopName: "Wellness Pharmacy",
        phoneNumber: "+1-555-0003",
        address: "789 Pine Rd",
      },
      {
        name: "Vendor Four",
        email: "vendor4@medley.com",
        shopName: "Care Point",
        phoneNumber: "+1-555-0004",
        address: "321 Elm St",
      },
      {
        name: "Vendor Five",
        email: "vendor5@medley.com",
        shopName: "Pharma Hub",
        phoneNumber: "+1-555-0005",
        address: "654 Maple Dr",
      },
    ];

    const createdVendors = [];
    for (const vendorData of testVendors) {
      try {
        const existingVendor = await User.findOne({ email: vendorData.email });
        if (existingVendor) {
          log(`   - Vendor ${vendorData.email} already exists`);
          createdVendors.push(existingVendor);
        } else {
          const vendor = await User.create({
            ...vendorData,
            userType: "vendor",
            list: [],
          });
          log(`   - Created vendor: ${vendor.email}`);
          createdVendors.push(vendor);
        }
      } catch (error) {
        log(
          `   ⚠️  Error creating vendor ${vendorData.email}: ${error.message}`,
        );
      }
    }

    if (createdVendors.length === 0) {
      throw new Error("Failed to create test vendor users");
    }

    log(`✅ ${createdVendors.length} test vendors ready`);

    // Get all shops with string owners
    log("\n🔄 Migrating shops to use User ObjectId references...");
    const allShopsWithStringOwners = await Shop.find({
      owner: { $type: "string" },
    });

    log(`   Total shops to migrate: ${allShopsWithStringOwners.length}`);

    const shopsPerVendor = Math.ceil(
      allShopsWithStringOwners.length / createdVendors.length,
    );
    let migratedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < allShopsWithStringOwners.length; i++) {
      try {
        const shop = allShopsWithStringOwners[i];
        const vendorIndex =
          Math.floor(i / shopsPerVendor) % createdVendors.length;
        const vendor = createdVendors[vendorIndex];

        // Generate random distance between 0.5 and 50 km
        const distance_from_user =
          Math.round((Math.random() * 49.5 + 0.5) * 10) / 10;

        // Update shop owner to User ObjectId and set random distance
        await Shop.findByIdAndUpdate(
          shop._id,
          {
            owner: vendor._id,
            distance_from_user,
          },
          { new: true },
        );

        migratedCount++;
        if ((i + 1) % 100 === 0) {
          log(
            `   - Migrated ${i + 1}/${allShopsWithStringOwners.length} shops`,
          );
        }
      } catch (error) {
        errorCount++;
        log(`   ⚠️  Error migrating shop at index ${i}: ${error.message}`);
      }
    }

    log(`\n✅ Migration completed:`);
    log(`   - Successfully migrated: ${migratedCount} shops`);
    log(`   - Errors: ${errorCount}`);

    // Verify migration
    log("\n🔍 Verifying migration...");
    const shopsStillWithStringOwners = await Shop.find({
      owner: { $type: "string" },
    }).countDocuments();

    const shopsWithObjectIdOwners = await Shop.find({
      owner: { $type: "objectid" },
    }).countDocuments();

    log(`   - Shops with string owners: ${shopsStillWithStringOwners}`);
    log(`   - Shops with ObjectId owners: ${shopsWithObjectIdOwners}`);

    if (shopsStillWithStringOwners === 0) {
      log("\n✅ Migration successful! All shops now reference User ObjectIds.");
    } else {
      log("\n⚠️  Warning: Some shops still have string owners");
    }

    await mongoose.connection.close();
  } catch (error) {
    log(`\n❌ Migration error: ${error.message}`);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

migrateShops();
