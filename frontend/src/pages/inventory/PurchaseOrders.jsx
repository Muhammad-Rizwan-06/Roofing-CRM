import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROLE } from "../../config/accessControl";
import { usePurchaseOrders } from "../../context/PurchaseOrdersContext";
import { useSuppliers } from "../../context/SuppliersContext";
import { useMaterials } from "../../context/MaterialsContext";
import { useProjects } from "../../context/ProjectsContext";
import { useCompany } from "../../context/CompanyContext";

const calcTotal = (items = []) =>
  items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.unitCost || 0), 0);

const PurchaseOrders = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const { user } = useAuth();
  const { orders, loading, error, fetchOrders, addOrder, setStatus: setStatusAPI, markReceived: markReceivedAPI, deleteOrder } = usePurchaseOrders();
  const { suppliers, fetchSuppliers } = useSuppliers();
  const { materials, fetchMaterials } = useMaterials();
  const { projects, getAll: fetchProjects } = useProjects();
  const roleName = user?.roleName;

  const isAdmin = roleName === ROLE.ADMIN;
  const isPM = roleName === ROLE.PM;
  const isAccountant = roleName === ROLE.ACCOUNTANT;

  // ✅ Admin/PM can create/receive PO; Accountant read-only
  const canManagePO = isAdmin || isPM;
  const readOnly = isAccountant;

  const [isSaving, setIsSaving] = useState(false);

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

  const { company, getCompany } = useCompany();

  useEffect(() => {
    getCompany();
  }, [getCompany]);


  // Load all data on mount
  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchMaterials();
    fetchProjects();
  }, []);

  const supplier = useMemo(
    () => suppliers.find((s) => String(s.supplierId) === String(form.supplierId)),
    [suppliers, form.supplierId]
  );

  const project = useMemo(
    () => projects.find((p) => String(p.projectId) === String(form.projectId)),
    [projects, form.projectId]
  );

  const total = useMemo(() => calcTotal(form.items), [form.items]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders || [];
    const q = searchQuery.toLowerCase();
    return (orders || []).filter((po) => {
      const poNo = (po.poNo || "").toLowerCase();
      const supplierName = (po.supplierName || "").toLowerCase();
      const projectName = (po.projectName || "").toLowerCase();
      const status = (po.status || "").toLowerCase();
      return (
        poNo.includes(q) ||
        supplierName.includes(q) ||
        projectName.includes(q) ||
        status.includes(q)
      );
    });
  }, [orders, searchQuery]);

  const updateItem = (idx, key, value) => {
    if (!canManagePO) return;

    setForm((p) => {
      const items = [...p.items];
      items[idx] = { ...items[idx], [key]: value };

      if (key === "materialId") {
        const mat = materials.find((m) => String(m.materialId) === String(value));
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

  const createPO = async (e) => {
    e.preventDefault();
    if (!canManagePO) return;

    if (!form.supplierId) return alert("Supplier is required");
    if (!form.issueDate) return alert("Issue date is required");

    const invalid = form.items.some(
      (it) => !it.materialName.trim() || Number(it.qty || 0) <= 0
    );
    if (invalid) return alert("Each item must have Material Name and Qty > 0");

    const payload = {
      supplierId: (form.supplierId),
      supplierName: supplier?.name || "",
      projectId: form.projectId ? (form.projectId) : null,
      projectName: project?.name || "",
      issueDate: form.issueDate,
      expectedDate: form.expectedDate || "",
      notes: form.notes || "",
      items: form.items.map((it) => ({
        materialId: it.materialId ? (it.materialId) : null,
        materialName: (it.materialName || "").trim(),
        description: (it.description || "").trim(),
        qty: Number(it.qty || 0),
        unitCost: Number(it.unitCost || 0),
      })),
    };

    try {
      setIsSaving(true);
      await addOrder(payload);

      setForm({
        supplierId: "",
        projectId: "",
        issueDate: new Date().toISOString().slice(0, 10),
        expectedDate: "",
        notes: "",
        items: [{ materialId: "", materialName: "", description: "", qty: 1, unitCost: 0 }],
      });
    } catch (err) {
      console.error("Error creating PO:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const setStatus = async (poId, status) => {
    if (!canManagePO) return;
    try {
      setIsSaving(true);
      await setStatusAPI(poId, status);
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const deletePO = async (poId) => {
    if (!canManagePO) return;
    const ok = confirm("Delete this Purchase Order?");
    if (!ok) return;
    try {
      setIsSaving(true);
      await deleteOrder(poId);
    } catch (err) {
      console.error("Error deleting PO:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const markReceived = async (poId) => {
    if (!canManagePO) return;

    try {
      setIsSaving(true);
      await markReceivedAPI(poId);
    } catch (err) {
      console.error("Error marking received:", err);
    } finally {
      setIsSaving(false);
    }
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
          Draft → Sent → Received. Receiving updates inventory stock and (if
          linked to a project) creates a Materials expense.
        </p>
        {readOnly && (
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
            Read-only access for Accountant role.
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
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
                onChange={(e) =>
                  setForm((p) => ({ ...p, supplierId: e.target.value }))
                }
                className="w-full mt-1 border p-2 rounded bg-white dark:bg-gray-950 dark:text-white"
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
              <label className="text-xs text-gray-500">
                Project (optional)
              </label>
              <select
                value={form.projectId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, projectId: e.target.value }))
                }
                className="w-full mt-1 border p-2 rounded bg-white dark:bg-gray-950 dark:text-white"
                disabled={isSaving}
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.projectId} value={p.projectId}>
                    {p.name} — {p.client}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500 mt-1">
                If selected, “Mark Received” auto-creates an Expense for job
                costing.
              </p>
            </div>

            <div>
              <label className="text-xs text-gray-500">Issue Date *</label>
              <input
                type="date"
                value={form.issueDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, issueDate: e.target.value }))
                }
                className="w-full mt-1 border p-2 rounded bg-white dark:bg-gray-950 dark:text-white"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Expected Date</label>
              <input
                type="date"
                value={form.expectedDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, expectedDate: e.target.value }))
                }
                className="w-full mt-1 border p-2 rounded bg-white dark:bg-gray-950 dark:text-white"
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
                className="w-full mt-1 border p-2 rounded bg-white dark:bg-gray-950 dark:text-white"
                placeholder="Optional notes"
                disabled={isSaving}
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
                className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
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
                    onChange={(e) =>
                      updateItem(idx, "materialId", e.target.value)
                    }
                    title="Link to inventory material (optional)"
                    disabled={isSaving}
                  >
                    <option value="">
                      (Optional) Select inventory material
                    </option>
                    {materials.map((m) => (
                      <option key={m.materialId} value={m.materialId}>
                        {m.name} (OnHand: {Number(m.onHand || 0)})
                      </option>
                    ))}
                  </select>

                  <input
                    className="col-span-12 md:col-span-3 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
                    placeholder="Material Name *"
                    value={it.materialName}
                    onChange={(e) =>
                      updateItem(idx, "materialName", e.target.value)
                    }
                    disabled={isSaving}
                  />

                  <input
                    className="col-span-12 md:col-span-3 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
                    placeholder="Description"
                    value={it.description}
                    onChange={(e) =>
                      updateItem(idx, "description", e.target.value)
                    }
                    disabled={isSaving}
                  />

                  <input
                    type="number"
                    className="col-span-6 md:col-span-1 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
                    placeholder="Qty"
                    value={it.qty}
                    onChange={(e) => updateItem(idx, "qty", e.target.value)}
                    disabled={isSaving}
                  />

                  <input
                    type="number"
                    className="col-span-6 md:col-span-1 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
                    placeholder="Unit Cost"
                    value={it.unitCost}
                    onChange={(e) =>
                      updateItem(idx, "unitCost", e.target.value)
                    }
                    disabled={isSaving}
                  />

                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    className="col-span-12 md:col-span-1 text-red-600 hover:underline text-sm justify-self-end disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSaving}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-200">
              <div className="flex justify-end">
                <span className="font-semibold">
                  Total: {company?.currency} {Number(total || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Creating..." : "Create Purchase Order"}
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
            {filteredOrders.map((po) => (
              <tr
                key={po.orderId}
                className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950"
              >
                <td className="px-4 py-3 font-medium">{po.poNo}</td>
                <td className="px-4 py-3">{po.supplierName}</td>
                <td className="px-4 py-3">{po.projectName || "—"}</td>
                <td className="px-4 py-3">{po.issueDate}</td>
                <td className="px-4 py-3">
                  {company?.currency} {Number(po.total || 0).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${badge(po.status)}`}
                  >
                    {po.status}
                  </span>
                </td>

                {canManagePO && (
                  <td className="px-4 py-3 text-right space-x-3">
                    {po.status === "Draft" && (
                      <button
                        className="text-indigo-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setStatus(po.orderId, "Sent")}
                        disabled={isSaving}
                      >
                        Mark Sent
                      </button>
                    )}

                    {po.status !== "Received" && po.status !== "Cancelled" && (
                      <button
                        className="text-green-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => markReceived(po.orderId)}
                        disabled={isSaving}
                      >
                        Mark Received
                      </button>
                    )}

                    {po.status !== "Received" && po.status !== "Cancelled" &&(
                      <button
                        className="text-orange-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setStatus(po.orderId, "Cancelled")}
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      className="text-red-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => deletePO(po.orderId)}
                      disabled={isSaving}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {filteredOrders.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={canManagePO ? 7 : 6}
                  className="px-4 py-8 text-center text-gray-500"
                >
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