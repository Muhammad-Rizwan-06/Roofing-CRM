import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useContracts } from "../../context/ContractContext";
import { useProjects } from "../../context/ProjectsContext";
import { useUser } from "../../context/UserContext";
import { runMaintenanceScheduler } from "../../utils/maintenanceScheduler";

import { useCompany } from "../../context/CompanyContext";


const todayKey = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  planName: "Annual Roof Inspection",
  frequencyMonths: 12,
  startDate: todayKey(),
  endDate: "",
  nextRunDate: todayKey(),
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
  userId: "",
});

export default function MaintenanceContracts() {
  const {
    contracts,
    loading,
    error,
    getAllContracts,
    getAllVisits,
    createContract,
    updateContract,
    deleteContract,
    addVisit,
    updateVisit,
    deleteVisit,
    // inspections
    addContractInspection, // ✅
  } = useContracts();

  const money = (n) => `${company?.currency} ${Number(n || 0).toFixed(2)}`;


  const { projects, getAll } = useProjects(); // ✅ removed addInspection
  const { getCustomers, customers = [] } = useUser();

  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(() => emptyForm());
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const { company, getCompany } = useCompany();

  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const filteredContracts = useMemo(() => {
    if (!searchQuery.trim()) return contracts || [];
    const q = searchQuery.toLowerCase();
    return (contracts || []).filter((c) => {
      const contractNo = (c.contractNo || "").toLowerCase();
      const customerName = (c.customerName || "").toLowerCase();
      const customerEmail = (c.customerEmail || "").toLowerCase();
      const planName = (c.planName || "").toLowerCase();
      const status = (c.status || "").toLowerCase();
      return (
        contractNo.includes(q) ||
        customerName.includes(q) ||
        customerEmail.includes(q) ||
        planName.includes(q) ||
        status.includes(q)
      );
    });
  }, [contracts, searchQuery]);

  useEffect(() => {
    getCompany();
  }, [getCompany]);


  useEffect(() => {
    const init = async () => {
      await Promise.all([getAllContracts(), getAll(), getCustomers()]);
      setPageLoading(false);
    };
    init();
  }, []);

  const totalActive = useMemo(
    () => filteredContracts.filter((c) => c.status === "Active").length,
    [filteredContracts],
  );

  const reset = () => {
    setEditId(null);
    setForm(emptyForm());
    setSelectedCustomer("");
  };

  // Handle project selection - auto-fill customer from project
  const handleProjectChange = (projectId) => {
    if (projectId) {
      const project = projects.find((proj) => proj.projectId === projectId);
      if (project) {
        setForm((prev) => ({
          ...prev,
          projectId,
          customerName: project.client || "",
          customerEmail: project.clientEmail || "",
          userId: project.userId || "",
        }));
      }
    } else {
      setForm((prev) => ({
        ...prev,
        projectId: "",
        customerName: "",
        customerEmail: "",
        userId: "",
      }));
    }
    setSelectedCustomer(""); // Clear customer selection
  };

  // Handle customer selection - auto-fill customer data
  const handleCustomerSelect = (customerId) => {
    setSelectedCustomer(customerId);
    setForm((p) => ({ ...p, projectId: "" })); // Clear project selection

    if (customerId) {
      const customer = customers.find((c) => c.userId === customerId);
      if (customer) {
        setForm((prev) => ({
          ...prev,
          customerName: customer.name || "",
          customerEmail: customer.email || "",
          userId: customer.userId || "",
        }));
      }
    } else {
      setForm((prev) => ({
        ...prev,
        customerName: "",
        customerEmail: "",
        userId: "",
      }));
    }
  };

  const openAdd = () => {
    reset();
    setOpen(true);
  };

  const openEdit = (c) => {
    setEditId(c.contractId);
    setForm({
      planName: c.planName || "Annual Roof Inspection",
      frequencyMonths: Number(c.frequencyMonths || 12),
      startDate: c.startDate || todayKey(),
      endDate: c.endDate || "",
      nextRunDate: c.nextRunDate || c.startDate || todayKey(),
      customerName: c.customerName || "",
      customerEmail: c.customerEmail || "",
      projectId: c.projectId ?? "",
      projectName: c.projectName || "",
      propertyLine1: c.propertyAddress?.line1 || "",
      propertyLine2: c.propertyAddress?.line2 || "",
      city: c.propertyAddress?.city || "",
      state: c.propertyAddress?.state || "",
      zip: c.propertyAddress?.zip || "",
      price: Number(c.price || 0),
      autoInvoice: Boolean(c.autoInvoice),
      status: c.status || "Active",
      userId: c.userId || "",
    });
    setSelectedCustomer(c.userId || "");
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.customerName.trim()) return alert("Customer name required");
    if (!form.customerEmail.trim()) return alert("Customer email required");
    if (!form.propertyLine1.trim())
      return alert("Property address line 1 required");
    if (!form.startDate) return alert("Start date required");

    const selectedProject = projects.find(
      (p) => p.projectId === form.projectId,
    );

    const payload = {
      planName: form.planName.trim() || "Maintenance",
      frequencyMonths: Number(form.frequencyMonths || 12),
      startDate: form.startDate,
      endDate: form.endDate || "",
      nextRunDate: form.nextRunDate || form.startDate,
      customerName: form.customerName.trim(),
      customerEmail: form.customerEmail.trim().toLowerCase(),
      projectId: form.projectId || null,
      projectName: selectedProject?.name?.trim() || form.projectName || "",
      userId: form.userId || "",
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
    };

    setSubmitting(true);

    let result;
    if (editId) {
      result = await updateContract(editId, payload);
    } else {
      result = await createContract(payload);
    }

    setSubmitting(false);

    if (!result.ok) return alert(result.message);

    const currentVisits = editId ? (await getAllVisits()).data || [] : [];

    await runMaintenanceScheduler({
      contracts: editId
        ? contracts.map((c) => (c.contractId === editId ? result.data : c))
        : [...contracts, result.data],
      visits: currentVisits,
      addVisit,
      addContractInspection, // ✅
      updateVisit,
      updateContract,
    });

    setOpen(false);
    reset();
  };

  const remove = async (contractId) => {
    const confirmed = confirm(
      "Delete this maintenance contract? Related visits will also be deleted.",
    );
    if (!confirmed) return;

    const result = await deleteContract(contractId);
    if (!result.ok) alert(result.message);
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
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {totalActive}
            </p>
          </div>

          <button
            onClick={openAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition h-fit"
          >
            + New Contract
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300">
          Error: {error}
        </div>
      )}

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
            {filteredContracts.map((c) => (
              <tr
                key={c.contractId}
                className="border-t border-gray-100 dark:border-gray-800"
              >
                <td className="p-3 font-medium">{c.contractNo || "—"}</td>
                <td className="p-3">
                  <div className="font-medium text-gray-800 dark:text-gray-100">
                    {c.customerName}
                  </div>
                  <div className="text-xs text-gray-500">{c.customerEmail}</div>
                </td>
                <td className="p-3 text-gray-700 dark:text-gray-200">
                  {c.propertyAddress?.line1 || "—"}
                </td>
                <td className="p-3 text-gray-700 dark:text-gray-200">
                  {c.planName} • {c.frequencyMonths}mo
                </td>
                <td className="p-3 text-gray-700 dark:text-gray-200">
                  {c.nextRunDate || "—"}
                </td>
                <td className="p-3 text-gray-700 dark:text-gray-200">
                  {money(c.price)}
                </td>
                <td className="p-3 text-gray-700 dark:text-gray-200">
                  {c.status}
                </td>
                <td className="p-3 text-right space-x-3">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => openEdit(c)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => remove(c.contractId)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filteredContracts.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="p-6 text-center text-gray-500 dark:text-gray-300"
                >
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
                  Creates recurring visits automatically based on frequency +
                  next date.
                </p>
              </div>

              <button
                className="px-3 py-1 rounded-lg dark:bg-gray-900 bg-gray-200 hover:bg-gray-700 text-sm"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
              >
                Close
              </button>
            </div>

            <form
              onSubmit={submit}
              className="p-4 space-y-4 overflow-y-auto max-h-[75vh]"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Plan Name</label>
                  <input
                    className="w-full mt-1 border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                    placeholder="e.g. Annual Roof Inspection"
                    value={form.planName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, planName: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">Frequency</label>
                  <select
                    className="w-full mt-1 border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                    value={form.frequencyMonths}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        frequencyMonths: Number(e.target.value),
                      }))
                    }
                  >
                    <option value={12}>Every 12 months (Annual)</option>
                    <option value={6}>Every 6 months (Semi-Annual)</option>
                    <option value={3}>Every 3 months (Quarterly)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500">Status</label>
                  <select
                    className="w-full mt-1 border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                    value={form.status}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, status: e.target.value }))
                    }
                  >
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500">Start Date *</label>
                  <input
                    type="date"
                    className="w-full mt-1 border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, startDate: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">
                    End Date (optional)
                  </label>
                  <input
                    type="date"
                    className="w-full mt-1 border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, endDate: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">Next Visit Date</label>
                  <input
                    type="date"
                    className="w-full mt-1 border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                    value={form.nextRunDate}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, nextRunDate: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">Customer Name *</label>
                  <input
                    className="w-full mt-1 border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                    placeholder="Customer name"
                    value={form.customerName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, customerName: e.target.value }))
                    }
                    readOnly={!!(form.projectId || selectedCustomer)}
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">Customer Email *</label>
                  <input
                    type="email"
                    className="w-full mt-1 border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                    placeholder="customer@email.com"
                    value={form.customerEmail}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, customerEmail: e.target.value }))
                    }
                    readOnly={!!(form.projectId || selectedCustomer)}
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">
                    Project (optional)
                  </label>
                  <select
                    className="w-full mt-1 border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                    value={form.projectId}
                    onChange={(e) => handleProjectChange(e.target.value)}
                  >
                    <option value="">No project linked</option>
                    {projects.map((p) => (
                      <option key={p.projectId} value={p.projectId}>
                        {p.name?.trim()}
                      </option>
                    ))}
                  </select>
                </div>

                {!form.projectId && (
                  <div>
                    <label className="text-xs text-gray-500">Customer</label>
                    <select
                      className="w-full mt-1 border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                      value={selectedCustomer}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                    >
                      <option value="">Select customer</option>
                      {customers.map((c) => (
                        <option key={c.userId} value={c.userId}>
                          {c.name} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="md:col-span-3">
                  <label className="text-xs text-gray-500">
                    Property Address Line 1 *
                  </label>
                  <input
                    className="w-full mt-1 border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                    placeholder="Street address"
                    value={form.propertyLine1}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, propertyLine1: e.target.value }))
                    }
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-xs text-gray-500">
                    Property Address Line 2 (optional)
                  </label>
                  <input
                    className="w-full mt-1 border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                    placeholder="Apt, suite, unit, etc."
                    value={form.propertyLine2}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, propertyLine2: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">City</label>
                  <input
                    className="w-full mt-1 border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                    placeholder="City"
                    value={form.city}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, city: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">State</label>
                  <input
                    className="w-full mt-1 border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                    placeholder="State"
                    value={form.state}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, state: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">ZIP</label>
                  <input
                    className="w-full mt-1 border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                    placeholder="ZIP code"
                    value={form.zip}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, zip: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">
                    Price per Visit (optional)
                  </label>
                  <input
                    type="number"
                    className="w-full mt-1 border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
                    placeholder="0.00"
                    value={form.price}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, price: e.target.value }))
                    }
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <input
                      type="checkbox"
                      checked={form.autoInvoice}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          autoInvoice: e.target.checked,
                        }))
                      }
                    />
                    Auto-create invoice for each visit
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl dark:bg-gray-700 bg-gray-200 hover:bg-gray-600"
                  onClick={() => {
                    setOpen(false);
                    reset();
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : editId
                      ? "Save Changes"
                      : "Create Contract"}
                </button>
              </div>

              <p className="text-xs text-gray-500">
                Note: Visits are generated automatically when the app loads
                (scheduler).
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
