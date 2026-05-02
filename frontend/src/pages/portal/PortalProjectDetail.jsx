import React, { useMemo } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isProjectForCustomer } from "../../utils/customerScope";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

export default function PortalProjectDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const projects = useMemo(() => JSON.parse(localStorage.getItem("projects")) || [], []);
  const invoices = useMemo(() => JSON.parse(localStorage.getItem("invoices")) || [], []);
  const docsMeta = useMemo(() => JSON.parse(localStorage.getItem("documents_meta")) || [], []);

  const project = useMemo(() => {
    const p = projects.find((x) => Number(x.id) === Number(id));
    return p || null;
  }, [projects, id]);

  if (!project) return <div>Loading...</div>;
  if (!isProjectForCustomer(project, user)) return <Navigate to="/unauthorized" replace />;

  const projectInvoices = invoices.filter((inv) => Number(inv.projectId) === Number(project.id));
  const paid = projectInvoices.reduce((s, inv) => s + Number(inv.amountPaid || 0), 0);
  const docsCount = docsMeta.filter((d) => Number(d.projectId) === Number(project.id)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{project.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Status: <b>{project.status || "—"}</b>
          </p>
        </div>

        <button
          className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          onClick={() => nav("/portal/projects")}
        >
          Back
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow border border-gray-100 dark:border-gray-800 space-y-2">
        <div><b>Client:</b> {project.client}</div>
        <div><b>Budget:</b> {money(project.budget)}</div>
        <div><b>Supervisor:</b> {project.supervisor || "-"}</div>
        <div><b>Team:</b> {project.team || "-"}</div>
        <div><b>Documents:</b> {docsCount}</div>
        <div><b>Invoices:</b> {projectInvoices.length} (Paid: {money(paid)})</div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <button
          className="text-blue-600 hover:underline"
          onClick={() => nav(`/portal/documents/contracts?projectId=${project.id}`)}
        >
          View Contracts
        </button>

        <button
          className="text-blue-600 hover:underline"
          onClick={() => nav(`/portal/finance/invoices?projectId=${project.id}`)}
        >
          View Invoices
        </button>
      </div>
    </div>
  );
}