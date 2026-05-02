import React, { useEffect } from "react";
import { runMaintenanceScheduler } from "../../utils/maintenanceScheduler";

export default function MaintenanceScheduler() {
  useEffect(() => {
    // run once per app load (safe + idempotent)
    runMaintenanceScheduler();
  }, []);

  return null;
}