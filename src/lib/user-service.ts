import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function getUserByEmail(email: string) {
  try {
    await connectDB();
    const user = await User.findOne({ email });
    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export async function createUser(userData: {
  email: string;
  name: string;
  userType: "customer" | "vendor";
  phoneNumber?: string;
  address?: string;
  image?: string;
  shopName?: string;
  licenseNumber?: string;
}) {
  try {
    await connectDB();
    const user = new User(userData);
    await user.save();
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export async function updateUser(
  email: string,
  userData: Partial<{
    name: string;
    userType: "customer" | "vendor";
    phoneNumber: string;
    address: string;
    image: string;
    shopName: string;
    licenseNumber: string;
  }>,
) {
  try {
    await connectDB();
    const user = await User.findOneAndUpdate({ email }, userData, {
      new: true,
    });
    return user;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}
