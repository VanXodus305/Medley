"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/react";

interface Medicine {
  _id: string;
  name: string;
  brand?: string;
  form: string;
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
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
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
    <div className="min-h-screen bg-[#dbe8e3] p-6">
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
              <motion.form
                onSubmit={handleAdd}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border rounded-lg p-5 mb-6 space-y-4 bg-gray-50"
              >
                <input
                  type="text"
                  placeholder="Search medicine..."
                  className="w-full border p-3 rounded"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setAddForm((f) => ({ ...f, medicineId: "" }));
                  }}
                />

                {searchQuery && !addForm.medicineId && (
                  <div className="border rounded max-h-40 overflow-y-auto bg-white">
                    {filteredMedicines.slice(0, 10).map((m) => (
                      <button
                        key={m._id}
                        type="button"
                        className="block w-full text-left px-3 py-2 hover:bg-gray-100"
                        onClick={() => {
                          setAddForm({ ...addForm, medicineId: m._id });
                          setSearchQuery(m.name);
                        }}
                      >
                        {m.name} ({m.form})
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Price"
                    className="border p-3 rounded"
                    value={addForm.price}
                    onChange={(e) =>
                      setAddForm({ ...addForm, price: e.target.value })
                    }
                    required
                  />

                  <input
                    type="number"
                    placeholder="Quantity"
                    className="border p-3 rounded"
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
                  disabled={!addForm.medicineId}
                  className="w-full bg-blue-600 text-white"
                >
                  Add to Shop
                </Button>
              </motion.form>
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