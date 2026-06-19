import React, { useEffect, useMemo, useState } from "react";
import { useContracts } from "../../context/ContractContext";
import { useProjects } from "../../context/ProjectsContext";
import { runMaintenanceScheduler } from "../../utils/maintenanceScheduler";

export default function MaintenanceVisits() {
  const {
    contracts,
    getAllContracts,
    getAllVisits,
    updateVisit,
    addVisit,
    updateContract,
    addContractInspection,
    updateContractInspection,
  } = useContracts();

  const { getAll: getAllProjects } = useProjects();

  const [visits, setVisits] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const [contractsResult] = await Promise.all([
        getAllContracts(),
        getAllProjects(),
      ]);

      const loadedContracts = contractsResult.ok ? contractsResult.data : [];

      const visitsResult = await getAllVisits();
      const loadedVisits =
        visitsResult.ok && Array.isArray(visitsResult.data)
          ? visitsResult.data
          : [];

      setVisits(loadedVisits);

      await runMaintenanceScheduler({
        contracts: loadedContracts,
        visits: loadedVisits,
        addVisit,
        addContractInspection,
        updateContract,
      });

      setPageLoading(false);
    };
    init();
  }, [
    getAllContracts,
    getAllProjects,
    getAllVisits,
    addVisit,
    addContractInspection,
    updateContract,
  ]);

  // ✅ contractById added back
  const contractById = useMemo(() => {
    const m = new Map();
    contracts.forEach((c) => m.set(String(c.contractId), c));
    return m;
  }, [contracts]);

  // ✅ filtered added back
  const filtered = useMemo(() => {
    let list = [...visits];

    if (statusFilter)
      list = list.filter((v) => String(v.status) === statusFilter);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((v) => {
        const addr = v.propertyAddress?.line1 || "";
        return (
          String(v.customerName || "")
            .toLowerCase()
            .includes(q) ||
          String(v.customerEmail || "")
            .toLowerCase()
            .includes(q) ||
          String(v.planName || "")
            .toLowerCase()
            .includes(q) ||
          String(addr).toLowerCase().includes(q) ||
          String(v.visitNo || "")
            .toLowerCase()
            .includes(q)
        );
      });
    }

    list.sort((a, b) =>
      String(a.scheduledDate).localeCompare(String(b.scheduledDate)),
    );
    return list;
  }, [visits, statusFilter, search]);

  const syncInspectionStatus = async (visit, newVisitStatus) => {
    if (!visit.inspectionId || !visit.contractId) return;

    const map = {
      Scheduled: "Scheduled",
      Completed: "Completed",
      Skipped: "Skipped",
      Cancelled: "Cancelled",
    };

    const rawInspectionId = visit.inspectionId.replace("INSPECTION#", "");

    try {
      await updateContractInspection(visit.contractId, rawInspectionId, {
        status: map[newVisitStatus] || "Scheduled",
      });
    } catch (err) {
      console.error("Failed to sync inspection status:", err.message);
    }
  };

  const setVisitStatus = async (visit, status) => {
    // ✅ strip VISIT# prefix
    const rawVisitId = visit.visitId.replace("VISIT#", "");

    const result = await updateVisit(visit.contractId, rawVisitId, { status });

    if (result.ok) {
      await syncInspectionStatus(visit, status);
      const visitsResult = await getAllVisits();
      if (visitsResult.ok && Array.isArray(visitsResult.data)) {
        setVisits(visitsResult.data);
      }
    }
  };

  const handleRefresh = async () => {
    const [contractsResult, visitsResult] = await Promise.all([
      getAllContracts(),
      getAllVisits(),
    ]);

    const loadedContracts = contractsResult.ok ? contractsResult.data : [];
    const loadedVisits =
      visitsResult.ok && Array.isArray(visitsResult.data)
        ? visitsResult.data
        : [];

    setVisits(loadedVisits);

    await runMaintenanceScheduler({
      contracts: loadedContracts,
      visits: loadedVisits,
      addVisit,
      addContractInspection,
      updateContract,
      updateVisit,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Maintenance Visits
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Scheduled service events generated from maintenance contracts
            (auto-linked to inspections)
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow border border-gray-100 dark:border-gray-800 flex flex-wrap gap-3 items-center">
        <input
          className="border p-2 rounded-lg bg-white dark:bg-gray-950 dark:text-white"
          placeholder="Search visit/customer/email/address/plan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border p-2 rounded-lg bg-white dark:bg-gray-950 dark:text-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Skipped">Skipped</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <button
          className="px-3 py-2 rounded-lg dark:bg-gray-700 bg-gray-200 hover:bg-gray-800"
          onClick={() => {
            setSearch("");
            setStatusFilter("");
          }}
        >
          Reset
        </button>
{/* 
        <button
          className="ml-auto px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          onClick={handleRefresh} // ✅ fixed — was using addInspection which doesn't exist here
        >
          Refresh
        </button> */}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">
          Visit List
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="text-left p-3">Visit</th>
              <th className="text-left p-3">Scheduled</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Property</th>
              <th className="text-left p-3">Plan</th>
              <th className="text-left p-3">Invoice</th>
              <th className="text-left p-3">Inspection</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((v) => {
              const contract = contractById.get(String(v.contractId));
              const contractStatus = contract?.status || "—";

              return (
                <tr
                  key={v.visitId}
                  className="border-t border-gray-100 dark:border-gray-800"
                >
                  <td className="p-3 font-medium">{v.visitNo || "—"}</td>
                  <td className="p-3">{v.scheduledDate || "—"}</td>
                  <td className="p-3">
                    <div className="font-medium text-gray-800 dark:text-gray-100">
                      {v.customerName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {v.customerEmail}
                    </div>
                    <div className="text-xs text-gray-400">
                      Contract: {contract?.contractNo || "—"} ({contractStatus})
                    </div>
                  </td>
                  <td className="p-3">{v.propertyAddress?.line1 || "—"}</td>
                  <td className="p-3">{v.planName || "—"}</td>
                  <td className="p-3">
                    {v.invoiceNo ? (
                      <span>{v.invoiceNo}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p3">
                    {v.inspectionId ? (
                      <span className="text-gray-800 dark:text-gray-100">
                        {v.inspectionId}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-3">{v.status}</td>

                  <td className="p-3 text-right space-x-3">
                    {v.status === "Scheduled" && (
                      <>
                        <button
                          className="text-emerald-700 hover:underline"
                          onClick={() => setVisitStatus(v, "Completed")}
                        >
                          Mark Completed
                        </button>

                        <button
                          className="text-amber-700 hover:underline"
                          onClick={() => setVisitStatus(v, "Skipped")}
                        >
                          Skip
                        </button>
                      </>
                    )}

                    {v.status !== "Cancelled" && (
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => setVisitStatus(v, "Cancelled")}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="p-6 text-center text-gray-500 dark:text-gray-300"
                >
                  No visits found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-500">
        Tip: Check <b>Projects → Inspections</b> to see the automatically
        created inspection records.
      </div>
    </div>
  );
}
