"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Card,
  CardBody,
  Spinner,
  RadioGroup,
  Radio,
} from "@heroui/react";
import toast from "react-hot-toast";
import { useUserInfo } from "@/hooks/useUserInfo";

type UserType = "customer" | "vendor";

export default function RegisterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    exists: isRegistered,
    userType: dbUserType,
    loading: userInfoLoading,
  } = useUserInfo();
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<UserType | "">("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    address: "",
    shopName: "",
    licenseNumber: "",
  });

  useEffect(() => {
    // Check if user is already registered and redirect to dashboard
    if (!userInfoLoading && isRegistered && dbUserType) {
      const redirectUrl = dbUserType === "vendor" ? "/vendor" : "/customer";
      router.push(redirectUrl);
    }
  }, [isRegistered, dbUserType, userInfoLoading, router]);

  useEffect(() => {
    // Set initial form data from session
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        email: session.user?.email || "",
        name: session.user?.name || "",
      }));
    }
  }, [session]);

  if (status === "loading" || userInfoLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <Spinner color="success" size="lg" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // If already registered, show loading and redirect will happen
  if (isRegistered && dbUserType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <Spinner color="success" size="lg" />
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userType) {
      toast.error("Please select a user type");
      return;
    }

    if (!formData.name || !formData.phoneNumber || !formData.address) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (userType === "vendor" && !formData.shopName) {
      toast.error("Please enter your shop name");
      return;
    }

    setIsLoading(true);

    try {
      const registrationData = {
        email: session.user?.email,
        name: formData.name || session.user?.name,
        userType,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        image: session.user?.image,
        ...(userType === "vendor" && {
          shopName: formData.shopName,
          licenseNumber: formData.licenseNumber,
        }),
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }

      toast.success("Registration successful!");
      const redirectUrl = userType === "vendor" ? "/vendor" : "/customer";
      // Refresh session to get userType
      router.refresh();
      router.push(redirectUrl);
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Failed to complete registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4 py-12">
      <div className="w-full max-w-2xl">
        <Card className="shadow-lg">
          <CardBody className="gap-6 p-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">
                Complete Your Profile
              </h1>
              <p className="text-gray-600">
                Welcome {session.user?.name}! Let's get you set up on Medley
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Type Selection */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">
                  I am a: <span className="text-red-500">*</span>
                </label>
                <RadioGroup
                  value={userType}
                  onValueChange={(value) => setUserType(value as UserType)}
                  orientation="horizontal"
                  className="gap-6"
                >
                  <Radio
                    value="customer"
                    className="cursor-pointer"
                    description="Looking for medicines and shops"
                  >
                    Customer
                  </Radio>
                  <Radio
                    value="vendor"
                    className="cursor-pointer"
                    description="Running a pharmacy"
                  >
                    Vendor
                  </Radio>
                </RadioGroup>
              </div>

              {/* Common Fields */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <Input
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  isRequired
                  variant="bordered"
                />

                <Input
                  label="Phone Number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  isRequired
                  variant="bordered"
                />

                <Input
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your address"
                  isRequired
                  variant="bordered"
                />
              </div>

              {/* Vendor-Specific Fields */}
              {userType === "vendor" && (
                <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-gray-900">
                    Pharmacy Details
                  </h3>

                  <Input
                    label="Shop Name"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleInputChange}
                    placeholder="Enter your pharmacy name"
                    isRequired={userType === "vendor"}
                    variant="bordered"
                  />

                  <Input
                    label="License Number (Optional)"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    placeholder="Enter your pharmacy license number"
                    variant="bordered"
                  />
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="bordered"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  color="success"
                  isLoading={isLoading}
                  disabled={isLoading || !userType}
                  className="flex-1"
                >
                  Complete Registration
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
