import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import UploadDocumentModal from "../../components/documents/UploadDocumentModal";
import { useAuth } from "../../context/AuthContext";
import { ROLE } from "../../config/accessControl";
import { useDocuments } from "../../context/DocumentsContext";
import { useProjects } from "../../context/ProjectsContext";

const Attachments = () => {
  const { user } = useAuth();
  const roleName = user?.roleName;

  const canUpload = [ROLE.ADMIN, ROLE.PM, ROLE.WORKER].includes(roleName);
  const canDelete = [ROLE.ADMIN, ROLE.PM].includes(roleName);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") || "";
  const newUpload = searchParams.get("new") === "1";

  const [open, setOpen] = useState(false);

  const {
    documents,
    loading,
    error,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
  } = useDocuments();

  const { projects, getAll: fetchProjects } = useProjects();

  // ── Bootstrap ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchDocuments({ projectId: projectId || undefined, type: "attachment" });
    fetchProjects();
  }, [projectId]);

  useEffect(() => {
    if (newUpload && canUpload) setOpen(true);
  }, [newUpload, canUpload]);

  const filtered = useMemo(() =>
    documents.filter((d) => d.type === "attachment"),
  [documents]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleUpload = async (uploadedDoc) => {
    // Document already uploaded by UploadDocumentModal
    // Just close the modal and refresh if needed
    setOpen(false);
    // Re-fetch to ensure UI is in sync with server
    await fetchDocuments({ projectId: projectId || undefined, type: "attachment" });
    if (projectId) setSearchParams({ projectId });
  };

  const handleDelete = async (documentId) => {
    if (!canDelete) { alert("You do not have permission to delete attachments."); return; }
    await deleteDocument(documentId);
  };

  const download = (doc) => {
    if (!doc.fileUrl) return alert("File URL not available");
    const a = document.createElement("a");
    a.href     = doc.fileUrl;
    a.download = doc.fileName;
    a.click();
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Attachments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Project-linked files (permits, notes, misc)
          </p>
          {!canDelete && canUpload && (
            <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
              Note: You can upload attachments, but deletion is restricted.
            </p>
          )}
        </div>
        {canUpload ? (
          <button onClick={() => setOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition">
            + Upload Attachment
          </button>
        ) : (
          <div className="text-xs text-gray-500 dark:text-gray-300 mt-2">Upload disabled for your role.</div>
        )}
      </div>
      {error && (
        <div className="text-red-600 bg-red-100 dark:bg-red-200 p-3 rounded">
          Error: {error.message || "Failed to load attachments."}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">Attachment List</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="text-left p-3">File</th>
              <th className="text-left p-3">Project</th>
              <th className="text-left p-3">Uploaded</th>
              <th className="text-left p-3">Notes</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.documentId} className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 font-medium text-gray-800 dark:text-gray-100">{d.fileName}</td>
                <td className="p-3">
                  <button className="text-blue-600 hover:underline" type="button"
                    onClick={() => navigate(`/projects/${d.projectId}`)}>
                    {d.projectName}
                  </button>
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-300">
                  {d.uploadedAt ? new Date(d.uploadedAt).toLocaleString() : "—"}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-300">{d.notes || "—"}</td>
                <td className="p-3 text-right space-x-3">
                  <button className="text-indigo-600 hover:underline" type="button"
                    onClick={() => download(d)}>Download</button>
                  {canDelete ? (
                    <button className="text-red-600 hover:underline" type="button"
                      onClick={() => handleDelete(d.documentId)}>Delete</button>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500 dark:text-gray-300">
                  No attachments uploaded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <UploadDocumentModal
        open={open}
        onClose={() => {
          setOpen(false);
          if (newUpload) setSearchParams(projectId ? { projectId } : {});
        }}
        onUploaded={handleUpload}
        projects={projects}
        docType="attachment"
        prefillProjectId={projectId}
      />
    </div>
  );
};

export default Attachments;