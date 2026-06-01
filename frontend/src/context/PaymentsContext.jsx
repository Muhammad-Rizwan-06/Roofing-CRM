import { createContext, useContext, useState, useCallback } from "react";
import { apiClient } from "../utils/apiClient";

// ─── Context ──────────────────────────────────────────────────────────────────

const PaymentsContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PaymentsProvider({ children }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── helpers ─────────────────────────────────────────────────────────────────

  const handleStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleError = (e) => {
    setError(e?.message ?? "Something went wrong");
    setLoading(false);
  };

  // ── GET /payments ────────────────────────────────────────────────────────────
  /**
   * @param {{ invoiceId?: string }} filters - optional
   */
  const fetchPayments = useCallback(async (filters = {}) => {
    handleStart();
    try {
      const params = new URLSearchParams();
      if (filters.invoiceId) params.set("invoiceId", filters.invoiceId);

      const query = params.toString() ? `?${params.toString()}` : "";
      const response = await apiClient.get(`/payments${query}`);

      setPayments(response.payments ?? []);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── POST /payments ───────────────────────────────────────────────────────────
  /**
   * Records a new payment and updates invoice status as a side effect on backend.
   * @param {{
   *   invoiceId:  string,
   *   invoiceNo?: string,
   *   customer?:  string,
   *   date:       string,
   *   method:     "Cash"|"Bank Transfer"|"Credit Card"|"Cheque",
   *   amount:     number,
   *   notes?:     string
   * }} paymentData
   * @returns {object} created payment
   */
  const addPayment = useCallback(async (paymentData) => {
    handleStart();
    try {
      const response = await apiClient.post("/payments", paymentData);
      const newPayment = response.payment;

      setPayments((prev) => [newPayment, ...prev]);
      return newPayment;
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── DELETE /payments/{paymentId} ─────────────────────────────────────────────
  /**
   * Deletes a payment. Backend reverses amountPaid on the linked invoice.
   * @param {string} paymentId
   */
  const deletePayment = useCallback(async (paymentId) => {
    handleStart();
    try {
      await apiClient.delete(`/payments/${paymentId}`);

      setPayments((prev) => prev.filter((p) => p.paymentId !== paymentId));
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── context value ────────────────────────────────────────────────────────────

  const value = {
    // state
    payments,
    loading,
    error,

    // actions
    fetchPayments,
    addPayment,
    deletePayment,
  };

  return (
    <PaymentsContext.Provider value={value}>
      {children}
    </PaymentsContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * const {
 *   payments, loading, error,
 *   fetchPayments, addPayment, deletePayment
 * } = usePayments();
 */
export function usePayments() {
  const context = useContext(PaymentsContext);
  if (!context) {
    throw new Error("usePayments must be used inside a <PaymentsProvider>");
  }
  return context;
}
