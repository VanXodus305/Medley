"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface OrderItem {
  medicine: {
    _id: string;
    name: string;
    form: string;
    brand?: string;
  };
  quantity: number;
}

interface Order {
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendor/orders")
      .then((r) => r.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalItems = orders.reduce(
    (acc, o) => acc + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#dbe8e3] flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#dbe8e3] p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push("/vendor")}
          className="mb-4 text-green-800 hover:text-green-600 font-medium flex items-center gap-1"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xl">
              📋
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Customer Orders</h1>
              <p className="text-sm text-gray-500">
                Customers who have requested medicines from your shop
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{orders.length}</p>
              <p className="text-sm text-orange-600 mt-1">Total Orders</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-700">{totalItems}</p>
              <p className="text-sm text-gray-500 mt-1">Total Items</p>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-5xl mb-4">📋</p>
              <p className="text-lg font-medium">No orders yet</p>
              <p className="text-sm mt-1">
                Customer orders will appear here when they request medicines from your shop.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <div
                  key={order.customerId}
                  className="border border-gray-200 rounded-lg p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">{order.customerName}</p>
                      <p className="text-sm text-gray-500">{order.customerEmail}</p>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                      Order #{index + 1}
                    </span>
                  </div>
                  <div className="space-y-2 mt-2">
                    {order.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-orange-50 px-3 py-2 rounded-lg"
                      >
                        <div>
                          <span className="text-sm font-medium text-gray-800">
                            {item.medicine?.name}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({item.medicine?.form})
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-orange-600">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    ))}
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
