"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import Link from "next/link";
import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaPhone,
  FaUser,
  FaCheckCircle,
  FaStore,
  FaShoppingCart,
  FaRupeeSign,
  FaTimes,
  FaWalking,
  FaRoute,
} from "react-icons/fa";

// ─── Types ────────────────────────────────────────────────────────────────────
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
  distance_from_user: string; // e.g. "1.2 km"
  medicines: { medicine_id: string; quantity: number; price: number }[];
}

interface CartItem {
  medicine: Medicine;
  quantity: number;
  price: number;
}

// A shop "stop" in the visit plan
interface ShopStop {
  shop: Shop;
  medicines: CartItem[]; // which cart medicines to pick up here
  backendMedicines: Array<{
    medicine_id: string;
    name: string;
    brand: string;
    form: string;
    price: number;
    quantity: number;
  }>; // backend medicine data with correct prices
  distanceNum: number; // parsed km for sorting
}

interface ReceivedEntry {
  medicineId: string;
  medicineName: string;
  brand: string;
  form: string;
  quantity: number;
  pricePaid: number;
  shopId: string;
  shopName: string;
}

const FORM_ICONS: Record<string, string> = {
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

// Parse "1.2 km" → 1.2
function parseKm(s: string): number {
  const n = parseFloat(s);
  return isNaN(n) ? 9999 : n;
}

// ── Greedy set-cover: repeatedly pick the nearest shop that covers the most
//    remaining unassigned medicines, until all are assigned or unavailable.
function buildVisitPlan(
  cartItems: CartItem[],
  shops: Shop[],
): {
  stops: ShopStop[];
  unavailable: CartItem[];
} {
  // Medicines that no shop stocks at all
  const unavailable: CartItem[] = cartItems.filter(
    (ci) =>
      !shops.some((s) =>
        s.medicines.some(
          (sm) => sm.medicine_id === ci.medicine.id && sm.quantity > 0,
        ),
      ),
  );

  let remaining = cartItems.filter(
    (ci) => !unavailable.some((u) => u.medicine.id === ci.medicine.id),
  );

  const stops: ShopStop[] = [];

  while (remaining.length > 0) {
    // Score every shop: how many of the remaining medicines does it stock?
    // Tiebreak by distance (nearest wins)
    let bestShop: Shop | null = null;
    let bestCovered: CartItem[] = [];

    for (const shop of shops) {
      const covered = remaining.filter((ci) =>
        shop.medicines.some(
          (sm) => sm.medicine_id === ci.medicine.id && sm.quantity > 0,
        ),
      );
      if (covered.length === 0) continue;

      const isBetter =
        covered.length > bestCovered.length ||
        (covered.length === bestCovered.length &&
          parseKm(shop.distance_from_user) <
            parseKm(bestShop?.distance_from_user ?? "9999 km"));

      if (isBetter) {
        bestShop = shop;
        bestCovered = covered;
      }
    }

    if (!bestShop || bestCovered.length === 0) break; // safety

    // Build backendMedicines from shop data for consistency
    const backendMedicines = bestCovered.map((item) => {
      const shopMed = bestShop!.medicines.find(
        (sm) => sm.medicine_id === item.medicine.id,
      );
      return {
        medicine_id: item.medicine.id,
        name: item.medicine.name,
        brand: item.medicine.brand,
        form: item.medicine.form,
        price: shopMed?.price ?? 0,
        quantity: shopMed?.quantity ?? 0,
      };
    });

    stops.push({
      shop: bestShop,
      medicines: bestCovered,
      backendMedicines,
      distanceNum: parseKm(bestShop.distance_from_user),
    });

    // Remove assigned medicines from remaining
    const coveredIds = new Set(bestCovered.map((c) => c.medicine.id));
    remaining = remaining.filter((ci) => !coveredIds.has(ci.medicine.id));
  }

  // Sort stops nearest-first
  stops.sort((a, b) => a.distanceNum - b.distanceNum);

  return { stops, unavailable };
}

// ─── Price Modal ──────────────────────────────────────────────────────────────
function PriceModal({
  item,
  shopName,
  listedPrice,
  onConfirm,
  onClose,
}: {
  item: CartItem;
  shopName: string;
  listedPrice: number;
  onConfirm: (price: number) => void;
  onClose: () => void;
}) {
  const [val, setVal] = useState(listedPrice > 0 ? String(listedPrice) : "");
  const num = Number(val);

  return (
    <div
      className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {FORM_ICONS[item.medicine.form] || "💊"}
              </span>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {item.medicine.name}
                </p>
                <p className="text-xs text-gray-400">
                  {item.medicine.brand} · qty ×{item.quantity}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200"
            >
              <FaTimes className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Collected from{" "}
            <span className="font-semibold text-gray-700">{shopName}</span>
            {listedPrice > 0 && (
              <span className="text-emerald-600">
                {" "}
                · listed ₹{listedPrice}/unit
              </span>
            )}
          </p>
        </div>

        <div className="px-6 py-5">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Actual price paid per unit (₹)
          </label>
          <div className="relative mb-3">
            <FaRupeeSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 w-3.5 h-3.5" />
            <input
              type="number"
              min="1"
              autoFocus
              placeholder={listedPrice > 0 ? String(listedPrice) : "0"}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="w-full pl-9 pr-4 py-3.5 text-xl font-black rounded-2xl border-2 border-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-50 transition-all"
            />
          </div>
          {num > 0 && (
            <p className="text-xs text-gray-400 mb-4">
              Total:{" "}
              <span className="font-black text-emerald-600 text-sm">
                ₹{num * item.quantity}
              </span>{" "}
              for ×{item.quantity}
            </p>
          )}
          <button
            disabled={num <= 0}
            onClick={() => onConfirm(num)}
            className="w-full py-3.5 rounded-2xl text-sm font-black text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] hover:opacity-90"
            style={{
              background:
                num > 0 ? "linear-gradient(135deg,#10b981,#0d9488)" : "#d1d5db",
            }}
          >
            ✓ Mark as Collected
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function FindPharmaciesContent() {
  const router = useRouter();

  const [shops, setShops] = useState<Shop[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // received[medicineId] = ReceivedEntry
  const [received, setReceived] = useState<Record<string, ReceivedEntry>>({});

  // modal: which medicine + which shop
  const [modal, setModal] = useState<{
    item: CartItem;
    shop: Shop;
    listedPrice: number;
  } | null>(null);

  const [done, setDone] = useState(false);

  // ── Load cart ──────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem("medley_cart");
      if (raw) setCartItems(JSON.parse(raw));
    } catch {
      setError("Could not read cart.");
    }
  }, []);

  // ── Fetch shops ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        // Load only first 100 nearby shops for better performance
        const res = await fetch("/api/shops?limit=100&skip=0");
        if (!res.ok) throw new Error("Failed to load shops");
        setShops(await res.json());
      } catch (e: unknown) {
        const error = e as { message?: string } | null;
        setError(error?.message ?? "Something went wrong");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Build visit plan ───────────────────────────────────────────────────────
  const [stops, setStops] = useState<ShopStop[]>([]);
  const [unavailable, setUnavailable] = useState<CartItem[]>([]);
  const [planLoading, setPlanLoading] = useState(false);

  // Fetch optimized visit plan from backend
  useEffect(() => {
    if (cartItems.length === 0) {
      setStops([]);
      setUnavailable([]);
      setPlanLoading(false);
      return;
    }

    setPlanLoading(true);
    (async () => {
      try {
        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:8000";
        const response = await fetch(`${backendUrl}/optimize-cart`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cart_items: cartItems.map((item) => ({
              medicine_id: item.medicine.id,
              quantity: item.quantity,
            })),
          }),
        });

        if (!response.ok) {
          console.error("Backend /optimize-cart failed, using local fallback");
          // Fallback to local optimization if backend fails
          const localPlan = buildVisitPlan(cartItems, shops);
          setStops(localPlan.stops);
          setUnavailable(localPlan.unavailable);
          setPlanLoading(false);
          return;
        }

        const data = await response.json();

        // Convert backend response to frontend ShopStop format
        const backendStops: ShopStop[] = data.stops.map(
          (stop: {
            shop_id: string;
            shop_name: string;
            owner: string;
            owner_name: string;
            phone: string;
            location: string;
            distance: string;
            distance_km: number;
            total_price: number;
            medicines: Array<{
              medicine_id: string;
              name: string;
              brand: string;
              form: string;
              price: number;
              quantity: number;
            }>;
          }) => {
            // Format distance to ensure " km" suffix
            let formattedDistance = stop.distance;
            if (typeof formattedDistance === "number") {
              formattedDistance = `${formattedDistance} km`;
            } else if (
              typeof formattedDistance === "string" &&
              !formattedDistance.includes("km")
            ) {
              formattedDistance = `${formattedDistance} km`;
            }

            const shop = shops.find((s) => s.id === stop.shop_id) || {
              id: stop.shop_id,
              name: stop.shop_name,
              owner: stop.owner_name || stop.owner,
              phone: stop.phone,
              location: stop.location,
              distance_from_user: formattedDistance,
              medicines: [],
            };

            const medicines: CartItem[] = stop.medicines
              .map((med) => {
                const cartItem = cartItems.find(
                  (ci) => ci.medicine.id === med.medicine_id,
                );
                return cartItem || null;
              })
              .filter((item): item is CartItem => item !== null);

            return {
              shop,
              medicines,
              backendMedicines: stop.medicines,
              distanceNum: stop.distance_km,
            };
          },
        );

        const backendUnavailable: CartItem[] = (
          data.unavailable as Array<{ medicine_id: string }>
        )
          .map((unavailMed) =>
            cartItems.find((ci) => ci.medicine.id === unavailMed.medicine_id),
          )
          .filter((item): item is CartItem => item !== null);

        setStops(backendStops);
        setUnavailable(backendUnavailable);
        setPlanLoading(false);
      } catch (error) {
        console.error("Error calling /optimize-cart:", error);
        // Fallback to local optimization
        const localPlan = buildVisitPlan(cartItems, shops);
        setStops(localPlan.stops);
        setUnavailable(localPlan.unavailable);
        setPlanLoading(false);
      }
    })();
  }, [cartItems, shops]);

  const availableItems = cartItems.filter(
    (ci) => !unavailable.some((u) => u.medicine.id === ci.medicine.id),
  );
  const receivedCount = Object.keys(received).length;
  const totalAvailable = availableItems.length;
  const allCollected = totalAvailable > 0 && receivedCount >= totalAvailable;
  const totalPaid = Object.values(received).reduce(
    (s, r) => s + r.pricePaid * r.quantity,
    0,
  );
  const progress =
    totalAvailable > 0 ? (receivedCount / totalAvailable) * 100 : 0;

  // ── Mark collected ─────────────────────────────────────────────────────────
  const markCollected = (item: CartItem, shop: Shop, pricePaid: number) => {
    setReceived((prev) => ({
      ...prev,
      [item.medicine.id]: {
        medicineId: item.medicine.id,
        medicineName: item.medicine.name,
        brand: item.medicine.brand,
        form: item.medicine.form,
        quantity: item.quantity,
        pricePaid,
        shopId: shop.id,
        shopName: shop.name,
      },
    }));
    setModal(null);
  };

  // ── Complete & save ────────────────────────────────────────────────────────
  const complete = async () => {
    const items = Object.values(received);

    // Simplify items to only store medicineId, shopId, quantity, pricePaid
    const simplifiedItems = items.map((it) => ({
      medicineId: it.medicineId,
      shopId: it.shopId,
      quantity: it.quantity,
      pricePaid: it.pricePaid,
    }));

    // Group into per-shop summaries
    const shopSummary: Record<
      string,
      {
        shopId: string;
        shopName: string;
        shopLocation: string;
        shopPhone: string;
        subtotal: number;
      }
    > = {};
    items.forEach((it) => {
      const sh = shops.find((s) => s.id === it.shopId);
      if (!shopSummary[it.shopId]) {
        shopSummary[it.shopId] = {
          shopId: it.shopId,
          shopName: it.shopName,
          shopLocation: sh?.location ?? "",
          shopPhone: sh?.phone ?? "",
          subtotal: 0,
        };
      }
      shopSummary[it.shopId].subtotal += it.pricePaid * it.quantity;
    });

    const record = {
      id: `PUR-${Date.now()}`,
      date: new Date().toISOString(),
      items: simplifiedItems,
      total: totalPaid,
      status: "complete" as const,
    };

    try {
      await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...record, purchaseId: record.id }),
      });
    } catch {
      /* silent */
    }

    try {
      localStorage.removeItem("medley_cart");
    } catch {
      /* silent */
    }

    setDone(true);
    setTimeout(() => router.push("/customer?tab=history"), 2000);
  };

  // ── Screens ────────────────────────────────────────────────────────────────
  if (loading)
    return (
      <Screen>
        <Spinner color="success" size="lg" />
        <p className="mt-3 text-sm text-gray-400">Finding pharmacies…</p>
      </Screen>
    );

  if (error)
    return (
      <Screen>
        <p className="text-red-500 font-bold mb-2">Something went wrong</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold"
        >
          Retry
        </button>
      </Screen>
    );

  if (done)
    return (
      <Screen>
        <div
          className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4"
          style={{ boxShadow: "0 0 0 12px #d1fae5" }}
        >
          <FaCheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-1">All Done!</h2>
        <p className="text-sm text-gray-500">
          Total paid:{" "}
          <span className="font-black text-emerald-600">₹{totalPaid}</span>
        </p>
        <p className="text-xs text-gray-400 mt-2">Redirecting to dashboard…</p>
      </Screen>
    );

  // ── Main layout ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link
            href="/customer"
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors flex-shrink-0"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-gray-900">
              Your Medicine Run
            </h1>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {stops.length} shop{stops.length !== 1 ? "s" : ""} to visit ·{" "}
              {cartItems.length} medicine{cartItems.length !== 1 ? "s" : ""}
            </p>
          </div>
          {receivedCount > 0 && (
            <div className="text-right">
              <p className="text-xs font-black text-emerald-600">
                ₹{totalPaid}
              </p>
              <p className="text-[10px] text-gray-400">
                {receivedCount}/{totalAvailable}
              </p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {totalAvailable > 0 && (
          <div className="h-1 bg-gray-100">
            <div
              className="h-1 transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg,#10b981,#0d9488)",
              }}
            />
          </div>
        )}
      </nav>

      {/* Body */}
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5 pb-12">
        {cartItems.length === 0 ? (
          <div className="text-center py-24">
            <FaShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-400 mb-2">Cart is empty</p>
            <Link
              href="/customer"
              className="text-sm text-emerald-600 hover:underline"
            >
              ← Browse medicines
            </Link>
          </div>
        ) : (
          <>
            {/* ═══ VISIT PLAN ═══════════════════════════════════════════════ */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FaRoute className="w-3.5 h-3.5 text-emerald-600" />
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Your Visit Plan
                </h2>
              </div>

              {stops.length === 0 ? (
                <div className="bg-white rounded-2xl p-5 text-center border border-red-100">
                  {planLoading ? (
                    <>
                      <Spinner color="success" size="sm" />
                      <p className="text-sm text-gray-500 mt-3">
                        Optimizing your medicine route...
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-bold text-red-400">
                      No nearby pharmacy has your medicines in stock
                    </p>
                  )}
                </div>
              ) : (
                <div className="relative">
                  {/* Vertical connector line between stops */}
                  {stops.length > 1 && (
                    <div
                      className="absolute left-[19px] top-10 bottom-10 w-0.5 bg-emerald-100 z-0"
                      style={{ top: "40px" }}
                    />
                  )}

                  <div className="space-y-3 relative z-10">
                    {stops.map((stop, stopIdx) => {
                      const stopDone = stop.medicines.every(
                        (m) => received[m.medicine.id],
                      );
                      const stopPartial = stop.medicines.some(
                        (m) => received[m.medicine.id],
                      );

                      return (
                        <div key={stop.shop.id}>
                          {/* Step label */}
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 z-10"
                              style={{
                                background: stopDone
                                  ? "linear-gradient(135deg,#10b981,#0d9488)"
                                  : stopPartial
                                    ? "linear-gradient(135deg,#fbbf24,#f59e0b)"
                                    : "linear-gradient(135deg,#6366f1,#4f46e5)",
                                color: "white",
                                boxShadow: stopDone
                                  ? "0 0 0 3px #d1fae5"
                                  : "0 0 0 3px #e0e7ff",
                              }}
                            >
                              {stopDone ? "✓" : stopIdx + 1}
                            </div>
                            <div>
                              <p className="text-xs font-black text-gray-700 uppercase tracking-wide">
                                {stopIdx === 0
                                  ? "Go here first"
                                  : stopIdx === 1
                                    ? "Then go here"
                                    : `Stop ${stopIdx + 1}`}
                              </p>
                            </div>
                          </div>

                          {/* Shop card */}
                          <div
                            className="ml-12 rounded-2xl overflow-hidden transition-all"
                            style={{
                              border: stopDone
                                ? "1.5px solid #6ee7b7"
                                : "1.5px solid #e5e7eb",
                              background: stopDone ? "#f0fdf4" : "white",
                              boxShadow: stopDone
                                ? "0 2px 12px rgba(16,185,129,0.08)"
                                : "0 2px 8px rgba(0,0,0,0.05)",
                            }}
                          >
                            {/* Shop header */}
                            <div className="px-4 py-3.5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0"
                                    style={{
                                      background: stopDone
                                        ? "linear-gradient(135deg,#10b981,#0d9488)"
                                        : "linear-gradient(135deg,#6366f1,#4f46e5)",
                                      color: "white",
                                    }}
                                  >
                                    {stop.shop.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-gray-900">
                                      {stop.shop.name}
                                    </p>
                                    <div className="flex flex-wrap gap-x-2.5 gap-y-0 mt-0.5">
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                        <FaWalking className="w-2.5 h-2.5" />
                                        {stop.shop.distance_from_user}
                                      </span>
                                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                                        <FaMapMarkerAlt className="w-2.5 h-2.5 text-gray-400" />
                                        {stop.shop.location}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <span
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{
                                      background: stopDone
                                        ? "#d1fae5"
                                        : "#ede9fe",
                                      color: stopDone ? "#065f46" : "#4f46e5",
                                    }}
                                  >
                                    {stopDone
                                      ? `${stop.medicines.length} collected ✓`
                                      : `${stop.medicines.length} medicine${stop.medicines.length > 1 ? "s" : ""} here`}
                                  </span>
                                </div>
                              </div>

                              {/* Contact row */}
                              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                                <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                                  <FaPhone className="w-2.5 h-2.5" />
                                  {stop.shop.phone}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                                  <FaUser className="w-2.5 h-2.5" />
                                  Owner: {stop.shop.owner}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                  <FaRupeeSign className="w-2.5 h-2.5" />
                                  {stop.medicines.reduce((sum, m) => {
                                    const backendMed =
                                      stop.backendMedicines.find(
                                        (bm) =>
                                          bm.medicine_id === m.medicine.id,
                                      );
                                    return (
                                      sum +
                                      (backendMed?.price || 0) * m.quantity
                                    );
                                  }, 0)}{" "}
                                  total
                                </span>
                              </div>
                            </div>

                            {/* Medicines to pick up at this stop */}
                            <div className="border-t border-gray-100">
                              {stop.medicines.map((item, mIdx) => {
                                const rec = received[item.medicine.id];
                                const backendMed = stop.backendMedicines.find(
                                  (m) => m.medicine_id === item.medicine.id,
                                );
                                const isLast =
                                  mIdx === stop.medicines.length - 1;

                                return (
                                  <div
                                    key={item.medicine.id}
                                    className={`flex items-center gap-3 px-4 py-3 ${!isLast ? "border-b border-gray-50" : ""}`}
                                    style={{
                                      background: rec
                                        ? "rgba(16,185,129,0.04)"
                                        : "transparent",
                                    }}
                                  >
                                    {/* Pill icon */}
                                    <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-base flex-shrink-0">
                                      {FORM_ICONS[item.medicine.form] || "💊"}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span
                                          className="text-sm font-bold text-gray-900"
                                          style={{
                                            textDecoration: rec
                                              ? "line-through"
                                              : "none",
                                            opacity: rec ? 0.5 : 1,
                                          }}
                                        >
                                          {item.medicine.name}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                          ×{item.quantity}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-gray-400">
                                        {item.medicine.brand} ·{" "}
                                        {item.medicine.form}
                                      </p>
                                      {rec ? (
                                        <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                                          Collected · ₹{rec.pricePaid}/unit · ₹
                                          {rec.pricePaid * rec.quantity} total
                                        </p>
                                      ) : backendMed ? (
                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                          Price:{" "}
                                          <span className="font-semibold text-gray-600">
                                            ₹{backendMed.price}
                                          </span>
                                          <span className="text-gray-300 mx-1">
                                            ·
                                          </span>
                                          Stock:{" "}
                                          <span
                                            className={`font-semibold ${backendMed.quantity > 10 ? "text-emerald-500" : "text-amber-500"}`}
                                          >
                                            {backendMed.quantity} units
                                          </span>
                                        </p>
                                      ) : null}
                                    </div>

                                    {/* Collect button */}
                                    <div className="flex-shrink-0">
                                      {rec ? (
                                        <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                                          <FaCheckCircle className="w-3.5 h-3.5 text-white" />
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() =>
                                            setModal({
                                              item,
                                              shop: stop.shop,
                                              listedPrice:
                                                backendMed?.price ?? 0,
                                            })
                                          }
                                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95 hover:opacity-90"
                                          style={{
                                            background:
                                              "linear-gradient(135deg,#10b981,#0d9488)",
                                          }}
                                        >
                                          Collected
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Unavailable medicines */}
              {unavailable.length > 0 && (
                <div className="mt-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3.5">
                  <p className="text-xs font-black text-red-400 uppercase tracking-wider mb-2">
                    ⚠ Not available at any nearby pharmacy
                  </p>
                  <div className="space-y-1.5">
                    {unavailable.map((ci) => (
                      <div
                        key={ci.medicine.id}
                        className="flex items-center gap-2"
                      >
                        <span className="text-base">
                          {FORM_ICONS[ci.medicine.form] || "💊"}
                        </span>
                        <span className="text-sm font-semibold text-red-700">
                          {ci.medicine.name}
                        </span>
                        <span className="text-xs text-red-400">
                          · {ci.medicine.brand}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ═══ RUNNING TOTAL (shows once any collected) ════════════════ */}
            {receivedCount > 0 && !allCollected && (
              <div
                className="rounded-2xl px-4 py-3.5 flex items-center justify-between"
                style={{
                  background: "linear-gradient(135deg,#ecfdf5,#f0fdfa)",
                  border: "1.5px solid #a7f3d0",
                }}
              >
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                    Spent so far
                  </p>
                  <p className="text-xl font-black text-emerald-600">
                    ₹{totalPaid}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-500">
                    {receivedCount} of {totalAvailable} collected
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {totalAvailable - receivedCount} left to go
                  </p>
                </div>
              </div>
            )}

            {/* ═══ ALL COLLECTED CTA ═══════════════════════════════════════ */}
            {allCollected && (
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "linear-gradient(135deg,#ecfdf5,#f0fdfa)",
                  border: "1.5px solid #6ee7b7",
                  boxShadow: "0 8px 32px rgba(16,185,129,0.12)",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-11 h-11 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ boxShadow: "0 0 0 8px #d1fae5" }}
                  >
                    <FaCheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-base font-black text-gray-900">
                      All medicines collected!
                    </p>
                    <p className="text-xs text-gray-500">
                      Total paid:{" "}
                      <span className="font-black text-emerald-600">
                        ₹{totalPaid}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Per-shop breakdown */}
                <div className="bg-white/70 rounded-xl px-3.5 py-3 mb-4 space-y-1.5">
                  {stops.map((stop) => {
                    const stopTotal = stop.medicines.reduce((sum, m) => {
                      const rec = received[m.medicine.id];
                      return sum + (rec ? rec.pricePaid * rec.quantity : 0);
                    }, 0);
                    return (
                      <div
                        key={stop.shop.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <FaStore className="w-3 h-3 text-emerald-400" />
                          {stop.shop.name}
                        </span>
                        <span className="font-bold text-gray-800">
                          ₹{stopTotal}
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100 mt-1">
                    <span className="font-black text-gray-700">Total</span>
                    <span className="font-black text-emerald-600">
                      ₹{totalPaid}
                    </span>
                  </div>
                </div>

                <button
                  onClick={complete}
                  className="w-full py-3.5 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg,#10b981,#0d9488)",
                    boxShadow: "0 4px 20px rgba(16,185,129,0.35)",
                  }}
                >
                  Complete & Save to History →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Price modal */}
      {modal && (
        <PriceModal
          item={modal.item}
          shopName={modal.shop.name}
          listedPrice={modal.listedPrice}
          onConfirm={(price) => markCollected(modal.item, modal.shop, price)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ─── Small helper screen wrapper ──────────────────────────────────────────────
function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{ background: "linear-gradient(135deg,#f0fdf4,#ecfdf5)" }}
    >
      {children}
    </div>
  );
}

// ─── Suspense wrapper ─────────────────────────────────────────────────────────
export default function FindPharmaciesPage() {
  return (
    <Suspense
      fallback={
        <Screen>
          <Spinner color="success" size="lg" />
        </Screen>
      }
    >
      <FindPharmaciesContent />
    </Suspense>
  );
}
