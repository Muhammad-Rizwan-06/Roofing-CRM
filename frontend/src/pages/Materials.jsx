import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ROLE } from "../config/accessControl";

const lsGet = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const lsSet = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const migrateOldCostMaterialsToInventory = (oldList = []) => {
  // old structure: { material, quantity, price, total }
  // new structure: { name, unitPrice, onHand, reorderLevel, supplierId }
  return oldList.map((m) => ({
    id: m.id || Date.now(),
    name: m.material || "Material",
    unitPrice: Number(m.price || 0),
    onHand: Number(m.quantity || 0),
    reorderLevel: 0,
    supplierId: "",
    sku: "",
    notes: "Migrated from old Materials & Cost list",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
};

const Materials = () => {
  const { user } = useAuth();
  const roleName = user?.roleName;

  const isAdmin = roleName === ROLE.ADMIN;
  const isPM = roleName === ROLE.PM;
  const isAccountant = roleName === ROLE.ACCOUNTANT;

  // ✅ Admin/PM can manage inventory; Accountant is read-only
  const canManageInventory = isAdmin || isPM;
  const readOnly = isAccountant;

  const [suppliers] = useState(() => lsGet("suppliers", []));

  const [materials, setMaterials] = useState(() => {
    const inv = lsGet("inventory_materials", null);
    if (Array.isArray(inv) && inv.length) return inv;

    const old = lsGet("materials", []);
    if (old.length) {
      const migrated = migrateOldCostMaterialsToInventory(old);
      lsSet("inventory_materials", migrated);
      return migrated;
    }

    return [];
  });

  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");

  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    supplierId: "",
    unitPrice: "",
    onHand: "",
    reorderLevel: "",
    sku: "",
    notes: "",
  });

  useEffect(() => {
    lsSet("inventory_materials", materials);
  }, [materials]);

  const supplierName = (supplierId) =>
    suppliers.find((s) => Number(s.id) === Number(supplierId))?.name || "—";

  const lowStockCount = useMemo(() => {
    return materials.filter(
      (m) => Number(m.onHand || 0) <= Number(m.reorderLevel || 0)
    ).length;
  }, [materials]);

  const filtered = useMemo(() => {
    return materials.filter((m) => {
      const matchSearch =
        (m.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (m.sku || "").toLowerCase().includes(search.toLowerCase());

      const matchSupplier = supplierFilter
        ? String(m.supplierId) === String(supplierFilter)
        : true;

      return matchSearch && matchSupplier;
    });
  }, [materials, search, supplierFilter]);

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

  const submit = (e) => {
    e.preventDefault();
    if (!canManageInventory) return;

    if (!form.name.trim()) return alert("Material name is required");

    const payload = {
      name: form.name.trim(),
      supplierId: form.supplierId ? Number(form.supplierId) : "",
      unitPrice: Number(form.unitPrice || 0),
      onHand: Number(form.onHand || 0),
      reorderLevel: Number(form.reorderLevel || 0),
      sku: (form.sku || "").trim(),
      notes: form.notes || "",
      updatedAt: new Date().toISOString(),
    };

    if (editId) {
      setMaterials((prev) =>
        prev.map((m) => (m.id === editId ? { ...m, ...payload } : m))
      );
    } else {
      setMaterials((prev) => [
        {
          id: Date.now(),
          ...payload,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }

    resetForm();
  };

  const onEdit = (m) => {
    if (!canManageInventory) return;

    setEditId(m.id);
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

  const onDelete = (id) => {
    if (!canManageInventory) return;

    const ok = confirm("Delete this inventory material?");
    if (!ok) return;
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    if (editId === id) resetForm();
  };

  const adjustStock = (id, delta) => {
    if (!canManageInventory) return;

    const d = Number(delta || 0);
    if (!d) return;

    setMaterials((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const next = Math.max(0, Number(m.onHand || 0) + d);
        return { ...m, onHand: next, updatedAt: new Date().toISOString() };
      })
    );
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
            Track stock quantity, unit price and suppliers (used by Purchase Orders)
          </p>
          {readOnly && (
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
              Read-only access for Accountant role.
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-300">Low Stock Items</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {lowStockCount}
          </p>
        </div>
      </div>

      {/* Search / Filter */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <input
          className="border p-3 rounded-xl w-full md:w-[320px] bg-white dark:bg-gray-950 dark:text-white"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex gap-3">
          <select
            className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            className="bg-gray-200 hover:bg-gray-300 px-4 py-3 rounded-xl"
            onClick={() => {
              setSearch("");
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
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Shingles"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Supplier (optional)</label>
              <select
                className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                value={form.supplierId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, supplierId: e.target.value }))
                }
              >
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
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
                onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                placeholder="e.g. SH-001"
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
              />
            </div>
          </div>

          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl w-full hover:bg-blue-700">
            {editId ? "Update Material" : "Add Material"}
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
              {canManageInventory && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {filtered.map((m) => {
              const low = Number(m.onHand || 0) <= Number(m.reorderLevel || 0);

              return (
                <tr
                  key={m.id}
                  className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950"
                >
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                    {m.name}
                    {m.sku ? (
                      <span className="ml-2 text-xs text-gray-500">({m.sku})</span>
                    ) : null}
                  </td>

                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {m.supplierId ? supplierName(m.supplierId) : "—"}
                  </td>

                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    ${Number(m.unitPrice || 0).toFixed(2)}
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
                        low ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
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
                          className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                          onClick={() => adjustStock(m.id, -1)}
                          title="Decrease stock"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                          onClick={() => adjustStock(m.id, +1)}
                          title="Increase stock"
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
                        className="text-blue-600 hover:underline"
                        onClick={() => onEdit(m)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => onDelete(m.id)}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}

            {filtered.length === 0 && (
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