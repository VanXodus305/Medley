"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Button, Spinner, Tabs, Tab } from "@heroui/react";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useUserProfile } from "@/hooks/useUserProfile";
import Link from "next/link";
import {
  FaPills,
  FaShoppingCart,
  FaSearch,
  FaMapMarkerAlt,
  FaTimes,
  FaTrash,
  FaPlus,
  FaMinus,
  FaChevronDown,
  FaPhone,
  FaUser,
  FaBoxOpen,
  FaArrowLeft,
  FaHistory,
  FaCheckCircle,
  FaStore,
} from "react-icons/fa";
import { GiReceiveMoney } from "react-icons/gi";

interface Medicine {
  id: string;
  name: string;
  uses: string[];
  brand: string;
  form: string;
}

interface Shop {
  id: string;
  name: string;
  owner: string;
  phone: string;
  location: string;
  distance_from_user: string;
  medicines: { medicine_id: string; quantity: number; price: number }[];
}

interface CartItem {
  medicine: Medicine;
  quantity: number;
  price: number;
}

interface PurchaseItem {
  medicineId: string;
  medicineName: string;
  brand: string;
  form: string;
  quantity: number;
  pricePaid: number; // actual price paid at shop
  shopId: string;
  shopName: string;
}

interface PurchaseRecord {
  _id?: string;
  purchaseId: string;
  date: string;
  items: PurchaseItem[];
  total: number;
  status?: "complete";
  shops: {
    shopId: string;
    shopName: string;
    shopLocation: string;
    shopPhone: string;
    subtotal: number;
  }[];
}

const PURCHASE_HISTORY_KEY = "medley_purchase_history";

const FORM_OPTIONS = [
  "All Forms",
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Cream",
  "Eye Drops",
  "Ear Drops",
  "Nasal Spray",
  "Inhaler",
  "Gel",
  "Ointment",
  "Solution",
  "Suspension",
  "Drops",
  "Powder",
  "Patch",
  "Spray",
];

const FORM_ICONS: Record<string, string> = {
  "All Forms": "✨",
  Tablet: "💊",
  Capsule: "💊",
  Syrup: "🧪",
  Cream: "🧴",
  Gel: "🧴",
  "Eye Drops": "👁️",
  "Ear Drops": "👂",
  "Nasal Spray": "💨",
  Inhaler: "🫁",
  Injection: "💉",
  Powder: "🥛",
  Solution: "🧪",
  Suspension: "🧪",
  Ointment: "🧴",
  Drops: "💧",
  Patch: "🩹",
  Spray: "💨",
};

export default function CustomerDashboard() {
  const router = useRouter();
  const {
    exists: isRegistered,
    userType,
    loading: userInfoLoading,
  } = useUserInfo();
  const { profile, loading: profileLoading } = useUserProfile();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [medicineSearchTerm, setMedicineSearchTerm] = useState("");
  const [selectedForm, setSelectedForm] = useState("All Forms");
  const [priceSearchTerm, setPriceSearchTerm] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const cartRef = useRef<HTMLDivElement>(null);

  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [shopMedSearch, setShopMedSearch] = useState("");

  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>([]);

  useEffect(() => {
    // Load purchase history from database
    const loadPurchaseHistory = async () => {
      try {
        const res = await fetch("/api/purchases");
        if (res.ok) {
          const purchases = await res.json();
          setPurchaseHistory(purchases);
        }
      } catch (error) {
        console.error("Failed to load purchase history:", error);
        // Fallback to localStorage if API fails
        try {
          const stored = localStorage.getItem(PURCHASE_HISTORY_KEY);
          if (stored) setPurchaseHistory(JSON.parse(stored));
        } catch {}
      }
    };
    loadPurchaseHistory();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      setDataError(null);
      try {
        // Load all medicines and shops
        const [medicinesRes, shopsRes] = await Promise.all([
          fetch("/api/medicines?limit=1000&skip=0"),
          fetch("/api/shops?limit=50&skip=0"),
        ]);
        if (!medicinesRes.ok) throw new Error("Failed to load medicines");
        if (!shopsRes.ok) throw new Error("Failed to load shops");
        const [medicinesJson, shopsJson] = await Promise.all([
          medicinesRes.json(),
          shopsRes.json(),
        ]);
        setMedicines(medicinesJson);
        setShops(shopsJson);
      } catch (err: unknown) {
        const error = err as { message?: string } | null;
        setDataError(error?.message ?? "Something went wrong");
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(e.target as Node))
        setShowCart(false);
    };
    if (showCart) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCart]);

  const addToCart = (medicine: Medicine) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.medicine.id === medicine.id,
      );
      if (existingItem) {
        return prevCart.map((item) =>
          item.medicine.id === medicine.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        return [...prevCart, { medicine, quantity: 1, price: 0 }];
      }
    });
  };

  const removeFromCart = (medicineId: string) =>
    setCart(cart.filter((item) => item.medicine.id !== medicineId));

  const updateQty = (medicineId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.medicine.id !== medicineId) return item;
          const newQty = item.quantity + delta;
          return newQty <= 0 ? null : { ...item, quantity: newQty };
        })
        .filter(Boolean) as CartItem[],
    );
  };

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const getMedicineById = (id: string): Medicine | undefined =>
    medicines.find((m) => m.id === id);

  const filteredMedicines = medicines.filter((med) => {
    const matchSearch =
      !medicineSearchTerm ||
      med.name.toLowerCase().includes(medicineSearchTerm.toLowerCase()) ||
      med.brand.toLowerCase().includes(medicineSearchTerm.toLowerCase());
    const matchForm = selectedForm === "All Forms" || med.form === selectedForm;
    return matchSearch && matchForm;
  });

  // const globalFilteredMedicines = medicines.filter(
  //   (med) =>
  //     med.name.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
  //     med.brand.toLowerCase().includes(globalSearchTerm.toLowerCase()),
  // );
  // const globalFilteredShops = shops.filter(
  //   (shop) =>
  //     shop.name.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
  //     shop.owner.toLowerCase().includes(globalSearchTerm.toLowerCase()),
  // );

  useEffect(() => {
    if (!userInfoLoading) {
      if (!isRegistered) router.push("/register");
      else if (userType && userType !== "customer") router.push("/vendor");
    }
  }, [isRegistered, userType, userInfoLoading, router]);

  if (userInfoLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <Spinner color="success" size="lg" />
      </div>
    );
  }

  if (!isRegistered || !profile) return null;

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <Spinner color="success" size="lg" />
          <p className="mt-3 text-sm text-gray-500">
            Loading medicines & shops…
          </p>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center px-6">
          <p className="text-red-500 font-semibold text-lg mb-2">
            Failed to load data
          </p>
          <p className="text-sm text-gray-500 mb-4">{dataError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const CartDropdown = () => (
    <div
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl z-[200] overflow-hidden"
      style={{
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
        style={{ background: "linear-gradient(to right, #f0fdf4, #f0fdfa)" }}
      >
        <div className="flex items-center gap-2">
          <FaShoppingCart className="text-emerald-600 w-4 h-4" />
          <span className="font-bold text-gray-800 text-sm">My Cart</span>
          {cartCount > 0 && (
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {cartCount}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCart(false)}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <FaTimes className="w-3.5 h-3.5" />
        </button>
      </div>

      {cart.length === 0 ? (
        <div className="py-10 text-center px-6">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FaShoppingCart className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-500">
            Your cart is empty
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Add medicines from the Browse tab
          </p>
        </div>
      ) : (
        <>
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
            {cart.map((item) => (
              <div
                key={item.medicine.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-lg flex-shrink-0">
                  {FORM_ICONS[item.medicine.form] || "💊"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {item.medicine.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {item.medicine.brand} · {item.medicine.form}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => updateQty(item.medicine.id, -1)}
                    className="w-6 h-6 rounded-full bg-gray-100 hover:bg-emerald-100 text-gray-600 hover:text-emerald-700 flex items-center justify-center transition-colors"
                  >
                    <FaMinus className="w-2 h-2" />
                  </button>
                  <span className="text-sm font-bold text-gray-800 w-5 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQty(item.medicine.id, 1)}
                    className="w-6 h-6 rounded-full bg-gray-100 hover:bg-emerald-100 text-gray-600 hover:text-emerald-700 flex items-center justify-center transition-colors"
                  >
                    <FaPlus className="w-2 h-2" />
                  </button>
                </div>
                <div className="text-right flex-shrink-0 ml-1">
                  <button
                    onClick={() => removeFromCart(item.medicine.id)}
                    className="text-red-400 hover:text-red-600 transition-colors mt-0.5"
                  >
                    <FaTrash className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-gray-500">
                {cartCount} item{cartCount !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Find Nearby Pharmacies*/}
            <button
              onClick={() => {
                setShowCart(false);
                localStorage.setItem("medley_cart", JSON.stringify(cart));
                const ids = cart.map((i) => i.medicine.id).join(",");
                router.push(`find-pharmacies?meds=${ids}`);
              }}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #10b981, #0d9488)",
              }}
            >
              <FaMapMarkerAlt className="w-3.5 h-3.5" />
              Find Nearby Pharmacies →
            </button>
          </div>
        </>
      )}
    </div>
  );

  //Shop Details
  const ShopDetailPanel = ({ shop }: { shop: Shop }) => {
    const shopMeds = shop.medicines
      .map((entry) => {
        const med = getMedicineById(entry.medicine_id);
        if (!med) return null;
        return { ...med, quantity: entry.quantity, price: entry.price };
      })
      .filter(Boolean) as (Medicine & { quantity: number; price: number })[];

    const filtered = shopMeds.filter(
      (m) =>
        !shopMedSearch ||
        m.name.toLowerCase().includes(shopMedSearch.toLowerCase()) ||
        m.brand.toLowerCase().includes(shopMedSearch.toLowerCase()) ||
        m.form.toLowerCase().includes(shopMedSearch.toLowerCase()) ||
        m.uses.some((u) =>
          u.toLowerCase().includes(shopMedSearch.toLowerCase()),
        ),
    );

    return (
      <div
        className="fixed inset-0 z-[300] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      >
        <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
          <div
            className="px-6 py-5 border-b border-gray-100 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #ecfdf5, #f0fdfa)" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedShop(null);
                    setShopMedSearch("");
                  }}
                  className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:border-emerald-300 transition-colors shadow-sm flex-shrink-0"
                >
                  <FaArrowLeft className="w-3.5 h-3.5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 leading-tight">
                    {shop.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                      <FaMapMarkerAlt className="text-emerald-500 w-3 h-3" />{" "}
                      {shop.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      {shop.distance_from_user}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedShop(null);
                  setShopMedSearch("");
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-700 shadow-sm">
                <FaUser className="text-emerald-500 w-3 h-3" /> {shop.owner}
              </span>
              <span className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-700 shadow-sm">
                <FaPhone className="text-emerald-500 w-3 h-3" /> {shop.phone}
              </span>
              <span className="inline-flex items-center gap-2 bg-white border border-emerald-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm">
                <FaBoxOpen className="w-3 h-3" /> {shopMeds.length} medicines
                available
              </span>
            </div>
          </div>

          <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0 bg-gray-50/60">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, brand, form or use…"
                value={shopMedSearch}
                onChange={(e) => setShopMedSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 bg-white transition-all"
              />
              {shopMedSearch && (
                <button
                  onClick={() => setShopMedSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              )}
            </div>
            {shopMedSearch && (
              <p className="text-xs text-gray-400 mt-1.5 ml-1">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""} for
                &quot;{shopMedSearch}&quot;
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-16 px-6">
                <FaPills className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-500">
                  No medicines found
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Try a different search term
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map((med) => (
                  <div
                    key={med.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/70 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-center text-xl flex-shrink-0">
                      {FORM_ICONS[med.form] || "💊"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900">
                          {med.name}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {med.form}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {med.brand}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {med.uses.map((use) => (
                          <span
                            key={`${med.id}-${use}`}
                            className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100"
                          >
                            {use}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-center flex-shrink-0 hidden sm:block">
                      <p className="text-xs text-gray-400">Stock</p>
                      <p
                        className={`text-sm font-bold mt-0.5 ${med.quantity > 10 ? "text-emerald-600" : med.quantity > 0 ? "text-amber-500" : "text-red-500"}`}
                      >
                        {med.quantity > 0 ? med.quantity : "Out"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="text-base font-black text-emerald-600">
                        ₹{med.price}
                      </span>
                      {(() => {
                        const cartItem = cart.find(
                          (item) => item.medicine.id === med.id,
                        );
                        return cartItem ? (
                          <div className="flex items-center gap-1.5 bg-emerald-500 rounded-xl overflow-hidden">
                            <button
                              onClick={() => updateQty(med.id, -1)}
                              className="px-2.5 py-1.5 text-white hover:bg-emerald-600 transition-colors active:scale-95"
                            >
                              <FaMinus className="w-2.5 h-2.5" />
                            </button>
                            <span className="px-2 py-1.5 text-white font-bold text-xs min-w-[2rem] text-center">
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(med.id, 1)}
                              className="px-2.5 py-1.5 text-white hover:bg-emerald-600 transition-colors active:scale-95"
                            >
                              <FaPlus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              addToCart({
                                id: med.id,
                                name: med.name,
                                uses: med.uses,
                                brand: med.brand,
                                form: med.form,
                              })
                            }
                            disabled={med.quantity === 0}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              med.quantity === 0
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:shadow-emerald-200 hover:shadow-md active:scale-95"
                            }`}
                          >
                            <FaPlus className="w-2.5 h-2.5" />
                            {med.quantity === 0
                              ? "Out of stock"
                              : "Add to cart"}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  //Purchase History
  const PurchaseHistoryTab = () => {
    const totalSpent = purchaseHistory.reduce((sum, r) => sum + r.total, 0);
    const totalMedicines = purchaseHistory.reduce(
      (sum, r) => sum + r.items.reduce((s, i) => s + i.quantity, 0),
      0,
    );

    return (
      <div className="space-y-6">
        {purchaseHistory.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-black text-emerald-600">
                {purchaseHistory.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total Purchases</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-black text-teal-600">₹{totalSpent}</p>
              <p className="text-xs text-gray-500 mt-1">Total Spent</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm col-span-2 sm:col-span-1">
              <p className="text-2xl font-black text-blue-600">
                {totalMedicines}
              </p>
              <p className="text-xs text-gray-500 mt-1">Medicines Bought</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-6 py-4 border-b">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FaHistory className="w-5 h-5 text-emerald-600" />
              Purchase History
            </h3>
          </div>

          {purchaseHistory.length === 0 ? (
            <div className="text-center py-16 px-6">
              <FaHistory className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-base font-semibold text-gray-500">
                No purchases yet
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Browse medicines, add them to your cart, then find the best
                pharmacy for each one.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {purchaseHistory.map((record) => (
                <div
                  key={record.purchaseId}
                  className="px-4 sm:px-6 py-5 hover:bg-gray-50/50 transition-colors"
                >
                  {/* Record header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-gray-400">
                          {record.purchaseId}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(record.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {/* Shops involved */}
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {(record.shops ?? []).map((s) => (
                          <span
                            key={s.shopId}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-lg"
                          >
                            <FaStore className="w-3 h-3 text-emerald-500" />
                            {s.shopName}
                            <span className="text-gray-400 font-normal">
                              · ₹{s.subtotal}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-black text-emerald-600">
                        ₹{record.total}
                      </p>
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1">
                        <FaCheckCircle className="w-2.5 h-2.5" />{" "}
                        {record.status === "complete"
                          ? "Complete ✓"
                          : "Confirmed"}
                      </span>
                    </div>
                  </div>

                  {/* Medicine items */}
                  <div className="bg-gray-50 rounded-xl overflow-hidden">
                    {record.items.map((item, idx) => (
                      <div
                        key={`${record.purchaseId}-${item.medicineId}-${idx}`}
                        className={`flex items-center gap-3 px-4 py-2.5 ${
                          idx !== record.items.length - 1
                            ? "border-b border-gray-100"
                            : ""
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-sm flex-shrink-0">
                          {FORM_ICONS[item.form] || "💊"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-gray-800">
                            {item.medicineName}
                          </span>
                          <span className="text-xs text-gray-400 ml-2">
                            {item.brand} · {item.form}
                          </span>
                          {item.shopName && (
                            <span className="text-xs text-emerald-600 ml-2">
                              @ {item.shopName}
                            </span>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs text-gray-500">
                            ×{item.quantity} @ ₹{item.pricePaid}
                          </span>
                          <span className="text-sm font-bold text-gray-700 ml-2">
                            ₹{item.pricePaid * item.quantity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderNav = () => (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-emerald-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="text-2xl font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          Medley
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-gray-700 font-medium hidden sm:block">
            Welcome, {profile.name}
          </span>
          <div className="relative" ref={cartRef}>
            <button
              onClick={() => setShowCart((v) => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors text-amber-700 text-sm font-semibold"
            >
              <FaShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                  {cartCount}
                </span>
              )}
            </button>
            {showCart && <CartDropdown />}
          </div>
          <Button
            color="danger"
            variant="flat"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="hover:bg-red-100"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {renderNav()}

      <section className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-16">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome Back, {profile.name}! 👋
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Explore medicines, nearby shops, and manage your wellness journey.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FaHistory className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
              Total Purchases
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-600">
              {purchaseHistory.length}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <GiReceiveMoney className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
              Total Spent
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-teal-600">
              ₹{purchaseHistory.reduce((sum, r) => sum + r.total, 0)}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FaMapMarkerAlt className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
              Nearby Shops
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">
              {shops.length}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FaShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
              Cart Items
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-purple-600">
              {cart.length}
            </p>
          </div>
        </div>
        <Tabs
          fullWidth
          aria-label="Dashboard features"
          classNames={{
            tabList: "gap-2 border-b border-gray-200",
            cursor: "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg",
            tab: "px-4 sm:px-6 py-3 data-[selected=true]:text-white text-sm sm:text-base",
          }}
        >
          <Tab key="browse" title="Browse Medicines">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3 mb-5">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by name or brand…"
                    value={medicineSearchTerm}
                    onChange={(e) => setMedicineSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 bg-gray-50 transition-all"
                  />
                  {medicineSearchTerm && (
                    <button
                      onClick={() => setMedicineSearchTerm("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="relative sm:w-52">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none">
                    {FORM_ICONS[selectedForm] || "💊"}
                  </span>
                  <select
                    value={selectedForm}
                    onChange={(e) => setSelectedForm(e.target.value)}
                    className="w-full appearance-none pl-9 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 bg-gray-50 text-gray-700 font-medium cursor-pointer transition-all"
                  >
                    {FORM_OPTIONS.map((form) => (
                      <option key={form} value={form}>
                        {form}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
              {(medicineSearchTerm || selectedForm !== "All Forms") && (
                <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2.5 border-t border-gray-100">
                  <span className="text-xs text-gray-400">Filters:</span>
                  {medicineSearchTerm && (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium">
                      &quot;{medicineSearchTerm}&quot;
                      <button onClick={() => setMedicineSearchTerm("")}>
                        <FaTimes className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  )}
                  {selectedForm !== "All Forms" && (
                    <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-xs px-2.5 py-1 rounded-full font-medium">
                      {FORM_ICONS[selectedForm]} {selectedForm}
                      <button onClick={() => setSelectedForm("All Forms")}>
                        <FaTimes className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">
                    {filteredMedicines.length} result
                    {filteredMedicines.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FaPills className="w-5 h-5" />
                  {selectedForm !== "All Forms"
                    ? `${FORM_ICONS[selectedForm] || ""} ${selectedForm}s`
                    : "Available Medicines"}
                  {medicineSearchTerm && ` matching "${medicineSearchTerm}"`}
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    ({filteredMedicines.length})
                  </span>
                </h3>
              </div>
              {filteredMedicines.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                  {filteredMedicines.slice(0, 12).map((med) => (
                    <div
                      key={med.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl">
                          {FORM_ICONS[med.form] || "💊"}
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                          {med.form}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-base mb-0.5 leading-tight">
                        {med.name}
                      </h4>
                      <p className="text-xs text-gray-400 mb-2">{med.brand}</p>
                      <div className="flex flex-wrap gap-1 mb-3 flex-1">
                        {med.uses.slice(0, 2).map((use) => (
                          <span
                            key={`${med.id}-${use}`}
                            className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full border border-emerald-100"
                          >
                            {use}
                          </span>
                        ))}
                      </div>
                      {(() => {
                        const cartItem = cart.find(
                          (item) => item.medicine.id === med.id,
                        );
                        return cartItem ? (
                          <div className="mt-auto flex items-center justify-center gap-1 bg-emerald-500 rounded-xl overflow-hidden">
                            <button
                              onClick={() => updateQty(med.id, -1)}
                              className="px-3 py-2 text-white hover:bg-emerald-600 transition-colors active:scale-95"
                            >
                              <FaMinus className="w-3 h-3" />
                            </button>
                            <span className="px-3 py-2 text-white font-bold text-sm min-w-[2.5rem] text-center">
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(med.id, 1)}
                              className="px-3 py-2 text-white hover:bg-emerald-600 transition-colors active:scale-95"
                            >
                              <FaPlus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(med)}
                            className="mt-auto w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                            style={{
                              background:
                                "linear-gradient(135deg, #10b981, #0d9488)",
                            }}
                          >
                            <FaPlus className="w-3 h-3" />
                            Add to Cart
                          </button>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaPills className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No medicines found
                  </h3>
                  <p className="text-gray-500">
                    {medicineSearchTerm
                      ? `No results for &quot;${medicineSearchTerm}&quot;${selectedForm !== "All Forms" ? ` in ${selectedForm}` : ""}.`
                      : `No ${selectedForm} available.`}
                  </p>
                  <button
                    onClick={() => {
                      setMedicineSearchTerm("");
                      setSelectedForm("All Forms");
                    }}
                    className="mt-3 text-sm text-emerald-600 hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
              {filteredMedicines.length > 12 && (
                <p className="text-center text-sm text-gray-500 py-4">
                  Showing first 12 results. Refine your search for more.
                </p>
              )}
            </div>
          </Tab>

          {/* Nearby Pharmacies */}
          <Tab key="shops" title="Nearby Pharmacies">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FaMapMarkerAlt className="w-5 h-5 text-blue-600" />
                  Nearby Pharmacies
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    ({shops.length} found)
                  </span>
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {shops.slice(0, 9).map((shop) => (
                  <div
                    key={shop.id}
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5 flex flex-col"
                  >
                    <div
                      className="px-4 py-3 flex items-center justify-between"
                      style={{
                        background: "linear-gradient(135deg, #ecfdf5, #f0fdfa)",
                      }}
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                        {shop.name.charAt(0)}
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                        {shop.distance_from_user}
                      </span>
                    </div>
                    <div className="px-4 py-3 flex-1">
                      <h4 className="font-bold text-gray-900 text-sm leading-tight mb-2">
                        {shop.name}
                      </h4>
                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2">
                          <FaUser className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-gray-600">
                            {shop.owner}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <FaPhone className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-gray-600">
                            {shop.phone}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <FaMapMarkerAlt className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-gray-500 leading-tight">
                            {shop.location}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <FaBoxOpen className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                          <span className="text-xs font-semibold text-emerald-600">
                            {shop.medicines.length} medicines
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => {
                          setSelectedShop(shop);
                          setShopMedSearch("");
                        }}
                        className="w-full py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                        style={{
                          background:
                            "linear-gradient(135deg, #10b981, #0d9488)",
                        }}
                      >
                        View Shop →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {shops.length > 9 && (
                <p className="text-center text-sm text-gray-500 py-4 border-t">
                  Showing 9 nearest pharmacies.
                </p>
              )}
            </div>
          </Tab>

          {/* Purchase History */}
          <Tab key="history" title="Purchase History">
            <PurchaseHistoryTab />
          </Tab>

          {/* Check Prices */}
          <Tab key="prices" title="Check Prices">
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <GiReceiveMoney className="w-5 h-5" />
                Compare Medicine Prices
              </h3>
              <p className="text-gray-600 mb-6">
                Search for a medicine to see prices across nearby pharmacies.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <input
                  type="text"
                  placeholder="e.g., Paracetamol"
                  value={priceSearchTerm}
                  onChange={(e) => setPriceSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Button
                  color="success"
                  startContent={<FaSearch className="w-4 h-4" />}
                >
                  Search
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(() => {
                  const filteredMeds = medicines.filter((med) =>
                    med.name
                      .toLowerCase()
                      .includes(priceSearchTerm.toLowerCase()),
                  );
                  return filteredMeds.slice(0, 3).map((med) => {
                    let minPrice = Infinity,
                      maxPrice = 0,
                      minShop = "",
                      maxShop = "";
                    shops.forEach((shop) => {
                      const medInShop = shop.medicines.find(
                        (m) => m.medicine_id === med.id,
                      );
                      if (medInShop) {
                        if (medInShop.price < minPrice) {
                          minPrice = medInShop.price;
                          minShop = shop.name;
                        }
                        if (medInShop.price > maxPrice) {
                          maxPrice = medInShop.price;
                          maxShop = shop.name;
                        }
                      }
                    });
                    return (
                      <div
                        key={med.id}
                        className="bg-emerald-50 p-4 rounded-lg"
                      >
                        <h4 className="font-semibold text-emerald-800">
                          {med.name}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Lowest: ₹{minPrice === Infinity ? "N/A" : minPrice} (
                          {minShop || "N/A"})
                        </p>
                        <p className="text-sm text-gray-600">
                          Highest: ₹{maxPrice === 0 ? "N/A" : maxPrice} (
                          {maxShop || "N/A"})
                        </p>
                      </div>
                    );
                  });
                })()}
              </div>
              {priceSearchTerm &&
                medicines.filter((med) =>
                  med.name
                    .toLowerCase()
                    .includes(priceSearchTerm.toLowerCase()),
                ).length === 0 && (
                  <div className="text-center py-8 mt-4">
                    <p className="text-gray-500">
                      No medicines found for &quot;{priceSearchTerm}&quot;. Try
                      another search.
                    </p>
                  </div>
                )}
            </div>
          </Tab>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="bg-emerald-600 text-white py-8 text-center">
        <p className="text-lg mb-4">Need help? Contact us anytime.</p>
        <Link href="/">
          <Button
            color="default"
            variant="bordered"
            className="bg-white text-emerald-600 hover:bg-gray-100"
          >
            Get Support
          </Button>
        </Link>
      </div>

      {selectedShop && <ShopDetailPanel shop={selectedShop} />}
    </div>
  );
}
