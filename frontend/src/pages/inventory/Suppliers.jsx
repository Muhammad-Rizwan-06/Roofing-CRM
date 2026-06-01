import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ROLE } from "../../config/accessControl";
import { useSuppliers } from "../../context/SuppliersContext";

const Suppliers = () => {
  const { user } = useAuth();
  const { suppliers, loading, error, fetchSuppliers, addSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const roleName = user?.roleName;

  const isAdmin = roleName === ROLE.ADMIN;
  const isPM = roleName === ROLE.PM;
  const isAccountant = roleName === ROLE.ACCOUNTANT;

  // ✅ Admin/PM manage suppliers; Accountant read-only
  const canManageSuppliers = isAdmin || isPM;
  const readOnly = isAccountant;

  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  // Load suppliers on mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      contactName: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canManageSuppliers) return;

    if (!form.name.trim()) return alert("Supplier name is required");

    try {
      setIsSaving(true);
      if (editingId) {
        await updateSupplier(editingId, form);
      } else {
        await addSupplier(form);
      }
      resetForm();
    } catch (err) {
      console.error("Error saving supplier:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const onEdit = (supplier) => {
    if (!canManageSuppliers) return;

    setEditingId(supplier.supplierId);
    setForm({
      name: supplier.name || "",
      contactName: supplier.contactName || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      notes: supplier.notes || "",
    });
  };

  const onDelete = async (supplierId) => {
    if (!canManageSuppliers) return;

    const ok = confirm("Delete this supplier?");
    if (!ok) return;

    try {
      setIsSaving(true);
      await deleteSupplier(supplierId);
      if (editingId === supplierId) resetForm();
    } catch (err) {
      console.error("Error deleting supplier:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Suppliers
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Manage vendors for purchase orders and material sourcing
          </p>
          {readOnly && (
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
              Read-only access for Accountant role.
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {error}
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-300">
            Total Suppliers
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {loading ? "—" : suppliers.length}
          </p>
        </div>
      </div>

      {/* Form (Admin/PM only) */}
      {canManageSuppliers && (
        <form
          onSubmit={submit}
          className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow border border-gray-100 dark:border-gray-800 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700 dark:text-gray-200">
              {editingId ? "Edit Supplier" : "Add Supplier"}
            </h2>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-gray-600 dark:text-gray-300 hover:underline"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">Supplier Name *</label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className="w-full mt-1 border rounded-xl px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
                placeholder="e.g. ABC Roofing Supplies"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Contact Person</label>
              <input
                value={form.contactName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contactName: e.target.value }))
                }
                className="w-full mt-1 border rounded-xl px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
                placeholder="e.g. John Smith"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Phone</label>
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                className="w-full mt-1 border rounded-xl px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
                placeholder="e.g. +1 555 123 456"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                className="w-full mt-1 border rounded-xl px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
                placeholder="e.g. sales@vendor.com"
                disabled={isSaving}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-gray-500">Address</label>
              <input
                value={form.address}
                onChange={(e) =>
                  setForm((p) => ({ ...p, address: e.target.value }))
                }
                className="w-full mt-1 border rounded-xl px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
                placeholder="Vendor address"
                disabled={isSaving}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-gray-500">Notes</label>
              <input
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                className="w-full mt-1 border rounded-xl px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
                placeholder="Payment terms, delivery info, etc."
                disabled={isSaving}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving
              ? editingId
                ? "Updating..."
                : "Adding..."
              : editingId
                ? "Update Supplier"
                : "Add Supplier"}
          </button>
        </form>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">
          Supplier List
        </div>

        {/* {loading ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-300">
            Loading suppliers...
          </div>
        ) : ( */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Email</th>
                  {canManageSuppliers && (
                    <th className="p-3 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr
                    key={s.supplierId}
                    className="border-t border-gray-100 dark:border-gray-800"
                  >
                    <td className="p-3 font-medium text-gray-800 dark:text-white">
                      {s.name}
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">
                      {s.contactName || "—"}
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">
                      {s.phone || "—"}
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">
                      {s.email || "—"}
                    </td>

                    {canManageSuppliers && (
                      <td className="p-3 text-right space-x-3">
                        <button
                          onClick={() => onEdit(s)}
                          disabled={isSaving}
                          className="text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(s.supplierId)}
                          disabled={isSaving}
                          className="text-red-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {suppliers.length === 0 && (
                  <tr>
                    <td
                      colSpan={canManageSuppliers ? 5 : 4}
                      className="p-6 text-center text-gray-500 dark:text-gray-300"
                    >
                      No suppliers yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        {/* )} */}
      </div>
    </div>
  );
};

export default Suppliers;