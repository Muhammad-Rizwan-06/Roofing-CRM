const CONTRACTS_KEY = "maintenance_contracts";
const VISITS_KEY = "maintenance_visits";

const safeParse = (raw, fallback) => {
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

export const lsGet = (key, fallback) =>
  safeParse(localStorage.getItem(key), fallback);

export const lsSet = (key, value) =>
  localStorage.setItem(key, JSON.stringify(value));

export const getMaintenanceContracts = () => lsGet(CONTRACTS_KEY, []);
export const saveMaintenanceContracts = (list) => lsSet(CONTRACTS_KEY, list);

export const getMaintenanceVisits = () => lsGet(VISITS_KEY, []);
export const saveMaintenanceVisits = (list) => lsSet(VISITS_KEY, list);

const pad2 = (n) => String(n).padStart(2, "0");

// dateKey format: YYYY-MM-DD
export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export const normalizeDateKey = (v) => {
  // Accept YYYY-MM-DD only; fallback to today
  const s = String(v || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return todayKey();
};

export const addMonths = (dateKey, months) => {
  const [y, m, d] = String(dateKey).split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setMonth(dt.getMonth() + Number(months || 0));
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
};

export const nextSeq = (prefix, list, field) => {
  const max = (list || []).reduce((m, x) => {
    const raw = String(x?.[field] || "");
    const n = Number(raw.replace(prefix + "-", "")) || 0;
    return Math.max(m, n);
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
};