import {
  addMonths,
  getMaintenanceContracts,
  getMaintenanceVisits,
  normalizeDateKey,
  saveMaintenanceContracts,
  saveMaintenanceVisits,
  todayKey,
  nextSeq,
  lsGet,
  lsSet,
} from "./maintenanceStore";

const INVOICES_KEY = "invoices";
const INSPECTIONS_KEY = "inspections";

const nextInvoiceNo = (invoices) => {
  const prefix = "INV";
  const max = (invoices || []).reduce((m, x) => {
    const n = Number(String(x.invoiceNo || "").replace(prefix + "-", "")) || 0;
    return Math.max(m, n);
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
};

const findInspectionByVisit = (inspections, visit) => {
  if (!visit) return null;
  if (visit.inspectionId) {
    const byId = inspections.find((i) => Number(i.id) === Number(visit.inspectionId));
    if (byId) return byId;
  }
  return inspections.find((i) => String(i.maintenanceVisitId) === String(visit.id)) || null;
};

const createInspectionForVisit = ({ inspections, visit, contract }) => {
  const id = Date.now() + Math.floor(Math.random() * 1000);

  const addr = contract?.propertyAddress?.line1 || visit?.propertyAddress?.line1 || "";
  const plan = contract?.planName || visit?.planName || "Maintenance";

  const rec = {
    id,
    projectId: contract?.projectId ?? visit?.projectId ?? null,
    projectName:
      contract?.projectName ||
      visit?.projectName ||
      `(Maintenance) ${contract?.customerName || visit?.customerName || ""}`.trim(),
    client: contract?.customerName || visit?.customerName || "",
    date: visit.scheduledDate,
    inspector: "",
    status: "Scheduled",
    notes: `Maintenance Visit ${visit.visitNo || ""} • ${plan}${addr ? ` • ${addr}` : ""}`.trim(),
    createdAt: new Date().toISOString(),

    // link-back (safe extra fields)
    maintenanceContractId: contract?.id ?? visit?.contractId ?? null,
    maintenanceVisitId: visit.id,
    maintenanceVisitNo: visit.visitNo || "",
  };

  inspections.push(rec);
  visit.inspectionId = id;
  return id;
};

export function runMaintenanceScheduler({ nowKey } = {}) {
  const now = normalizeDateKey(nowKey || todayKey());

  const contracts = getMaintenanceContracts();
  const visits = getMaintenanceVisits();
  const invoices = lsGet(INVOICES_KEY, []);
  const inspections = lsGet(INSPECTIONS_KEY, []);

  let contractsChanged = false;
  let visitsChanged = false;
  let invoicesChanged = false;
  let inspectionsChanged = false;

  const hasVisit = (contractId, scheduledDate) =>
    visits.some(
      (v) =>
        String(v.contractId) === String(contractId) &&
        String(v.scheduledDate) === String(scheduledDate)
    );

  // 1) Generate missing visits (and inspections)
  for (const c of contracts) {
    const status = String(c.status || "Active");

    // auto-expire if endDate passed
    if (c.endDate && String(c.endDate) < now && status === "Active") {
      c.status = "Expired";
      contractsChanged = true;
    }

    if (String(c.status) !== "Active") continue;

    const freq = Number(c.frequencyMonths || 12) || 12;

    let nextRun = normalizeDateKey(c.nextRunDate || c.startDate || now);

    while (nextRun <= now) {
      if (c.endDate && String(nextRun) > String(c.endDate)) break;

      if (!hasVisit(c.id, nextRun)) {
        const visitId = Date.now() + Math.floor(Math.random() * 1000);

        const newVisit = {
          id: visitId,
          visitNo: nextSeq("MV", visits, "visitNo"),
          contractId: c.id,
          scheduledDate: nextRun,
          status: "Scheduled",

          // snapshot
          customerName: c.customerName || "",
          customerEmail: c.customerEmail || "",
          planName: c.planName || "Maintenance",
          propertyAddress: c.propertyAddress || {},

          projectId: c.projectId ?? null,
          projectName: c.projectName || "",

          invoiceId: null,
          invoiceNo: null,

          inspectionId: null,

          createdAt: new Date().toISOString(),
          completedAt: null,
          notes: "",
        };

        // Optional auto-invoice
        if (c.autoInvoice && Number(c.price || 0) > 0) {
          const invoiceId = Date.now() + Math.floor(Math.random() * 1000);
          const invoiceNo = nextInvoiceNo(invoices);

          const inv = {
            id: invoiceId,
            invoiceNo,
            projectId: c.projectId ?? null,
            projectName: c.projectName || "",
            customer: c.customerName || "",
            issueDate: nextRun,
            dueDate: nextRun,
            taxRate: 0,
            items: [
              {
                description: `${c.planName || "Maintenance"} (Visit)`,
                qty: 1,
                unitPrice: Number(c.price || 0),
              },
            ],
            amountPaid: 0,
            status: "Unpaid",
          };

          invoices.push(inv);
          invoicesChanged = true;

          newVisit.invoiceId = invoiceId;
          newVisit.invoiceNo = invoiceNo;
        }

        // ✅ Create matching Inspection record (Scheduled)
        createInspectionForVisit({ inspections, visit: newVisit, contract: c });
        inspectionsChanged = true;

        visits.push(newVisit);
        visitsChanged = true;
      }

      nextRun = addMonths(nextRun, freq);
    }

    if (String(c.nextRunDate || "") !== String(nextRun)) {
      c.nextRunDate = nextRun;
      c.updatedAt = new Date().toISOString();
      contractsChanged = true;
    }
  }

  // 2) Backfill inspections for older visits (created before this Step 2)
  for (const v of visits) {
    const status = String(v.status || "Scheduled");
    if (status === "Cancelled") continue;

    const existing = findInspectionByVisit(inspections, v);
    if (existing) {
      // ensure visit has inspectionId for reliable linking
      if (!v.inspectionId) {
        v.inspectionId = existing.id;
        visitsChanged = true;
      }
      continue;
    }

    const c = contracts.find((x) => String(x.id) === String(v.contractId)) || null;
    createInspectionForVisit({ inspections, visit: v, contract: c });
    inspectionsChanged = true;
    visitsChanged = true;
  }

  if (contractsChanged) saveMaintenanceContracts(contracts);
  if (visitsChanged) saveMaintenanceVisits(visits);
  if (invoicesChanged) lsSet(INVOICES_KEY, invoices);
  if (inspectionsChanged) lsSet(INSPECTIONS_KEY, inspections);

  return {
    now,
    contractsChanged,
    visitsChanged,
    invoicesChanged,
    inspectionsChanged,
  };
}