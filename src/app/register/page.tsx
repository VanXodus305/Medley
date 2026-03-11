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
    shopPhone: "",
    shopLocation: "",
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

    if (userType === "vendor" && !formData.shopPhone) {
      toast.error("Shop phone number is required");
      return;
    }

    if (userType === "vendor" && !formData.shopLocation) {
      toast.error("Shop location is required");
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
          shopPhone: formData.shopPhone,
          shopLocation: formData.shopLocation,
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-lime-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-12 right-10 h-60 w-60 rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="absolute bottom-12 -left-10 h-72 w-72 rounded-full bg-lime-200/40 blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-4 py-12 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full bg-emerald-100/80 px-4 py-1 text-sm font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Quick setup, personalized dashboard
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold text-slate-900 md:text-5xl">
              Complete your profile to unlock Medley.
            </h1>
            <p className="text-lg text-slate-600">
              Tell us a little about you so we can tailor recommendations,
              nearby pharmacies, and your personalized dashboard.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {["Profile details", "Choose a role", "Start exploring"].map(
              (step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-emerald-100 bg-white/80 p-4 text-sm text-slate-700 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase text-emerald-600">
                    Step {index + 1}
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">{step}</p>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="w-full max-w-2xl flex-1">
          <Card className="border border-emerald-100 bg-white/90 shadow-xl backdrop-blur">
            <CardBody className="gap-6 p-8">
              {/* Header */}
              <div className="space-y-2">
                <h2 className="text-3xl font-semibold text-slate-900">
                  Welcome {session.user?.name}
                </h2>
                <p className="text-slate-600">
                  Let&apos;s finish setting up your Medley account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* User Type Selection */}
                <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <label className="text-sm font-semibold text-slate-700">
                    I am a: <span className="text-rose-500">*</span>
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
                <div className="grid gap-4 sm:grid-cols-2">
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
                    className="sm:col-span-2"
                  />
                </div>

                {/* Vendor-Specific Fields */}
                {userType === "vendor" && (
                  <div className="space-y-4 rounded-2xl border border-emerald-200 bg-white p-4">
                    <h3 className="font-semibold text-slate-900">
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

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="Shop Phone"
                        name="shopPhone"
                        value={formData.shopPhone}
                        onChange={handleInputChange}
                        placeholder="Enter your pharmacy phone number"
                        isRequired={userType === "vendor"}
                        variant="bordered"
                      />

                      <Input
                        label="Shop Location"
                        name="shopLocation"
                        value={formData.shopLocation}
                        onChange={handleInputChange}
                        placeholder="Enter your pharmacy location/address"
                        isRequired={userType === "vendor"}
                        variant="bordered"
                      />
                    </div>

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
                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
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
    </div>
  );
}
