import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "../context/CompanyContext";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { ROLE } from "../config/accessControl";
import { useProjects } from "../context/ProjectsContext";
import { useLeads } from "../context/LeadContext";
import { useEstimates } from "../context/EstimatesContext";
import { useInvoices } from "../context/InvoicesContext";
import { usePayments } from "../context/PaymentsContext";
import { useExpenses } from "../context/ExpensesContext";
import { useDocuments } from "../context/DocumentsContext";
import { useMaterials } from "../context/MaterialsContext";
import { usePurchaseOrders } from "../context/PurchaseOrdersContext";
import { useSuppliers } from "../context/SuppliersContext";
import { useTasks } from "../context/TasksContext";
import { useEmployees } from "../context/EmployeesContext";


const monthKey = (d) => {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (key) => {
  const [y, m] = key.split("-");
  const dt = new Date(Number(y), Number(m) - 1, 1);
  return dt.toLocaleString("en-US", { month: "short" });
};

const calcInvoiceTotal = (inv) => {
  const subtotal = (inv.items || []).reduce(
    (s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0),
    0
  );
  return subtotal + subtotal * Number(inv.taxRate || 0);
};

// UI helpers
const GradientCard = ({ title, value, className, sub }) => (
  <div className={`p-6 rounded-2xl text-white shadow-lg ${className}`}>
    <p className="text-sm opacity-80">{title}</p>
    <p className="text-2xl font-bold mt-2">{value}</p>
    {sub ? <p className="text-xs opacity-90 mt-1">{sub}</p> : null}
  </div>
);

const SoftCard = ({ title, value, sub }) => (
  <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur shadow-lg border border-gray-100 dark:border-gray-800">
    <p className="text-sm text-gray-500 dark:text-gray-300">{title}</p>
    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
      {value}
    </p>
    {sub ? (
      <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">{sub}</p>
    ) : null}
  </div>
);

const normalize = (v) => String(v || "").trim().toLowerCase();

const fmtTime = (iso) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso || "");
  }
};

const safeIso = (d) => {
  if (!d) return null;
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  return x.toISOString();
};

const badgeClassByModule = (m) => {
  switch (m) {
    case "CRM":
      return "bg-blue-100 text-blue-700";
    case "Operations":
      return "bg-purple-100 text-purple-700";
    case "Documents":
      return "bg-emerald-100 text-emerald-700";
    case "Finance":
      return "bg-red-100 text-red-700";
    case "Inventory":
      return "bg-amber-100 text-amber-700";
    case "Projects":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const money = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: `${company?.currency || "USD"}`,
      maximumFractionDigits: 0,
    }).format(Number(n || 0));
  
  
  // Context hooks for real APIs - extract both data and fetch methods
  const { dashboardProjects: projects = [], getDashboardProjects: fetchProjects } = useProjects();
  const { leads = [], getAll: fetchLeads } = useLeads();
  const { estimates = [], getAllEstimates } = useEstimates();
  const { invoices = [], getAllInvoices } = useInvoices();
  const { payments = [], fetchPayments } = usePayments();
  const { expenses = [], fetchExpenses } = useExpenses();
  const { documents = [], fetchDocuments } = useDocuments();
  const { materials: inventoryMaterials = [], fetchMaterials } = useMaterials();
  const { orders: purchaseOrders = [], fetchOrders: fetchPurchaseOrders } = usePurchaseOrders();
  const { suppliers = [], fetchSuppliers } = useSuppliers();
  const { tasks = [], fetchTasks } = useTasks();
  const { employees = [], getAllEmployees } = useEmployees();
  
  const roleName = user?.roleName;

  const safeRole = useMemo(() => {
    const all = Object.values(ROLE);
    if (all.includes(roleName)) return roleName;
    return ROLE.WORKER;
  }, [roleName]);

  const isAdmin = safeRole === ROLE.ADMIN;
  const isSales = safeRole === ROLE.SALES;
  const isPM = safeRole === ROLE.PM;
  const isAccountant = safeRole === ROLE.ACCOUNTANT;
  const isWorker = safeRole === ROLE.WORKER;

  const [activityOpen, setActivityOpen] = useState(false);
  const [activityQuery, setActivityQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { company, getCompany } = useCompany();

  useEffect(() => {
    getCompany();
  }, [getCompany]);


  // Retry helper for intermittent failures
  const retryFetch = async (fetchFn, name, maxRetries = 2) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fetchFn?.();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error; // Final attempt failed
        }
        // Exponential backoff: 300ms, 600ms, etc.
        const delay = 300 * attempt;
        console.warn(
          `[${name}] Attempt ${attempt} failed, retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  // Fetch all data from APIs on mount and on window focus
  const loadAll = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        retryFetch(fetchProjects, "Projects"),
        retryFetch(fetchLeads, "Leads"),
        retryFetch(getAllEstimates, "Estimates"),
        retryFetch(getAllInvoices, "Invoices"),
        retryFetch(fetchPayments, "Payments"),
        retryFetch(fetchExpenses, "Expenses"),
        retryFetch(fetchDocuments, "Documents"),
        retryFetch(fetchMaterials, "Materials"),
        retryFetch(fetchPurchaseOrders, "PurchaseOrders"),
        retryFetch(fetchSuppliers, "Suppliers"),
        retryFetch(fetchTasks, "Tasks"),
        retryFetch(getAllEmployees, "Employees"),
      ]);

      // Log failed requests for debugging
      const endpoints = [
        "Projects",
        "Leads",
        "Estimates",
        "Invoices",
        "Payments",
        "Expenses",
        "Documents",
        "Materials",
        "PurchaseOrders",
        "Suppliers",
        "Tasks",
        "Employees",
      ];

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.warn(`Failed to fetch ${endpoints[index]}:`, result.reason);
        }
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const onFocus = () => loadAll();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const COLORS = ["#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6", "#14b8a6"];

  const computed = useMemo(() => {
    // Use context data directly

    // ----- Projects core -----
    let contractValue = 0;
    let internalMaterialCost = 0;
    let internalWorkerCost = 0;

    let activeProjects = 0;
    let completedProjects = 0;

    projects.forEach((project) => {
      contractValue += Number(project.budget || 0);

      if (project.status === "Completed") completedProjects++;
      else activeProjects++;

      (project.materials || []).forEach((m) => {
        internalMaterialCost += Number(m.total || 0);
      });

      (project.workers || []).forEach((w) => {
        internalWorkerCost += Number(w.total ?? w.salary ?? 0);
      });
    });

    // ----- Expenses -----
    const expensesTotal = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalCost = internalMaterialCost + internalWorkerCost + expensesTotal;
    const expectedProfit = contractValue - totalCost;

    // ----- Invoices / Receivables -----
    const totalInvoiced = invoices.reduce((s, inv) => s + calcInvoiceTotal(inv), 0);
    const totalPaidOnInvoices = invoices.reduce(
      (s, inv) => s + Number(inv.amountPaid || 0),
      0
    );
    const outstanding = Math.max(0, totalInvoiced - totalPaidOnInvoices);

    // ----- Payments -----
    const cashReceived = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const cashProfit = cashReceived - totalCost;

    // ----- Pipeline -----
    const pipelineValue = leads.reduce((s, l) => s + Number(l.estimatedValue || 0), 0);
    const stageProb = {
      New: 0.1,
      "Inspection Scheduled": 0.3,
      "Estimate Sent": 0.5,
      Negotiation: 0.7,
      Won: 1,
      Lost: 0,
    };
    const weightedForecast = leads.reduce((s, l) => {
      const p = stageProb[l.status] ?? 0;
      return s + Number(l.estimatedValue || 0) * p;
    }, 0);

    const leadCount = leads.length;
    const estimateCount = (estimates || []).length;
    const acceptedEstimatesCount = (estimates || []).filter((e) => e.status === "Accepted").length;

    // ----- Documents -----
    const docsCount = documents.length;

    // ----- Inventory KPIs -----
    const lowStockCount = (inventoryMaterials || []).filter((m) => {
      const onHand = Number(m.onHand || 0);
      const reorder = Number(m.reorderLevel || 0);
      return reorder > 0 && onHand <= reorder;
    }).length;

    const openPOCount = (purchaseOrders || []).filter((po) =>
      ["Draft", "Sent"].includes(po.status)
    ).length;

    const suppliersCount = (suppliers || []).length;

    // ----- TASKS (operations + project.tasks fallback) -----
    const tasksFromOperations = Array.isArray(tasks) ? tasks : [];

    const tasksFromProjects = (projects || []).flatMap((p) =>
      (p.tasks || []).map((t) => ({
        id: `${p.projectId}-${t.taskId}`,
        title: t.title ?? t.name ?? "Task",
        status: t.status || "Pending",
        employeeId: t.employeeId,
        worker: t.worker,
        assigned: t.assigned,
        projectId: p.projectId,
      }))
    );

    const allTasks = [...tasksFromOperations, ...tasksFromProjects];

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === "Completed").length;

    // ✅ Worker "My Tasks"
    const myEmail = normalize(user?.email);
    const myName = normalize(user?.name);

    const myEmployee =
      (employees || []).find((e) => normalize(e.email) && normalize(e.email) === myEmail) ||
      (employees || []).find((e) => normalize(e.name) === myName);

    const myEmployeeId = myEmployee?.employeeId;

    const myTasks = allTasks.filter((t) => {
      const taskEmpId = t.employeeId ?? t.assignedEmployeeId ?? t.assignedToId;
      const taskWorkerName = normalize(t.worker || t.assigned || t.assignedTo || t.employeeName);

      if (myEmployeeId != null && taskEmpId != null && String(taskEmpId) === String(myEmployeeId)) return true;
      if (myName && taskWorkerName && taskWorkerName === myName) return true;

      return false;
    });

    const myCompletedTasks = myTasks.filter((t) => t.status === "Completed").length;
    const myPendingTasks = Math.max(0, myTasks.length - myCompletedTasks);

    // ✅ Worker "My Jobs" (derived)
    const myProjectIdSet = new Set();

    myTasks.forEach((t) => {
      if (t.projectId != null && String(t.projectId).trim()) {
        myProjectIdSet.add(String(t.projectId));
      }
    });

    // also match by project.workers array name if exists
    projects.forEach((p) => {
      const hasMeInWorkers = (p.workers || []).some(
        (w) => normalize(w.name) && normalize(w.name) === myName
      );
      if (hasMeInWorkers) myProjectIdSet.add(String(p.projectId));
    });

    const myProjects = projects.filter((p) => myProjectIdSet.has(String(p.projectId)));
    const myActiveJobs = myProjects.filter((p) => p.status !== "Completed").length;

    // ----- Charts data -----
    const financeData = [
      { name: "Contract", value: contractValue },
      { name: "Cash", value: cashReceived },
      { name: "Cost", value: totalCost },
      { name: "Profit", value: expectedProfit },
    ];

    const projectStatusData = [
      { name: "Active", value: activeProjects },
      { name: "Completed", value: completedProjects },
    ];

    const taskStatusData = [
      { name: "Completed", value: completedTasks },
      { name: "Pending", value: Math.max(0, totalTasks - completedTasks) },
    ];

    const myTaskStatusData = [
      { name: "Completed", value: myCompletedTasks },
      { name: "Pending", value: myPendingTasks },
    ];

    // Monthly cashflow for current year
    const year = new Date().getFullYear();
    const paymentsByMonth = {};
    const expensesByMonth = {};

    payments.forEach((p) => {
      const k = monthKey(p.date);
      if (!k || Number(k.split("-")[0]) !== year) return;
      paymentsByMonth[k] = (paymentsByMonth[k] || 0) + Number(p.amount || 0);
    });

    expenses.forEach((e) => {
      const k = monthKey(e.date);
      if (!k || Number(k.split("-")[0]) !== year) return;
      expensesByMonth[k] = (expensesByMonth[k] || 0) + Number(e.amount || 0);
    });

    const cashflowData = Array.from({ length: 12 }).map((_, i) => {
      const k = `${year}-${String(i + 1).padStart(2, "0")}`;
      const cash = paymentsByMonth[k] || 0;
      const expense = expensesByMonth[k] || 0;
      return { month: monthLabel(k), cash, expense, net: cash - expense };
    });

    // Lead stages distribution
    const stageCounts = leads.reduce((acc, l) => {
      const s = l.status || "New";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    const leadStageData = Object.entries(stageCounts).map(([name, value]) => ({
      name,
      value,
    }));

    // =========================
    // Activity Feed (derived)
    // =========================
    const activities = [];

    const push = (item) => {
      const iso = safeIso(item.at);
      if (!iso) return;
      activities.push({
        id:
          item.id ||
          `${item.module}-${item.action}-${iso}-${Math.random().toString(16).slice(2)}`,
        at: iso,
        module: item.module,
        action: item.action,
        title: item.title,
        route: item.route || "",
      });
    };

    leads.forEach((l) => {
      push({
        id: `lead-${l.leadId}`,
        at: l.updatedAt || l.createdAt,
        module: "CRM",
        action: "Lead Updated",
        title: `${l.name || "Lead"} • ${l.status || "New"}`,
        route: "/leads",
      });
      if (l.createdAt) {
        push({
          id: `lead-created-${l.leadId}`,
          at: l.createdAt,
          module: "CRM",
          action: "Lead Created",
          title: `${l.name || "Lead"}`,
          route: "/leads",
        });
      }
    });

    invoices.forEach((inv) => {
      push({
        id: `inv-${inv.invoiceId}`,
        at: inv.issueDate || inv.createdAt,
        module: "Finance",
        action: "Invoice Issued",
        title: `${inv.invoiceNo || inv.invoiceId} • ${inv.customer || inv.projectName || "Invoice"}`,
        route: "/finance/invoices",
      });
    });

    payments.forEach((p) => {
      push({
        id: `pay-${p.paymentId}`,
        at: p.date,
        module: "Finance",
        action: "Payment Recorded",
        title: `${p.paymentNo || p.paymentId} • ${money(p.amount)} • ${p.customer || p.projectName || ""}`,
        route: "/finance/payments",
      });
    });

    expenses.forEach((e) => {
      push({
        id: `exp-${e.expenseId}`,
        at: e.date,
        module: "Finance",
        action: "Expense Added",
        title: `${e.expenseNo || e.expenseId} • ${money(e.amount)} • ${e.category || ""}`,
        route: "/finance/expenses",
      });
    });

    const docs = documents || [];
    docs.forEach((d) => {
      push({
        id: `doc-${d.documentId}`,
        at: d.uploadedAt,
        module: "Documents",
        action: `${(d.type || "document").toUpperCase()} Uploaded`,
        title: `${d.fileName || "Document"} • ${d.projectName || ""}`,
        route:
          d.type === "contract"
            ? "/documents/contracts"
            : d.type === "photo"
              ? "/documents/photos"
              : "/documents/attachments",
      });

      if (d.type === "contract" && d.signedAt) {
        push({
          id: `doc-signed-${d.documentId}`,
          at: d.signedAt,
          module: "Documents",
          action: "Contract Signed",
          title: `${d.fileName || "Contract"} • ${d.projectName || ""}`,
          route: "/documents/contracts",
        });
      }
    });

    tasksFromOperations.forEach((t) => {
      const createdAt = safeIso(new Date(Number(t.taskId))) || null;
      push({
        id: `task-${t.taskId}`,
        at: createdAt,
        module: "Operations",
        action: "Task Created",
        title: `${t.title || "Task"} • ${t.status || "Pending"} • ${t.worker || ""}`,
        route: "/operations/tasks",
      });
    });

    purchaseOrders.forEach((po) => {
      push({
        id: `po-${po.orderId}`,
        at: po.issueDate || po.createdAt || po.updatedAt,
        module: "Inventory",
        action: "Purchase Order Updated",
        title: `${po.poNo || po.orderId} • ${po.status || ""}`,
        route: "/inventory/purchase-orders",
      });
    });

    // Role-based activity visibility
    let roleActivities = activities;

    if (isWorker) {
      // Worker: only operations activity (my tasks only)
      const myTaskIds = new Set(myTasks.map((t) => String(t.taskId)));
      roleActivities = activities.filter((a) => {
        if (a.module !== "Operations") return false;
        const idPart = String(a.taskId).replace("task-", "");
        return myTaskIds.has(idPart);
      });
    } else if (isSales) {
      roleActivities = activities.filter((a) => a.module === "CRM");
    } else if (isAccountant) {
      roleActivities = activities.filter((a) => a.module === "Finance");
    } else if (isPM) {
      roleActivities = activities.filter(
        (a) =>
          a.module === "Operations" ||
          a.module === "Documents" ||
          a.module === "Inventory"
      );
    }

    roleActivities.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

    const activityTotal = roleActivities.length;
    const recentActivity = roleActivities.slice(0, 6);

    return {
      kpis: {
        contractValue,
        cashReceived,
        outstanding,
        totalCost,
        expectedProfit,
        cashProfit,
        activeProjects,
        completedProjects,
        pipelineValue,
        weightedForecast,
        docsCount,
        lowStockCount,
        openPOCount,
        suppliersCount,
        leadCount,
        estimateCount,
        acceptedEstimatesCount,
        totalTasks,
        completedTasks,

        // worker-specific
        myTasksCount: myTasks.length,
        myCompletedTasks,
        myPendingTasks,
        myProjectsCount: myProjects.length,
        myActiveJobs,
        myEmployeeMatched: Boolean(myEmployeeId || myEmployee),

        activityTotal,
      },
      financeData,
      projectStatusData,
      taskStatusData,
      myTaskStatusData,
      cashflowData,
      leadStageData,
      activity: {
        items: roleActivities,
        recent: recentActivity,
      },
    };
  }, [projects, leads, estimates, invoices, payments, expenses, documents, inventoryMaterials, purchaseOrders, suppliers, tasks, employees, user?.email, user?.name, isWorker, isSales, isPM, isAccountant]);

  // ✅ Role-based widget visibility (industry)
  const showFinance = isAdmin || isAccountant;        // finance KPIs & charts
  const showPipeline = isAdmin || isSales;            // pipeline KPIs & lead stages chart
  const showInventory = isAdmin || isPM || isAccountant; // inventory KPIs cards
  const showProjectStatusChart = isAdmin || isPM;     // not for Sales/Worker
  const showTaskChart = isAdmin || isPM || isWorker;  // worker shows my tasks only

  // Secondary cards
  const showSecondaryActiveProjects = isAdmin || isPM || isSales || isAccountant;
  const showDocsCard = !isWorker; // worker dashboard should be my tasks/my jobs only

  const primaryCards = useMemo(() => {
    if (isAdmin) {
      return [
        { title: "Contract Value", value: money(computed.kpis.contractValue), className: "bg-gradient-to-r from-emerald-600 to-green-500" },
        { title: "Cash Received", value: money(computed.kpis.cashReceived), className: "bg-gradient-to-r from-blue-600 to-indigo-600" },
        { title: "Total Cost", value: money(computed.kpis.totalCost), className: "bg-gradient-to-r from-red-500 to-pink-600" },
        { title: "Expected Profit", value: money(computed.kpis.expectedProfit), className: "bg-gradient-to-r from-purple-600 to-violet-600" },
      ];
    }

    if (isSales) {
      return [
        {
          title: "Pipeline Value",
          value: money(computed.kpis.pipelineValue),
          className: "bg-gradient-to-r from-blue-600 to-indigo-600",
          sub: `Forecast: ${money(computed.kpis.weightedForecast)}`,
        },
        { title: "Leads", value: String(computed.kpis.leadCount), className: "bg-gradient-to-r from-emerald-600 to-green-500" },
        {
          title: "Estimates",
          value: String(computed.kpis.estimateCount),
          className: "bg-gradient-to-r from-purple-600 to-violet-600",
          sub: `Accepted: ${computed.kpis.acceptedEstimatesCount}`,
        },
        { title: "Active Projects", value: String(computed.kpis.activeProjects), className: "bg-gradient-to-r from-slate-700 to-gray-700" },
      ];
    }

    if (isPM) {
      return [
        { title: "Active Projects", value: String(computed.kpis.activeProjects), className: "bg-gradient-to-r from-blue-600 to-indigo-600" },
        { title: "Completed Projects", value: String(computed.kpis.completedProjects), className: "bg-gradient-to-r from-emerald-600 to-green-500" },
        { title: "Total Tasks", value: String(computed.kpis.totalTasks), className: "bg-gradient-to-r from-purple-600 to-violet-600", sub: `Completed: ${computed.kpis.completedTasks}` },
        { title: "Low Stock Items", value: String(computed.kpis.lowStockCount), className: "bg-gradient-to-r from-red-500 to-pink-600" },
      ];
    }

    if (isAccountant) {
      return [
        { title: "Outstanding (AR)", value: money(computed.kpis.outstanding), className: "bg-gradient-to-r from-red-500 to-pink-600" },
        { title: "Cash Received", value: money(computed.kpis.cashReceived), className: "bg-gradient-to-r from-blue-600 to-indigo-600" },
        { title: "Total Cost", value: money(computed.kpis.totalCost), className: "bg-gradient-to-r from-slate-700 to-gray-700" },
        { title: "Expected Profit", value: money(computed.kpis.expectedProfit), className: "bg-gradient-to-r from-emerald-600 to-green-500" },
      ];
    }

    // Worker (my tasks + my jobs only)
    return [
      { title: "My Pending Tasks", value: String(computed.kpis.myPendingTasks), className: "bg-gradient-to-r from-red-500 to-pink-600" },
      { title: "My Completed Tasks", value: String(computed.kpis.myCompletedTasks), className: "bg-gradient-to-r from-emerald-600 to-green-500" },
      { title: "My Tasks (Total)", value: String(computed.kpis.myTasksCount), className: "bg-gradient-to-r from-blue-600 to-indigo-600" },
      { title: "My Active Jobs", value: String(computed.kpis.myActiveJobs), className: "bg-gradient-to-r from-slate-700 to-gray-700" },
    ];
  }, [isAdmin, isSales, isPM, isAccountant, computed.kpis]);

  const activityFiltered = useMemo(() => {
    const q = activityQuery.trim().toLowerCase();
    const items = computed.activity.items || [];
    if (!q) return items;
    return items.filter((a) => {
      const hay = `${a.module} ${a.action} ${a.title}`.toLowerCase();
      return hay.includes(q);
    });
  }, [computed.activity.items, activityQuery]);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 text-sm">
            Overview tailored to your role:{" "}
            <span className="font-semibold">{safeRole}</span>
            {isWorker && (
              <span className="ml-2 text-xs">
                (Employee matched:{" "}
                {computed.kpis.myEmployeeMatched ? "Yes" : "No"})
              </span>
            )}
          </p>
        </div>

        {/* <button
          onClick={loadAll}
          className="bg-gray-200 px-4 py-2 rounded-xl dark:bg-gray-700  hover:bg-gray-600 transition"
          title="Refresh dashboard"
        >
          Refresh
        </button> */}
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {primaryCards.map((c) => (
          <GradientCard
            key={c.title}
            title={c.title}
            value={c.value}
            className={c.className}
            sub={c.sub}
          />
        ))}
      </div>

      {/* Secondary KPIs */}
      {!isWorker && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {showFinance && (
            <SoftCard
              title="Outstanding (AR)"
              value={money(computed.kpis.outstanding)}
            />
          )}

          {showSecondaryActiveProjects && (
            <SoftCard
              title="Active Projects"
              value={String(computed.kpis.activeProjects)}
            />
          )}

          {showPipeline && (
            <SoftCard
              title="Pipeline Forecast"
              value={money(computed.kpis.weightedForecast)}
              sub={`Pipeline: ${money(computed.kpis.pipelineValue)}`}
            />
          )}

          {showDocsCard && (
            <SoftCard
              title="Documents"
              value={String(computed.kpis.docsCount)}
            />
          )}

          {showInventory && (
            <SoftCard
              title="Low Stock Items"
              value={String(computed.kpis.lowStockCount)}
            />
          )}

          {showInventory && (
            <SoftCard
              title="Open Purchase Orders"
              value={String(computed.kpis.openPOCount)}
            />
          )}
        </div>
      )}

      {/* Activity */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-700 dark:text-gray-200">
              Activity
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
              Recent actions derived from your data (will come from backend
              later).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-2 rounded-xl bg-gray-100 text-gray-800 text-sm">
              Total:{" "}
              <span className="font-semibold">
                {computed.kpis.activityTotal}
              </span>
            </div>

            {isAdmin && (
              <button
                onClick={() => setActivityOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              >
                View All
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {(computed.activity.recent || []).length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-300">
              No activity yet.
            </div>
          ) : (
            computed.activity.recent.map((a) => (
              <button
                key={a.id}
                className="w-full text-left flex items-start justify-between gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                onClick={() => {
                  if (a.route) navigate(a.route);
                }}
                type="button"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${badgeClassByModule(a.module)}`}
                    >
                      {a.module}
                    </span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {a.action}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-200 mt-1 truncate">
                    {a.title}
                  </div>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-300 whitespace-nowrap">
                  {fmtTime(a.at)}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {showFinance && (
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl p-6 shadow-lg">
            <h2 className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
              Financial Snapshot
            </h2>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={computed.financeData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v) => money(v)} />
                <Bar dataKey="value">
                  {computed.financeData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {showProjectStatusChart && (
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl p-6 shadow-lg">
            <h2 className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
              Project Status
            </h2>

            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={computed.projectStatusData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={105}
                >
                  {computed.projectStatusData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {showFinance && (
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl p-6 shadow-lg">
            <h2 className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
              Cashflow (This Year)
            </h2>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={computed.cashflowData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="month" />
                <Tooltip formatter={(v) => money(v)} />
                <Legend />
                <Bar
                  dataKey="cash"
                  name="Cash In"
                  fill="#22c55e"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="expense"
                  name="Expenses"
                  fill="#ef4444"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {showPipeline && (
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl p-6 shadow-lg">
            <h2 className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
              Lead Stages
            </h2>

            {computed.leadStageData.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-300">
                No leads in pipeline.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={computed.leadStageData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={105}
                  >
                    {computed.leadStageData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>

      {/* Tasks chart */}
      {showTaskChart && (
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl p-6 shadow-lg">
          <h2 className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
            Task Completion {isWorker ? "(My Tasks)" : ""}
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={
                isWorker ? computed.myTaskStatusData : computed.taskStatusData
              }
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="name" />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {isWorker && computed.kpis.myTasksCount === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-3">
              No tasks are assigned to you yet.
            </p>
          )}
        </div>
      )}

      {/* Admin-only Activity Modal */}
      {isAdmin && activityOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  All Activity
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                  Showing {activityFiltered.length} items
                </p>
              </div>

              <button
                onClick={() => setActivityOpen(false)}
                className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm"
                type="button"
              >
                Close
              </button>
            </div>

            <div className="p-4 space-y-4">
              <input
                value={activityQuery}
                onChange={(e) => setActivityQuery(e.target.value)}
                placeholder="Search activity..."
                className="w-full border rounded-xl px-4 py-3 bg-white dark:bg-gray-950 dark:text-white"
              />

              <div className="max-h-[55vh] overflow-auto divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl">
                {activityFiltered.length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">
                    No activity found.
                  </div>
                ) : (
                  activityFiltered.map((a) => (
                    <button
                      key={a.id}
                      className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                      onClick={() => {
                        if (a.route) {
                          setActivityOpen(false);
                          navigate(a.route);
                        }
                      }}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${badgeClassByModule(a.module)}`}
                            >
                              {a.module}
                            </span>
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                              {a.action}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-200 mt-1">
                            {a.title}
                          </div>
                        </div>

                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          {fmtTime(a.at)}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <p className="text-xs text-gray-500">
                Note: This feed is derived from local data for now. Backend
                audit logs will replace it later.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;