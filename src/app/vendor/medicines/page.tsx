"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/react";
import NavBar from "@/components/NavBar";

const MEDICINE_FORMS = [
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
];

interface Medicine {
  _id: string;
  name: string;
  brand?: string;
  form: string;
  manufacturer?: string;
}

interface ShopMedicine {
  _id: string;
  medicine: Medicine;
  price: number;
  quantity: number;
}

export default function MedicinesPage() {
  const router = useRouter();

  const [shopMedicines, setShopMedicines] = useState<ShopMedicine[]>([]);
  const [allMedicines, setAllMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const [addForm, setAddForm] = useState({
    medicineId: "",
    price: "",
    quantity: "",
  });

  // Custom medicine (not in DB) form state
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customForm, setCustomForm] = useState({
    name: "",
    brand: "",
    form: "Tablet",
    manufacturer: "",
    price: "",
    quantity: "",
  });
  const [addingCustom, setAddingCustom] = useState(false);

  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    Promise.all([
      fetch("/api/vendor/medicines").then((r) => r.json()),
      fetch("/api/medicines").then((r) => r.json()),
    ]).then(([shopMeds, allMeds]) => {
      setShopMedicines(Array.isArray(shopMeds) ? shopMeds : []);
      setAllMedicines(Array.isArray(allMeds) ? allMeds : []);
      setLoading(false);
    });
  }, []);

  const filteredMedicines = allMedicines.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch("/api/vendor/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicineId: addForm.medicineId,
          price: Number(addForm.price),
          quantity: Number(addForm.quantity),
        }),
      });

      if (res.ok) {
        const newItem = await res.json();

        setShopMedicines((prev) => [...prev, newItem]);

        setAddForm({
          medicineId: "",
          price: "",
          quantity: "",
        });

        setSearchQuery("");
        setShowAddForm(false);

        setMessage({
          text: "Medicine added successfully!",
          type: "success",
        });
      } else {
        const data = await res.json();
        setMessage({
          text: data.error || "Failed to add medicine",
          type: "error",
        });
      }
    } catch {
      setMessage({
        text: "Network error",
        type: "error",
      });
    } finally {
      setAdding(false);
    }
  };

  // Create custom medicine in DB, then add to shop
  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingCustom(true);
    setMessage({ text: "", type: "" });
    try {
      // 1. Create medicine in global DB
      const createRes = await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customForm.name,
          brand: customForm.brand || undefined,
          form: customForm.form,
          manufacturer: customForm.manufacturer || undefined,
        }),
      });
      if (!createRes.ok) {
        const data = await createRes.json();
        setMessage({
          text: data.error || "Failed to create medicine",
          type: "error",
        });
        setAddingCustom(false);
        return;
      }
      const newMed: Medicine = await createRes.json();
      // Add to local medicine list
      setAllMedicines((prev) => [...prev, newMed]);

      // 2. Add to vendor's shop
      const shopRes = await fetch("/api/vendor/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicineId: newMed._id,
          price: Number(customForm.price),
          quantity: Number(customForm.quantity),
        }),
      });
      if (shopRes.ok) {
        const shopItem: ShopMedicine = await shopRes.json();
        setShopMedicines((prev) => {
          const existingIdx = prev.findIndex((m) => m._id === shopItem._id);
          if (existingIdx >= 0) {
            const updated = [...prev];
            updated[existingIdx] = shopItem;
            return updated;
          }
          return [...prev, shopItem];
        });
        setCustomForm({
          name: "",
          brand: "",
          form: "Tablet",
          manufacturer: "",
          price: "",
          quantity: "",
        });
        setShowCustomForm(false);
        setShowAddForm(false);
        setMessage({
          text: `✓ "${newMed.name}" created and added to your shop!`,
          type: "success",
        });
      } else {
        const data = await shopRes.json();
        setMessage({
          text: data.error || "Medicine created but failed to add to shop",
          type: "error",
        });
      }
    } catch {
      setMessage({ text: "Network error", type: "error" });
    } finally {
      setAddingCustom(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this medicine from your shop?")) return;

    const res = await fetch(`/api/vendor/medicines?id=${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setShopMedicines((prev) => prev.filter((m) => m._id !== id));

      setMessage({
        text: "Medicine removed",
        type: "success",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#dbe8e3]">
        <p className="text-gray-600 text-lg">Loading medicines...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#dbe8e3] p-6 pt-28">
      <NavBar />
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push("/vendor")}
          className="mb-4 text-green-800 hover:text-green-600 font-medium"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Add / Update Medicines
            </h1>

            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-500 text-white"
            >
              {showAddForm ? "Cancel" : "+ Add Medicine"}
            </Button>
          </div>

          {/* Message */}
          {message.text && (
            <div
              className={`mb-4 p-3 rounded ${
                message.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Add Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="border border-blue-200 rounded-xl p-5 mb-6 space-y-4 bg-blue-50"
              >
                {/* Toggle between search existing or add custom */}
                <div className="flex gap-2 mb-1">
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(false)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      !showCustomForm
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-600 border"
                    }`}
                  >
                    Search Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(true)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      showCustomForm
                        ? "bg-purple-600 text-white"
                        : "bg-white text-gray-600 border"
                    }`}
                  >
                    + Add New Medicine to DB
                  </button>
                </div>

                {!showCustomForm ? (
                  <form onSubmit={handleAdd} className="space-y-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Search medicine name..."
                        className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setAddForm((f) => ({ ...f, medicineId: "" }));
                        }}
                      />
                      {searchQuery && !addForm.medicineId && (
                        <div className="border border-gray-200 rounded-lg max-h-44 overflow-y-auto bg-white mt-1 shadow-sm">
                          {filteredMedicines.slice(0, 12).map((m) => (
                            <button
                              key={m._id}
                              type="button"
                              className="flex justify-between w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-none text-sm"
                              onClick={() => {
                                setAddForm({ ...addForm, medicineId: m._id });
                                setSearchQuery(m.name);
                              }}
                            >
                              <span className="font-medium text-gray-800">
                                {m.name}
                              </span>
                              <span className="text-gray-400 text-xs">
                                {m.form}
                                {m.brand ? ` · ${m.brand}` : ""}
                              </span>
                            </button>
                          ))}
                          {filteredMedicines.length === 0 && (
                            <div className="px-3 py-3 text-sm text-gray-400">
                              No results — try{" "}
                              <button
                                type="button"
                                className="text-purple-600 underline"
                                onClick={() => setShowCustomForm(true)}
                              >
                                adding a new medicine
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {addForm.medicineId && (
                        <p className="text-xs text-blue-600 mt-1">
                          ✓ Medicine selected
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price (₹)"
                        className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={addForm.price}
                        onChange={(e) =>
                          setAddForm({ ...addForm, price: e.target.value })
                        }
                        required
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Quantity"
                        className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={addForm.quantity}
                        onChange={(e) =>
                          setAddForm({ ...addForm, quantity: e.target.value })
                        }
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      isLoading={adding}
                      isDisabled={
                        !addForm.medicineId ||
                        !addForm.price ||
                        !addForm.quantity
                      }
                      className="w-full bg-blue-600 text-white font-semibold"
                    >
                      Add to Shop
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleAddCustom} className="space-y-4">
                    <p className="text-sm text-purple-700 font-medium">
                      This will add the medicine to the global database and to
                      your shop.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Medicine Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Paracetamol"
                          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                          value={customForm.name}
                          onChange={(e) =>
                            setCustomForm({
                              ...customForm,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Brand
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Cipla"
                          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                          value={customForm.brand}
                          onChange={(e) =>
                            setCustomForm({
                              ...customForm,
                              brand: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Form *
                        </label>
                        <select
                          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                          value={customForm.form}
                          onChange={(e) =>
                            setCustomForm({
                              ...customForm,
                              form: e.target.value,
                            })
                          }
                          required
                        >
                          {MEDICINE_FORMS.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Manufacturer
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Sun Pharma"
                          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                          value={customForm.manufacturer}
                          onChange={(e) =>
                            setCustomForm({
                              ...customForm,
                              manufacturer: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Price (₹) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g. 45.00"
                          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                          value={customForm.price}
                          onChange={(e) =>
                            setCustomForm({
                              ...customForm,
                              price: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 100"
                          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                          value={customForm.quantity}
                          onChange={(e) =>
                            setCustomForm({
                              ...customForm,
                              quantity: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      isLoading={addingCustom}
                      isDisabled={
                        !customForm.name ||
                        !customForm.form ||
                        !customForm.price ||
                        !customForm.quantity
                      }
                      className="w-full bg-purple-600 text-white font-semibold"
                    >
                      Create Medicine &amp; Add to Shop
                    </Button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Medicine List */}
          {shopMedicines.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">💊</p>
              <p>No medicines added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shopMedicines.map((item) => (
                <div
                  key={item._id}
                  className="flex justify-between items-center border rounded-lg p-4"
                >
                  <div>
                    <p className="font-semibold">{item.medicine.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.medicine.form}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-green-600 font-semibold">
                      ₹{item.price}
                    </span>

                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                      Qty: {item.quantity}
                    </span>

                    <button
                      onClick={() => handleRemove(item._id)}
                      className="text-red-500 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
