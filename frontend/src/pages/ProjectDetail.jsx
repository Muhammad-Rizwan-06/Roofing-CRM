import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ROLE } from "../config/accessControl";

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();
  const roleName = user?.roleName;

  const isAdmin = roleName === ROLE.ADMIN;
  const isPM = roleName === ROLE.PM;
  const isWorker = roleName === ROLE.WORKER;
  const isAccountant = roleName === ROLE.ACCOUNTANT;

  // ✅ permissions per your recommended roles
  const canEditProject = isAdmin || isPM; // materials/workers/tasks modifications
  const canCreateInvoice = isAdmin || isAccountant;
  const canAddExpense = isAdmin || isAccountant;

  const canUploadContract = isAdmin || isPM;
  const canUploadPhotoAttachment = isAdmin || isPM || isWorker;

  const canViewContractLinks = isAdmin || isPM;
  const canViewPhotosAttachmentsLinks = isAdmin || isPM || isWorker;

  const [project, setProject] = useState(null);
  const [financeRefreshKey, setFinanceRefreshKey] = useState(0);

  const [materialForm, setMaterialForm] = useState({ name: "", quantity: "", price: "" });
  const [workerForm, setWorkerForm] = useState({ name: "", role: "", hours: "", rate: "" });
  const [taskForm, setTaskForm] = useState({ name: "", assigned: "", status: "Pending" });

  useEffect(() => {
    const projects = JSON.parse(localStorage.getItem("projects")) || [];
    const found = projects.find((p) => p.id === Number(id));
    setProject(found || null);
  }, [id]);

  const updateProject = (updatedProject) => {
    if (!canEditProject) {
      alert("Read-only: you do not have permission to update project details.");
      return;
    }

    const projects = JSON.parse(localStorage.getItem("projects")) || [];
    const newProjects = projects.map((p) => (p.id === updatedProject.id ? { ...p, ...updatedProject } : p));

    localStorage.setItem("projects", JSON.stringify(newProjects));
    setProject(updatedProject);
  };

  const addMaterial = () => {
    if (!canEditProject) return alert("Read-only: cannot add materials.");

    const projects = JSON.parse(localStorage.getItem("projects")) || [];
    const current = projects.find((p) => p.id === Number(id));
    if (!current) return;

    const total = Number(materialForm.quantity || 0) * Number(materialForm.price || 0);

    const newMaterial = { id: Date.now(), ...materialForm, total };

    const updatedProject = {
      ...current,
      materials: [...(current.materials || []), newMaterial],
    };

    updateProject(updatedProject);
    setMaterialForm({ name: "", quantity: "", price: "" });
  };

  const addWorker = () => {
    if (!canEditProject) return alert("Read-only: cannot add workers.");

    const projects = JSON.parse(localStorage.getItem("projects")) || [];
    const current = projects.find((p) => p.id === Number(id));
    if (!current) return;

    const total = Number(workerForm.hours || 0) * Number(workerForm.rate || 0);

    const newWorker = { id: Date.now(), ...workerForm, total };

    const updatedProject = {
      ...current,
      workers: [...(current.workers || []), newWorker],
    };

    updateProject(updatedProject);
    setWorkerForm({ name: "", role: "", hours: "", rate: "" });
  };

  const addTask = () => {
    if (!canEditProject) return alert("Read-only: cannot add tasks inside project.");

    const projects = JSON.parse(localStorage.getItem("projects")) || [];
    const current = projects.find((p) => p.id === Number(id));
    if (!current) return;

    const newTask = { id: Date.now(), ...taskForm };

    const updatedProject = {
      ...current,
      tasks: [...(current.tasks || []), newTask],
    };

    updateProject(updatedProject);
    setTaskForm({ name: "", assigned: "", status: "Pending" });
  };

  const materialCost = (project?.materials || []).reduce((sum, m) => sum + Number(m.total || 0), 0);
  const workerCost = (project?.workers || []).reduce((sum, w) => sum + Number(w.total || 0), 0);

  const docCounts = useMemo(() => {
    if (!project) return { contracts: 0, photos: 0, attachments: 0, total: 0 };

    const meta = JSON.parse(localStorage.getItem("documents_meta")) || [];
    const forProject = meta.filter((d) => Number(d.projectId) === Number(project.id));

    const contracts = forProject.filter((d) => d.type === "contract").length;
    const photos = forProject.filter((d) => d.type === "photo").length;
    const attachments = forProject.filter((d) => d.type === "attachment").length;

    return { contracts, photos, attachments, total: contracts + photos + attachments };
  }, [project, financeRefreshKey]);

  const finance = useMemo(() => {
    if (!project) {
      return {
        projectInvoices: [],
        projectExpenses: [],
        contractValue: 0,
        invoicedTotal: 0,
        paidTotal: 0,
        outstanding: 0,
        expensesTotal: 0,
        jobCost: 0,
        expectedProfit: 0,
        cashProfit: 0,
      };
    }

    const invoices = JSON.parse(localStorage.getItem("invoices")) || [];
    const expenses = JSON.parse(localStorage.getItem("expenses")) || [];

    const projectInvoices = invoices.filter((inv) => Number(inv.projectId) === Number(project.id));
    const projectExpenses = expenses.filter((ex) => Number(ex.projectId) === Number(project.id));

    const calcInvoiceTotal = (inv) => {
      const subtotal = (inv.items || []).reduce(
        (s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0),
        0
      );
      return subtotal + subtotal * Number(inv.taxRate || 0);
    };

    const invoicedTotal = projectInvoices.reduce((s, inv) => s + calcInvoiceTotal(inv), 0);
    const paidTotal = projectInvoices.reduce((s, inv) => s + Number(inv.amountPaid || 0), 0);
    const outstanding = Math.max(0, invoicedTotal - paidTotal);

    const expensesTotal = projectExpenses.reduce((s, ex) => s + Number(ex.amount || 0), 0);
    const jobCost = materialCost + workerCost + expensesTotal;

    const contractValue = Number(project.budget || 0);
    const expectedProfit = contractValue - jobCost;
    const cashProfit = paidTotal - jobCost;

    return {
      projectInvoices,
      projectExpenses,
      contractValue,
      invoicedTotal,
      paidTotal,
      outstanding,
      expensesTotal,
      jobCost,
      expectedProfit,
      cashProfit,
    };
  }, [project?.id, project?.budget, materialCost, workerCost, financeRefreshKey, project]);

  if (!project) return <div>Loading...</div>;

  const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

  return (
    <div className="space-y-6">
      {/* HEADER + ACTIONS */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-sm text-gray-500">
              Client: <span className="font-medium">{project.client}</span>
            </p>
            {(isWorker || isAccountant) && (
              <p className="text-sm text-gray-500 mt-1">Read-only for your role.</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Finance actions (Accountant/Admin only) */}
            {canCreateInvoice && (
              <button
                onClick={() => navigate(`/finance/invoices?projectId=${project.id}`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                + Create Invoice
              </button>
            )}

            {canAddExpense && (
              <button
                onClick={() => navigate(`/finance/expenses?projectId=${project.id}`)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                + Add Expense
              </button>
            )}

            {/* Documents actions */}
            {canUploadContract && (
              <button
                onClick={() => navigate(`/documents/contracts?projectId=${project.id}&new=1`)}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
              >
                + Upload Contract
              </button>
            )}

            {canUploadPhotoAttachment && (
              <>
                <button
                  onClick={() => navigate(`/documents/photos?projectId=${project.id}&new=1`)}
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition"
                >
                  + Upload Photo
                </button>

                <button
                  onClick={() => navigate(`/documents/attachments?projectId=${project.id}&new=1`)}
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition"
                >
                  + Upload Attachment
                </button>
              </>
            )}

            <button
              onClick={() => setFinanceRefreshKey((k) => k + 1)}
              className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              title="Refresh finance + documents totals"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Quick View links */}
        <div className="flex flex-wrap gap-3 text-sm">
          {canViewContractLinks && (
            <button
              className="text-blue-600 hover:underline"
              onClick={() => navigate(`/documents/contracts?projectId=${project.id}`)}
            >
              View Contracts ({docCounts.contracts})
            </button>
          )}

          {canViewPhotosAttachmentsLinks && (
            <>
              <button
                className="text-blue-600 hover:underline"
                onClick={() => navigate(`/documents/photos?projectId=${project.id}`)}
              >
                View Photos ({docCounts.photos})
              </button>
              <button
                className="text-blue-600 hover:underline"
                onClick={() => navigate(`/documents/attachments?projectId=${project.id}`)}
              >
                View Attachments ({docCounts.attachments})
              </button>
            </>
          )}
        </div>
      </div>

      {/* PROJECT INFO */}
      <div className="bg-white p-4 rounded shadow">
        <p><b>Client:</b> {project.client}</p>
        <p><b>Supervisor:</b> {project.supervisor || "-"}</p>
        <p><b>Team:</b> {project.team || "-"}</p>
      </div>

      {/* FINANCE SUMMARY (read-only for everyone who can view project) */}
      <div className="bg-white p-4 rounded shadow space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Finance Summary</h2>
          <div className="text-xs text-gray-500">Linked to invoices/payments/expenses + documents</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-3 rounded-lg border">
            <p className="text-xs text-gray-500">Contract Value</p>
            <p className="text-lg font-bold">{fmt(finance.contractValue)}</p>
          </div>

          <div className="p-3 rounded-lg border">
            <p className="text-xs text-gray-500">Invoiced</p>
            <p className="text-lg font-bold">{fmt(finance.invoicedTotal)}</p>
            <p className="text-xs text-gray-500">
              Paid: {fmt(finance.paidTotal)} • Outstanding: {fmt(finance.outstanding)}
            </p>
          </div>

          <div className="p-3 rounded-lg border">
            <p className="text-xs text-gray-500">Job Cost</p>
            <p className="text-lg font-bold">{fmt(finance.jobCost)}</p>
            <p className="text-xs text-gray-500">
              Materials: {fmt(materialCost)} • Workers: {fmt(workerCost)} • Expenses: {fmt(finance.expensesTotal)}
            </p>
          </div>

          <div className="p-3 rounded-lg border">
            <p className="text-xs text-gray-500">Expected Profit</p>
            <p className="text-lg font-bold text-green-700">{fmt(finance.expectedProfit)}</p>
          </div>

          <div className="p-3 rounded-lg border">
            <p className="text-xs text-gray-500">Cash Profit</p>
            <p className="text-lg font-bold text-blue-700">{fmt(finance.cashProfit)}</p>
          </div>

          <div className="p-3 rounded-lg border">
            <p className="text-xs text-gray-500">Records</p>
            <p className="text-sm">
              Invoices: <b>{finance.projectInvoices.length}</b>
              <br />
              Expenses: <b>{finance.projectExpenses.length}</b>
              <br />
              Documents: <b>{docCounts.total}</b>{" "}
              <span className="text-xs text-gray-500">
                (C:{docCounts.contracts}, P:{docCounts.photos}, A:{docCounts.attachments})
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* MATERIALS */}
      <div className="bg-white p-4 rounded shadow space-y-3">
        <h2 className="font-semibold">Materials</h2>

        {canEditProject && (
          <div className="flex gap-2">
            <input
              placeholder="Material"
              className="border p-1"
              value={materialForm.name}
              onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
            />
            <input
              placeholder="Qty"
              type="number"
              className="border p-1"
              value={materialForm.quantity}
              onChange={(e) => setMaterialForm({ ...materialForm, quantity: e.target.value })}
            />
            <input
              placeholder="Price"
              type="number"
              className="border p-1"
              value={materialForm.price}
              onChange={(e) => setMaterialForm({ ...materialForm, price: e.target.value })}
            />
            <button onClick={addMaterial} className="bg-blue-500 text-white px-2">
              Add
            </button>
          </div>
        )}

        {(project.materials || []).map((m) => (
          <div key={m.id} className="border p-2">
            {m.name} — {m.quantity} × {m.price} = ${m.total}
          </div>
        ))}

        {!canEditProject && (project.materials || []).length === 0 && (
          <div className="text-sm text-gray-500">No materials.</div>
        )}
      </div>

      {/* WORKERS */}
      <div className="bg-white p-4 rounded shadow space-y-3">
        <h2 className="font-semibold">Workers</h2>

        {canEditProject && (
          <div className="flex gap-2">
            <input
              placeholder="Name"
              className="border p-1"
              value={workerForm.name}
              onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
            />
            <input
              placeholder="Role"
              className="border p-1"
              value={workerForm.role}
              onChange={(e) => setWorkerForm({ ...workerForm, role: e.target.value })}
            />
            <input
              placeholder="Hours"
              type="number"
              className="border p-1"
              value={workerForm.hours}
              onChange={(e) => setWorkerForm({ ...workerForm, hours: e.target.value })}
            />
            <input
              placeholder="Rate"
              type="number"
              className="border p-1"
              value={workerForm.rate}
              onChange={(e) => setWorkerForm({ ...workerForm, rate: e.target.value })}
            />
            <button onClick={addWorker} className="bg-green-500 text-white px-2">
              Add
            </button>
          </div>
        )}

        {(project.workers || []).map((w) => (
          <div key={w.id} className="border p-2">
            {w.name} — {w.role} — {w.hours}h × ${w.rate} = ${w.total}
          </div>
        ))}

        {!canEditProject && (project.workers || []).length === 0 && (
          <div className="text-sm text-gray-500">No workers.</div>
        )}
      </div>

      {/* TASKS (inside project object) */}
      <div className="bg-white p-4 rounded shadow space-y-3">
        <h2 className="font-semibold">Tasks</h2>

        {canEditProject && (
          <div className="flex gap-2">
            <input
              placeholder="Task Name"
              className="border p-1"
              value={taskForm.name}
              onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
            />
            <input
              placeholder="Assigned To"
              className="border p-1"
              value={taskForm.assigned}
              onChange={(e) => setTaskForm({ ...taskForm, assigned: e.target.value })}
            />
            <select
              className="border p-1"
              value={taskForm.status}
              onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
            >
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
            <button onClick={addTask} className="bg-purple-500 text-white px-2">
              Add
            </button>
          </div>
        )}

        {(project.tasks || []).map((t) => (
          <div key={t.id} className="border p-2">
            {t.name} — {t.assigned} — {t.status}
          </div>
        ))}

        {!canEditProject && (project.tasks || []).length === 0 && (
          <div className="text-sm text-gray-500">No tasks.</div>
        )}
      </div>

      {/* Internal finance (kept) */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold">Finance (Project Internal)</h2>
        <p>Material Cost: ${materialCost}</p>
        <p>Worker Cost: ${workerCost}</p>
        <p className="font-bold">Total Cost: ${materialCost + workerCost}</p>
        <p className="text-blue-600 font-bold">
          Profit (Budget - Internal Cost): ${Number(project.budget || 0) - (materialCost + workerCost)}
        </p>
      </div>
    </div>
  );
};

export default ProjectDetails;