import { addMonths, normalizeDateKey, todayKey } from "./maintenanceStore";

export async function runMaintenanceScheduler({
  contracts = [],
  visits = [],
  addVisit,
  addContractInspection,
  updateContract,
  updateVisit, // ✅ added
  nowKey,
} = {}) {
  if (!addVisit || !addContractInspection || !updateContract || !updateVisit) {
    console.warn("⚠️ Scheduler missing API functions, skipping generation");
    return { ok: false, message: "Missing required API functions" };
  }

  const now = normalizeDateKey(nowKey || todayKey());
  const results = {
    visitsCreated: [],
    inspectionsCreated: [],
    contractsUpdated: [],
    contractsExpired: [],
    errors: [],
  };

  const hasVisit = (contractId, scheduledDate) =>
    visits.some(
      (v) =>
        String(v.contractId) === String(contractId) &&
        String(v.scheduledDate) === String(scheduledDate),
    );

  // 1) Auto-expire contracts whose endDate has passed
  for (const c of contracts) {
    if (c.endDate && String(c.endDate) < now && String(c.status) === "Active") {
      try {
        const result = await updateContract(c.contractId, {
          status: "Expired",
        });
        if (result.ok) {
          c.status = "Expired";
          results.contractsExpired.push(c.contractId);
        } else {
          results.errors.push(
            `Failed to expire contract ${c.contractNo || c.contractId}`,
          );
        }
      } catch (err) {
        results.errors.push(`Error expiring contract: ${err.message}`);
      }
    }
  }

  // 2) Generate missing visits and linked inspections
  for (const c of contracts) {
    if (String(c.status) !== "Active") continue;

    const freq = Number(c.frequencyMonths || 12) || 12;
    let nextRun = normalizeDateKey(c.nextRunDate || c.startDate || now);
    let nextRunChanged = false;

    while (nextRun <= now) {
      if (c.endDate && String(nextRun) > String(c.endDate)) break;

      if (!hasVisit(c.contractId, nextRun)) {
        const visitData = {
          scheduledDate: nextRun,
          status: "Scheduled",
          customerName: c.customerName || "",
          customerEmail: c.customerEmail || "",
          planName: c.planName || "Maintenance",
          propertyAddress: c.propertyAddress || {},
          projectId: c.projectId || null,
          projectName: c.projectName || "",
          contractNo: c.contractNo || "",
          invoiceId: null,
          invoiceNo: null,
          inspectionId: null,
          notes: "",
        };

        try {
          const visitResult = await addVisit(c.contractId, visitData);

          if (visitResult.ok && visitResult.data) {
            const newVisit = visitResult.data;
            results.visitsCreated.push(newVisit);

            const addr = c.propertyAddress?.line1 || "";
            const plan = c.planName || "Maintenance";

            const inspectionData = {
              visitId: newVisit.visitId,
              visitNo: newVisit.visitNo || "",
              projectId: c.projectId || null,
              projectName: c.projectName || "",
              client: c.customerName || "",
              date: nextRun,
              inspector: "",
              status: "Scheduled",
              notes:
                `Maintenance Visit ${newVisit.visitNo || ""} • ${plan}${addr ? ` • ${addr}` : ""}`.trim(),
            };

            try {
              const inspectionResult = await addContractInspection(
                c.contractId,
                inspectionData,
              );

              if (inspectionResult.ok && inspectionResult.data) {
                results.inspectionsCreated.push(inspectionResult.data);

                // ✅ update visit with inspectionId on backend
                const rawVisitId = newVisit.visitId.replace("VISIT#", "");
                await updateVisit(c.contractId, rawVisitId, {
                  inspectionId: inspectionResult.data.inspectionId,
                });

                // ✅ update local visit object so backfill skips it
                newVisit.inspectionId = inspectionResult.data.inspectionId;
              } else {
                results.errors.push(
                  `Failed to create inspection for visit ${newVisit.visitNo}`,
                );
              }
            } catch (err) {
              results.errors.push(`Error creating inspection: ${err.message}`);
            }

            // ✅ push after inspectionId is set
            visits.push(newVisit);
          } else {
            results.errors.push(
              `Failed to create visit for contract ${c.contractNo || c.contractId}`,
            );
          }
        } catch (err) {
          results.errors.push(`Error creating visit: ${err.message}`);
        }
      }

      nextRun = addMonths(nextRun, freq);
      nextRunChanged = true;
    }

    // Update contract's nextRunDate if it changed
    if (nextRunChanged && String(c.nextRunDate || "") !== String(nextRun)) {
      try {
        const updateResult = await updateContract(c.contractId, {
          nextRunDate: nextRun,
        });
        if (updateResult.ok) {
          c.nextRunDate = nextRun;
          results.contractsUpdated.push(c.contractId);
        } else {
          results.errors.push(
            `Failed to update nextRunDate for contract ${c.contractNo}`,
          );
        }
      } catch (err) {
        results.errors.push(
          `Error updating contract nextRunDate: ${err.message}`,
        );
      }
    }
  }

  // 3) Backfill — create inspections for older visits that have none
  for (const v of visits) {
    if (String(v.status) === "Cancelled") continue;
    if (v.inspectionId) continue; // ✅ skip if already has one

    const c =
      contracts.find((x) => String(x.contractId) === String(v.contractId)) ||
      null;
    const addr = c?.propertyAddress?.line1 || v.propertyAddress?.line1 || "";
    const plan = c?.planName || v.planName || "Maintenance";
    const contractId = c?.contractId || v.contractId;

    if (!contractId) continue;

    const inspectionData = {
      visitId: v.visitId,
      visitNo: v.visitNo || "",
      projectId: c?.projectId || v.projectId || null,
      projectName: c?.projectName || v.projectName || "",
      client: c?.customerName || v.customerName || "",
      date: v.scheduledDate,
      inspector: "",
      status: "Scheduled",
      notes:
        `Maintenance Visit ${v.visitNo || ""} • ${plan}${addr ? ` • ${addr}` : ""}`.trim(),
    };

    try {
      const result = await addContractInspection(contractId, inspectionData);
      if (result.ok && result.data) {
        results.inspectionsCreated.push(result.data);

        // ✅ update visit with inspectionId on backend
        const rawVisitId = v.visitId.replace("VISIT#", "");
        await updateVisit(contractId, rawVisitId, {
          inspectionId: result.data.inspectionId,
        });

        // ✅ update local visit so it won't be processed again
        v.inspectionId = result.data.inspectionId;
      } else {
        results.errors.push(
          `Failed to backfill inspection for visit ${v.visitNo}`,
        );
      }
    } catch (err) {
      results.errors.push(`Error backfilling inspection: ${err.message}`);
    }
  }

  return {
    ok: true,
    ...results,
  };
}