import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ROLE } from "../../config/accessControl";

const lsGet = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const lsSet = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const calcTotal = (items = []) =>
  items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.unitCost || 0), 0);

const nextNo = (prefix, list, field) => {
  const max = (list || []).reduce((m, x) => {
    const n = Number(String(x[field] || "").replace(prefix + "-", "")) || 0;
    return Math.max(m, n);
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
};

const PurchaseOrders = () => {
  const { user } = useAuth();
  const roleName = user?.roleName;

  const isAdmin = roleName === ROLE.ADMIN;
  const isPM = roleName === ROLE.PM;
  const isAccountant = roleName === ROLE.ACCOUNTANT;

  // ✅ Admin/PM can create/receive PO; Accountant read-only
  const canManagePO = isAdmin || isPM;
  const readOnly = isAccountant;

  const [suppliers] = useState(() => lsGet("suppliers", []));
  const [projects] = useState(() => lsGet("projects", []));

  const [purchaseOrders, setPurchaseOrders] = useState(() =>
    lsGet("purchase_orders", [])
  );

  const [inventoryMaterials, setInventoryMaterials] = useState(() =>
    lsGet("inventory_materials", [])
  );

  const [form, setForm] = useState({
    supplierId: "",
    projectId: "",
    issueDate: new Date().toISOString().slice(0, 10),
    expectedDate: "",
    notes: "",
    items: [
      { materialId: "", materialName: "", description: "", qty: 1, unitCost: 0 },
    ],
  });

  useEffect(() => lsSet("purchase_orders", purchaseOrders), [purchaseOrders]);
  useEffect(() => lsSet("inventory_materials", inventoryMaterials), [inventoryMaterials]);

  const supplier = useMemo(
    () => suppliers.find((s) => String(s.id) === String(form.supplierId)),
    [suppliers, form.supplierId]
  );

  const project = useMemo(
    () => projects.find((p) => String(p.id) === String(form.projectId)),
    [projects, form.projectId]
  );

  const total = useMemo(() => calcTotal(form.items), [form.items]);

  const updateItem = (idx, key, value) => {
    if (!canManagePO) return;

    setForm((p) => {
      const items = [...p.items];
      items[idx] = { ...items[idx], [key]: value };

      if (key === "materialId") {
        const mat = inventoryMaterials.find((m) => String(m.id) === String(value));
        if (mat) {
          items[idx].materialName = mat.name || "";
          if (!Number(items[idx].unitCost)) {
            items[idx].unitCost = Number(mat.unitPrice || 0);
          }
        } else {
          items[idx].materialName = items[idx].materialName || "";
        }
      }

      return { ...p, items };
    });
  };

  const addItemRow = () => {
    if (!canManagePO) return;

    setForm((p) => ({
      ...p,
      items: [
        ...p.items,
        { materialId: "", materialName: "", description: "", qty: 1, unitCost: 0 },
      ],
    }));
  };

  const removeItemRow = (idx) => {
    if (!canManagePO) return;

    setForm((p) => ({
      ...p,
      items: p.items.length === 1 ? p.items : p.items.filter((_, i) => i !== idx),
    }));
  };

  const createPO = (e) => {
    e.preventDefault();
    if (!canManagePO) return;

    if (!form.supplierId) return alert("Supplier is required");
    if (!form.issueDate) return alert("Issue date is required");

    const invalid = form.items.some(
      (it) => !it.materialName.trim() || Number(it.qty || 0) <= 0
    );
    if (invalid) return alert("Each item must have Material Name and Qty > 0");

    const po = {
      id: Date.now(),
      poNo: nextNo("PO", purchaseOrders, "poNo"),
      supplierId: Number(form.supplierId),
      supplierName: supplier?.name || "",
      projectId: form.projectId ? Number(form.projectId) : null,
      projectName: project?.name || "",
      status: "Draft",
      issueDate: form.issueDate,
      expectedDate: form.expectedDate || "",
      notes: form.notes || "",
      items: form.items.map((it) => ({
        materialId: it.materialId ? Number(it.materialId) : null,
        materialName: (it.materialName || "").trim(),
        description: (it.description || "").trim(),
        qty: Number(it.qty || 0),
        unitCost: Number(it.unitCost || 0),
      })),
      total: Number(total || 0),
      createdAt: new Date().toISOString(),
      receivedAt: null,
    };

    setPurchaseOrders((prev) => [po, ...prev]);

    setForm({
      supplierId: "",
      projectId: "",
      issueDate: new Date().toISOString().slice(0, 10),
      expectedDate: "",
      notes: "",
      items: [{ materialId: "", materialName: "", description: "", qty: 1, unitCost: 0 }],
    });
  };

  const setStatus = (poId, status) => {
    if (!canManagePO) return;
    setPurchaseOrders((prev) => prev.map((p) => (p.id === poId ? { ...p, status } : p)));
  };

  const deletePO = (poId) => {
    if (!canManagePO) return;
    const ok = confirm("Delete this Purchase Order?");
    if (!ok) return;
    setPurchaseOrders((prev) => prev.filter((p) => p.id !== poId));
  };

  const markReceived = (po) => {
    if (!canManagePO) return;
    if (po.status === "Received") return;

    // 1) Update inventory stock
    setInventoryMaterials((prev) => {
      const updated = [...prev];

      po.items.forEach((it) => {
        if (it.materialId) {
          const idx = updated.findIndex((m) => Number(m.id) === Number(it.materialId));
          if (idx >= 0) {
            updated[idx] = {
              ...updated[idx],
              onHand: Number(updated[idx].onHand || 0) + Number(it.qty || 0),
              unitPrice: Number(it.unitCost || updated[idx].unitPrice || 0),
              updatedAt: new Date().toISOString(),
            };
            return;
          }
        }

        const newMat = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          name: it.materialName,
          unitPrice: Number(it.unitCost || 0),
          onHand: Number(it.qty || 0),
          reorderLevel: 0,
          supplierId: po.supplierId || "",
          notes: `Created from PO ${po.poNo}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        updated.push(newMat);
      });

      return updated;
    });

    // 2) Auto-create Expense if projectId exists
    if (po.projectId) {
      const expenses = lsGet("expenses", []);
      const expense = {
        id: Date.now(),
        expenseNo: nextNo("EXP", expenses, "expenseNo"),
        projectId: po.projectId,
        projectName: po.projectName,
        vendor: po.supplierName,
        category: "Materials",
        date: new Date().toISOString().slice(0, 10),
        amount: Number(po.total || 0),
        note: `Auto from PO ${po.poNo}`,
      };
      lsSet("expenses", [...expenses, expense]);
    }

    // 3) Update PO status + receivedAt
    setPurchaseOrders((prev) =>
      prev.map((p) =>
        p.id === po.id ? { ...p, status: "Received", receivedAt: new Date().toISOString() } : p
      )
    );
  };

  const badge = (status) => {
    if (status === "Draft") return "bg-gray-100 text-gray-700";
    if (status === "Sent") return "bg-yellow-100 text-yellow-700";
    if (status === "Received") return "bg-green-100 text-green-700";
    if (status === "Cancelled") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Purchase Orders
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-300">
          Draft → Sent → Received. Receiving updates inventory stock and (if linked to a project) creates a Materials expense.
        </p>
        {readOnly && (
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
            Read-only access for Accountant role.
          </p>
        )}
      </div>

      {/* Create PO (Admin/PM only) */}
      {canManagePO && (
        <form
          onSubmit={createPO}
          className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow space-y-4 border border-gray-100 dark:border-gray-800"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500">Supplier *</label>
              <select
                value={form.supplierId}
                onChange={(e) => setForm((p) => ({ ...p, supplierId: e.target.value }))}
                className="w-full mt-1 border p-2 rounded bg-white dark:bg-gray-950 dark:text-white"
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
              <label className="text-xs text-gray-500">Project (optional)</label>
              <select
                value={form.projectId}
                onChange={(e) => setForm((p) => ({ ...p, projectId: e.target.value }))}
                className="w-full mt-1 border p-2 rounded bg-white dark:bg-gray-950 dark:text-white"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.client}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500 mt-1">
                If selected, “Mark Received” auto-creates an Expense for job costing.
              </p>
            </div>

            <div>
              <label className="text-xs text-gray-500">Issue Date *</label>
              <input
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm((p) => ({ ...p, issueDate: e.target.value }))}
                className="w-full mt-1 border p-2 rounded bg-white dark:bg-gray-950 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Expected Date</label>
              <input
                type="date"
                value={form.expectedDate}
                onChange={(e) => setForm((p) => ({ ...p, expectedDate: e.target.value }))}
                className="w-full mt-1 border p-2 rounded bg-white dark:bg-gray-950 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-gray-500">Notes</label>
              <input
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                className="w-full mt-1 border p-2 rounded bg-white dark:bg-gray-950 dark:text-white"
                placeholder="Optional notes"
              />
            </div>
          </div>

          {/* Items */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-950">
              <p className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                Items
              </p>
              <button
                type="button"
                onClick={addItemRow}
                className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                + Add Item
              </button>
            </div>

            <div className="p-4 space-y-3">
              {form.items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <select
                    className="col-span-12 md:col-span-3 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
                    value={it.materialId || ""}
                    onChange={(e) => updateItem(idx, "materialId", e.target.value)}
                    title="Link to inventory material (optional)"
                  >
                    <option value="">(Optional) Select inventory material</option>
                    {inventoryMaterials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (OnHand: {Number(m.onHand || 0)})
                      </option>
                    ))}
                  </select>

                  <input
                    className="col-span-12 md:col-span-3 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
                    placeholder="Material Name *"
                    value={it.materialName}
                    onChange={(e) => updateItem(idx, "materialName", e.target.value)}
                  />

                  <input
                    className="col-span-12 md:col-span-3 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
                    placeholder="Description"
                    value={it.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                  />

                  <input
                    type="number"
                    className="col-span-6 md:col-span-1 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
                    placeholder="Qty"
                    value={it.qty}
                    onChange={(e) => updateItem(idx, "qty", e.target.value)}
                  />

                  <input
                    type="number"
                    className="col-span-6 md:col-span-1 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
                    placeholder="Unit Cost"
                    value={it.unitCost}
                    onChange={(e) => updateItem(idx, "unitCost", e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    className="col-span-12 md:col-span-1 text-red-600 hover:underline text-sm justify-self-end"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-200">
              <div className="flex justify-end">
                <span className="font-semibold">
                  Total: ${Number(total || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-700">
            Create Purchase Order
          </button>
        </form>
      )}

      {/* PO list */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-x-auto border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">
          Purchase Order List
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-200">
            <tr>
              <th className="px-4 py-3">PO #</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Issue</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              {canManagePO && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {purchaseOrders.map((po) => (
              <tr
                key={po.id}
                className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950"
              >
                <td className="px-4 py-3 font-medium">{po.poNo}</td>
                <td className="px-4 py-3">{po.supplierName}</td>
                <td className="px-4 py-3">{po.projectName || "—"}</td>
                <td className="px-4 py-3">{po.issueDate}</td>
                <td className="px-4 py-3">${Number(po.total || 0).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 text-xs rounded-full ${badge(po.status)}`}>
                    {po.status}
                  </span>
                </td>

                {canManagePO && (
                  <td className="px-4 py-3 text-right space-x-3">
                    {po.status === "Draft" && (
                      <button
                        className="text-indigo-600 hover:underline"
                        onClick={() => setStatus(po.id, "Sent")}
                      >
                        Mark Sent
                      </button>
                    )}

                    {po.status !== "Received" && po.status !== "Cancelled" && (
                      <button
                        className="text-green-600 hover:underline"
                        onClick={() => markReceived(po)}
                      >
                        Mark Received
                      </button>
                    )}

                    {po.status !== "Received" && (
                      <button
                        className="text-orange-600 hover:underline"
                        onClick={() => setStatus(po.id, "Cancelled")}
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => deletePO(po.id)}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {purchaseOrders.length === 0 && (
              <tr>
                <td colSpan={canManagePO ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                  No purchase orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseOrders;