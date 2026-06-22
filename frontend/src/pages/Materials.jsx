import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE } from "../config/accessControl";
import { useMaterials } from "../context/MaterialsContext";
import { useSuppliers } from "../context/SuppliersContext";
import { useCompany } from "../context/CompanyContext";

const Materials = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const { user } = useAuth();
  const { materials, loading, error, fetchMaterials, addMaterial, updateMaterial, adjustStock: adjustStockAPI, deleteMaterial } = useMaterials();
  const { suppliers, fetchSuppliers } = useSuppliers();
  const roleName = user?.roleName;

  const isAdmin = roleName === ROLE.ADMIN;
  const isPM = roleName === ROLE.PM;
  const isAccountant = roleName === ROLE.ACCOUNTANT;

  // ✅ Admin/PM can manage inventory; Accountant is read-only
  const canManageInventory = isAdmin || isPM;
  const readOnly = isAccountant;

  const [supplierFilter, setSupplierFilter] = useState("");
  const [editId, setEditId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    supplierId: "",
    unitPrice: "",
    onHand: "",
    reorderLevel: "",
    sku: "",
    notes: "",
  });

  const { company, getCompany } = useCompany();

  useEffect(() => {
    getCompany();
  }, [getCompany]);


  // Load materials and suppliers on mount
  useEffect(() => {
    fetchMaterials();
    fetchSuppliers();
  }, []);

  const supplierName = (supplierId) =>
      suppliers.find((s) => (s.supplierId) === (supplierId))?.name || "—";

  const handleSearchChange = (e) => {
    const val = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (val) {
      newParams.set("search", val);
    } else {
      newParams.delete("search");
    }
    setSearchParams(newParams, { replace: true });
  };

  const lowStockCount = useMemo(() => {
    return materials.filter(
      (m) => Number(m.onHand || 0) <= Number(m.reorderLevel || 0)
    ).length;
  }, [materials]);

  const filtered = useMemo(() => {
    return materials.filter((m) => {
      const matchSearch = !searchQuery.trim()
        ? true
        : (() => {
            const q = searchQuery.toLowerCase();
            const name = (m.name || "").toLowerCase();
            const sku = (m.sku || "").toLowerCase();
            const supplier = supplierName(m.supplierId).toLowerCase();
            return (
              name.includes(q) || sku.includes(q) || supplier.includes(q)
            );
          })();

      const matchSupplier = supplierFilter
        ? String(m.supplierId) === String(supplierFilter)
        : true;

      return matchSearch && matchSupplier;
    });
  }, [materials, searchQuery, supplierFilter, suppliers]);

  const resetForm = () => {
    setEditId(null);
    setForm({
      name: "",
      supplierId: "",
      unitPrice: "",
      onHand: "",
      reorderLevel: "",
      sku: "",
      notes: "",
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canManageInventory) return;

    if (!form.name.trim()) return alert("Material name is required");

    const payload = {
      name: form.name.trim(),
      supplierId: form.supplierId ? (form.supplierId) : "",
      unitPrice: Number(form.unitPrice || 0),
      onHand: Number(form.onHand || 0),
      reorderLevel: Number(form.reorderLevel || 0),
      sku: (form.sku || "").trim(),
      notes: form.notes || "",
    };


    try {
      setIsSaving(true);
      if (editId) {
        await updateMaterial(editId, payload);
      } else {
        await addMaterial(payload);
      }
      resetForm();
    } catch (err) {
      console.error("Error saving material:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const onEdit = (m) => {
    if (!canManageInventory) return;

    setEditId(m.materialId);
    setForm({
      name: m.name || "",
      supplierId: m.supplierId ? String(m.supplierId) : "",
      unitPrice: m.unitPrice ?? "",
      onHand: m.onHand ?? "",
      reorderLevel: m.reorderLevel ?? "",
      sku: m.sku || "",
      notes: m.notes || "",
    });
  };

  const onDelete = async (materialId) => {
    if (!canManageInventory) return;

    const ok = confirm("Delete this inventory material?");
    if (!ok) return;

    try {
      setIsSaving(true);
      await deleteMaterial(materialId);
      if (editId === materialId) resetForm();
    } catch (err) {
      console.error("Error deleting material:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const adjustStock = async (materialId, delta) => {
    if (!canManageInventory) return;

    const d = Number(delta || 0);
    if (!d) return;

    try {
      setIsSaving(true);
      await adjustStockAPI(materialId, d);
    } catch (err) {
      console.error("Error adjusting stock:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Inventory Materials
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Track stock quantity, unit price and suppliers (used by Purchase
            Orders)
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
            Low Stock Items
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {loading ? "—" : lowStockCount}
          </p>
        </div>
      </div>

      {/* Search / Filter */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        {/* <input
          className="border p-3 rounded-xl w-full md:w-[320px] bg-white dark:bg-gray-950 dark:text-white"
          placeholder="Search by name or SKU..."
          value={searchQuery}
          onChange={handleSearchChange}
        /> */}

        <div className="flex gap-3">
          <select
            className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.supplierId} value={s.supplierId}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            className="bg-gray-200 dark:bg-gray-700  hover:bg-gray-600 px-4 py-3 rounded-xl"
            onClick={() => {
              const newParams = new URLSearchParams(searchParams);
              newParams.delete("search");
              setSearchParams(newParams, { replace: true });
              setSupplierFilter("");
            }}
            type="button"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Add/Edit Form (Admin/PM only) */}
      {canManageInventory && (
        <form
          onSubmit={submit}
          className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow space-y-4 border border-gray-100 dark:border-gray-800"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 dark:text-white">
              {editId ? "Edit Material" : "Add Material"}
            </h2>

            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-gray-600 dark:text-gray-300 hover:underline"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500">Material Name *</label>
              <input
                className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Shingles"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">
                Supplier (optional)
              </label>
              <select
                className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                value={form.supplierId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, supplierId: e.target.value }))
                }
                disabled={isSaving}
              >
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.supplierId} value={s.supplierId}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500">SKU (optional)</label>
              <input
                className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                value={form.sku}
                onChange={(e) =>
                  setForm((p) => ({ ...p, sku: e.target.value }))
                }
                placeholder="e.g. SH-001"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Unit Price</label>
              <input
                type="number"
                className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                value={form.unitPrice}
                onChange={(e) =>
                  setForm((p) => ({ ...p, unitPrice: e.target.value }))
                }
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">On Hand</label>
              <input
                type="number"
                className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                value={form.onHand}
                onChange={(e) =>
                  setForm((p) => ({ ...p, onHand: e.target.value }))
                }
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Reorder Level</label>
              <input
                type="number"
                className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                value={form.reorderLevel}
                onChange={(e) =>
                  setForm((p) => ({ ...p, reorderLevel: e.target.value }))
                }
                disabled={isSaving}
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-xs text-gray-500">Notes</label>
              <input
                className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="Optional"
                disabled={isSaving}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl w-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? editId ? "Updating..." : "Adding..." : editId ? "Update Material" : "Add Material"}
          </button>
        </form>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-x-auto border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">
          Materials List
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-200">
            <tr>
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Unit Price</th>
              <th className="px-4 py-3">On Hand</th>
              <th className="px-4 py-3">Reorder</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Adjust</th>
              {canManageInventory && (
                <th className="px-4 py-3 text-right">Actions</th>
              )}
            </tr>
          </thead>

          <tbody>
            {filtered.map((m) => {
              const low = Number(m.onHand || 0) <= Number(m.reorderLevel || 0);

              return (
                <tr
                  key={m.materialId}
                  className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950"
                >
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                    {m.name}
                    {m.sku ? (
                      <span className="ml-2 text-xs text-gray-500">
                        ({m.sku})
                      </span>
                    ) : null}
                  </td>

                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {m.supplierId ? supplierName(m.supplierId) : "—"}
                  </td>

                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {company?.currency} {Number(m.unitPrice || 0).toFixed(2)}
                  </td>

                  <td className="px-4 py-3 text-gray-800 dark:text-white">
                    {Number(m.onHand || 0)}
                  </td>

                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {Number(m.reorderLevel || 0)}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${
                        low
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {low ? "Low Stock" : "OK"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {canManageInventory ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700  hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => adjustStock(m.materialId, -1)}
                          title="Decrease stock"
                          disabled={isSaving}
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700  hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => adjustStock(m.materialId, +1)}
                          title="Increase stock"
                          disabled={isSaving}
                        >
                          +1
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {canManageInventory && (
                    <td className="px-4 py-3 text-right space-x-3">
                      <button
                        className="text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => onEdit(m)}
                        disabled={isSaving}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => onDelete(m.materialId)}
                        disabled={isSaving}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}

            {filtered.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={canManageInventory ? 8 : 7}
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-300"
                >
                  No inventory materials found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Materials;