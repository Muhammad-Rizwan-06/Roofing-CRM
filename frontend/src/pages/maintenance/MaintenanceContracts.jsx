import React, { useMemo, useState } from "react";
import {
  getMaintenanceContracts,
  saveMaintenanceContracts,
  getMaintenanceVisits,
  saveMaintenanceVisits,
  nextSeq,
  todayKey,
  normalizeDateKey,
} from "../../utils/maintenanceStore";
import { runMaintenanceScheduler } from "../../utils/maintenanceScheduler";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

const emptyForm = () => ({
  planName: "Annual Roof Inspection",
  frequencyMonths: 12,
  startDate: todayKey(),
  endDate: "",

  customerName: "",
  customerEmail: "",

  projectId: "",
  projectName: "",

  propertyLine1: "",
  propertyLine2: "",
  city: "",
  state: "",
  zip: "",

  price: 0,
  autoInvoice: false,

  status: "Active",
  nextRunDate: todayKey(),
});

export default function MaintenanceContracts() {
  const [contracts, setContracts] = useState(() => getMaintenanceContracts());
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(() => emptyForm());

  const projects = useMemo(() => {
    return JSON.parse(localStorage.getItem("projects")) || [];
  }, []);

  const totalActive = useMemo(
    () => contracts.filter((c) => String(c.status) === "Active").length,
    [contracts]
  );

  const reset = () => {
    setEditId(null);
    setForm(emptyForm());
  };

  const openAdd = () => {
    reset();
    setOpen(true);
  };

  const openEdit = (c) => {
    setEditId(c.id);
    setForm({
      planName: c.planName || "Annual Roof Inspection",
      frequencyMonths: Number(c.frequencyMonths || 12),
      startDate: normalizeDateKey(c.startDate || todayKey()),
      endDate: c.endDate || "",

      customerName: c.customerName || "",
      customerEmail: c.customerEmail || "",

      projectId: c.projectId != null ? String(c.projectId) : "",
      projectName: c.projectName || "",

      propertyLine1: c.propertyAddress?.line1 || "",
      propertyLine2: c.propertyAddress?.line2 || "",
      city: c.propertyAddress?.city || "",
      state: c.propertyAddress?.state || "",
      zip: c.propertyAddress?.zip || "",

      price: Number(c.price || 0),
      autoInvoice: Boolean(c.autoInvoice),

      status: c.status || "Active",
      nextRunDate: normalizeDateKey(c.nextRunDate || c.startDate || todayKey()),
    });
    setOpen(true);
  };

  const submit = (e) => {
    e.preventDefault();

    if (!form.customerName.trim()) return alert("Customer name required");
    if (!form.customerEmail.trim()) return alert("Customer email required");
    if (!form.propertyLine1.trim()) return alert("Property address line 1 required");
    if (!form.startDate) return alert("Start date required");

    const project = projects.find((p) => String(p.id) === String(form.projectId));

    const payloadBase = {
      planName: form.planName.trim() || "Maintenance",
      frequencyMonths: Number(form.frequencyMonths || 12),
      startDate: normalizeDateKey(form.startDate),
      endDate: form.endDate ? normalizeDateKey(form.endDate) : "",

      customerName: form.customerName.trim(),
      customerEmail: form.customerEmail.trim().toLowerCase(),

      projectId: form.projectId ? Number(form.projectId) : null,
      projectName: project?.name || form.projectName || "",

      propertyAddress: {
        line1: form.propertyLine1.trim(),
        line2: form.propertyLine2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zip: form.zip.trim(),
      },

      price: Number(form.price || 0),
      autoInvoice: Boolean(form.autoInvoice),

      status: form.status,
      nextRunDate: normalizeDateKey(form.nextRunDate || form.startDate),
      updatedAt: new Date().toISOString(),
    };

    let nextContracts;
    if (editId) {
      nextContracts = contracts.map((c) =>
        c.id === editId ? { ...c, ...payloadBase } : c
      );
    } else {
      const newContract = {
        id: Date.now(),
        contractNo: nextSeq("MC", contracts, "contractNo"),
        ...payloadBase,
        createdAt: new Date().toISOString(),
      };
      nextContracts = [newContract, ...contracts];
    }

    saveMaintenanceContracts(nextContracts);
    setContracts(nextContracts);

    // generate visits immediately if startDate <= today
    runMaintenanceScheduler();

    setOpen(false);
    reset();
  };

  const remove = (id) => {
    const ok = confirm("Delete this maintenance contract? Related visits will also be deleted.");
    if (!ok) return;

    const nextContracts = contracts.filter((c) => c.id !== id);
    saveMaintenanceContracts(nextContracts);
    setContracts(nextContracts);

    // cascade delete visits
    const visits = getMaintenanceVisits();
    const nextVisits = visits.filter((v) => Number(v.contractId) !== Number(id));
    saveMaintenanceVisits(nextVisits);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Maintenance Contracts
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Recurring inspection/service agreements (auto-schedules visits)
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-300">Active</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{totalActive}</p>
          </div>

          <button
            onClick={openAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition h-fit"
          >
            + New Contract
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">
          Contracts List
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="text-left p-3">Contract</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Property</th>
              <th className="text-left p-3">Plan</th>
              <th className="text-left p-3">Next Visit</th>
              <th className="text-left p-3">Price</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {contracts.map((c) => (
              <tr key={c.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 font-medium">{c.contractNo || "—"}</td>
                <td className="p-3">
                  <div className="font-medium text-gray-800 dark:text-gray-100">{c.customerName}</div>
                  <div className="text-xs text-gray-500">{c.customerEmail}</div>
                </td>
                <td className="p-3 text-gray-700 dark:text-gray-200">
                  {c.propertyAddress?.line1 || "—"}
                </td>
                <td className="p-3 text-gray-700 dark:text-gray-200">
                  {c.planName} • {c.frequencyMonths}mo
                </td>
                <td className="p-3 text-gray-700 dark:text-gray-200">{c.nextRunDate || "—"}</td>
                <td className="p-3 text-gray-700 dark:text-gray-200">{money(c.price)}</td>
                <td className="p-3 text-gray-700 dark:text-gray-200">{c.status}</td>
                <td className="p-3 text-right space-x-3">
                  <button className="text-blue-600 hover:underline" onClick={() => openEdit(c)}>
                    Edit
                  </button>
                  <button className="text-red-600 hover:underline" onClick={() => remove(c.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {contracts.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500 dark:text-gray-300">
                  No maintenance contracts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {editId ? "Edit Contract" : "New Contract"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                  Creates recurring visits automatically based on frequency + next date.
                </p>
              </div>

              <button
                className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
              >
                Close
              </button>
            </div>

            <form onSubmit={submit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                  placeholder="Plan Name (e.g. Annual Roof Inspection)"
                  value={form.planName}
                  onChange={(e) => setForm((p) => ({ ...p, planName: e.target.value }))}
                />

                <select
                  className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                  value={form.frequencyMonths}
                  onChange={(e) => setForm((p) => ({ ...p, frequencyMonths: Number(e.target.value) }))}
                >
                  <option value={12}>Every 12 months (Annual)</option>
                  <option value={6}>Every 6 months (Semi-Annual)</option>
                  <option value={3}>Every 3 months (Quarterly)</option>
                </select>

                <select
                  className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Expired">Expired</option>
                </select>

                <input
                  type="date"
                  className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                  value={form.startDate}
                  onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                />

                <input
                  type="date"
                  className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                  value={form.endDate}
                  onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                />

                <input
                  type="date"
                  className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                  value={form.nextRunDate}
                  onChange={(e) => setForm((p) => ({ ...p, nextRunDate: e.target.value }))}
                  title="Next scheduled visit date"
                />

                <input
                  className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                  placeholder="Customer Name"
                  value={form.customerName}
                  onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))}
                />
                <input
                  className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                  placeholder="Customer Email (portal)"
                  value={form.customerEmail}
                  onChange={(e) => setForm((p) => ({ ...p, customerEmail: e.target.value }))}
                />

                <select
                  className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                  value={form.projectId}
                  onChange={(e) => setForm((p) => ({ ...p, projectId: e.target.value }))}
                >
                  <option value="">(Optional) Link a Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <input
                  className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white md:col-span-3"
                  placeholder="Property Address Line 1"
                  value={form.propertyLine1}
                  onChange={(e) => setForm((p) => ({ ...p, propertyLine1: e.target.value }))}
                />
                <input
                  className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white md:col-span-3"
                  placeholder="Property Address Line 2 (optional)"
                  value={form.propertyLine2}
                  onChange={(e) => setForm((p) => ({ ...p, propertyLine2: e.target.value }))}
                />

                <input
                  className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                />
                <input
                  className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                  placeholder="State"
                  value={form.state}
                  onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                />
                <input
                  className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                  placeholder="ZIP"
                  value={form.zip}
                  onChange={(e) => setForm((p) => ({ ...p, zip: e.target.value }))}
                />

                <input
                  type="number"
                  className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                  placeholder="Price per Visit (optional)"
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                />

                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={form.autoInvoice}
                    onChange={(e) => setForm((p) => ({ ...p, autoInvoice: e.target.checked }))}
                  />
                  Auto-create invoice for each visit
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
                  onClick={() => {
                    setOpen(false);
                    reset();
                  }}
                >
                  Cancel
                </button>
                <button className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                  {editId ? "Save Changes" : "Create Contract"}
                </button>
              </div>

              <p className="text-xs text-gray-500">
                Note: Visits are generated automatically when the app loads (scheduler).
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}