// ─── PurchaseOrdersContext.jsx ────────────────────────────────────────────────

import { createContext, useContext, useState, useCallback } from "react";
import { apiClient } from "../utils/apiClient";

const PurchaseOrdersContext = createContext(null);

export function PurchaseOrdersProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStart = () => {
    setLoading(true);
    setError(null);
  };
  const handleError = (e) => {
    setError(e?.data?.error ?? "Something went wrong");
    setLoading(false);
  };

  // GET /purchase-orders  (?supplierId=<id> | ?projectId=<id>)
  const fetchOrders = useCallback(async (filters = {}) => {
    handleStart();
    try {
      const params = new URLSearchParams();
      if (filters.supplierId) params.set("supplierId", filters.supplierId);
      if (filters.projectId) params.set("projectId", filters.projectId);

      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await apiClient.get(`/purchase-orders${query}`);
      console.log(res);
      setOrders(res.orders ?? []);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // POST /purchase-orders
  const addOrder = useCallback(async (data) => {
    handleStart();
    try {
      const res = await apiClient.post("/purchase-orders", data);
      const newOrder = res.order;
      setOrders((prev) => [newOrder, ...prev]);
      return newOrder;
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // PATCH /purchase-orders/{orderId}  — status only: { status: "Sent" | "Cancelled" }
  const setStatus = useCallback(async (orderId, status) => {
    handleStart();
    try {
      const res = await apiClient.patch(`/purchase-orders/${orderId}`, {
        status,
      });
      const updatedOrder = res.order;
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? updatedOrder : o)),
      );
      return updatedOrder;
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // PATCH /purchase-orders/{orderId}  — mark received: triggers stock + expense side effects on backend
  const markReceived = useCallback(async (orderId) => {
    handleStart();
    try {
      const res = await apiClient.patch(`/purchase-orders/${orderId}`, {
        status: "Received",
      });
      const updatedOrder = res.order;
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? updatedOrder : o)),
      );
      return updatedOrder;
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // DELETE /purchase-orders/{orderId}
  const deleteOrder = useCallback(async (orderId) => {
    handleStart();
    try {
      await apiClient.delete(`/purchase-orders/${orderId}`);
      setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <PurchaseOrdersContext.Provider
      value={{
        orders,
        loading,
        error,
        fetchOrders,
        addOrder,
        setStatus,
        markReceived,
        deleteOrder,
      }}
    >
      {children}
    </PurchaseOrdersContext.Provider>
  );
}

export function usePurchaseOrders() {
  const ctx = useContext(PurchaseOrdersContext);
  if (!ctx)
    throw new Error(
      "usePurchaseOrders must be used inside <PurchaseOrdersProvider>",
    );
  return ctx;
}
