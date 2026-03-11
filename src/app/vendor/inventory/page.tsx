"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";

interface InventoryItem {
  _id: string;
  medicine: {
    _id: string;
    name: string;
    brand?: string;
    form: string;
  };
  price: number;
  quantity: number;
}

type FilterType = "all" | "low" | "out";

export default function InventoryPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ quantity: "", price: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    fetch("/api/vendor/inventory")
      .then((r) => r.json())
      .then((data) => {
        setInventory(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const filtered = inventory.filter((item) => {
    if (filter === "low") return item.quantity > 0 && item.quantity <= 10;
    if (filter === "out") return item.quantity === 0;
    return true;
  });

  const startEdit = (item: InventoryItem) => {
    setEditing(item._id);
    setEditForm({
      quantity: item.quantity.toString(),
      price: item.price.toString(),
    });
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/vendor/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          quantity: parseInt(editForm.quantity),
          price: parseFloat(editForm.price),
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setInventory((prev) =>
          prev.map((item) => (item._id === id ? updated : item)),
        );
        setEditing(null);
        setMessage({ text: "✓ Inventory updated!", type: "success" });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      } else {
        setMessage({ text: "Failed to update. Try again.", type: "error" });
      }
    } catch {
      setMessage({ text: "Network error.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const lowStockCount = inventory.filter(
    (i) => i.quantity > 0 && i.quantity <= 10,
  ).length;
  const outOfStockCount = inventory.filter((i) => i.quantity === 0).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#dbe8e3] flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#dbe8e3] p-6 pt-28">
      <NavBar />
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/vendor")}
          className="mb-4 text-green-800 hover:text-green-600 font-medium flex items-center gap-1"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xl">
              📦
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              Track Inventory
            </h1>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">
                {inventory.length}
              </p>
              <p className="text-sm text-gray-500 mt-1">Total Medicines</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {lowStockCount}
              </p>
              <p className="text-sm text-yellow-600 mt-1">Low Stock (≤10)</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-600">
                {outOfStockCount}
              </p>
              <p className="text-sm text-red-600 mt-1">Out of Stock</p>
            </div>
          </div>

          {message.text && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-5">
            {(
              [
                { key: "all", label: `All (${inventory.length})` },
                { key: "low", label: `Low Stock (${lowStockCount})` },
                { key: "out", label: `Out of Stock (${outOfStockCount})` },
              ] as { key: FilterType; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === key
                    ? "bg-purple-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-5xl mb-4">📦</p>
              <p className="text-lg font-medium">No inventory items</p>
              <p className="text-sm mt-1">
                {filter === "all"
                  ? "Add medicines from the Medicines page."
                  : `No ${filter === "low" ? "low stock" : "out of stock"} items.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <div
                  key={item._id}
                  className={`border rounded-lg p-4 ${
                    item.quantity === 0
                      ? "border-red-200 bg-red-50"
                      : item.quantity <= 10
                        ? "border-yellow-200 bg-yellow-50"
                        : "border-gray-200"
                  }`}
                >
                  {editing === item._id ? (
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-gray-800 flex-1 min-w-0">
                        {item.medicine?.name}
                      </span>
                      <input
                        type="number"
                        min="0"
                        className="border border-gray-300 rounded-lg p-2 w-28 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        placeholder="Quantity"
                        value={editForm.quantity}
                        onChange={(e) =>
                          setEditForm({ ...editForm, quantity: e.target.value })
                        }
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="border border-gray-300 rounded-lg p-2 w-28 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        placeholder="Price ₹"
                        value={editForm.price}
                        onChange={(e) =>
                          setEditForm({ ...editForm, price: e.target.value })
                        }
                      />
                      <button
                        onClick={() => handleUpdate(item._id)}
                        disabled={saving}
                        className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {item.medicine?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.medicine?.form}
                          {item.medicine?.brand
                            ? ` · ${item.medicine.brand}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-green-600">
                          ₹{item.price}
                        </span>
                        <span
                          className={`text-sm px-3 py-1 rounded-full font-medium ${
                            item.quantity === 0
                              ? "bg-red-100 text-red-700"
                              : item.quantity <= 10
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {item.quantity === 0
                            ? "Out of Stock"
                            : `${item.quantity} units`}
                        </span>
                        <button
                          onClick={() => startEdit(item)}
                          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
