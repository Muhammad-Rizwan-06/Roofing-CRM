import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import UploadDocumentModal from "../../components/documents/UploadDocumentModal";
import { useAuth } from "../../context/AuthContext";
import { ROLE } from "../../config/accessControl";
import { useDocuments } from "../../context/DocumentsContext";
import { useProjects } from "../../context/ProjectsContext";

const Photos = () => {
  const { user } = useAuth();
  const roleName = user?.roleName;

  const canUpload = [ROLE.ADMIN, ROLE.PM, ROLE.WORKER].includes(roleName);
  const canDelete = [ROLE.ADMIN, ROLE.PM].includes(roleName);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") || "";
  const newUpload = searchParams.get("new") === "1";

  const [open,       setOpen]       = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

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
    fetchDocuments({ projectId: projectId || undefined, type: "photo" });
    fetchProjects();
  }, [projectId]);

  useEffect(() => {
    if (newUpload && canUpload) setOpen(true);
  }, [newUpload, canUpload]);

  const filtered = useMemo(() =>
    documents.filter((d) => d.type === "photo"),
  [documents]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleUpload = async (uploadedDoc) => {
    // Document already uploaded by UploadDocumentModal
    // Just close the modal and refresh if needed
    setOpen(false);
    // Re-fetch to ensure UI is in sync with server
    await fetchDocuments({ projectId: projectId || undefined, type: "photo" });
    if (projectId) setSearchParams({ projectId });
  };

  const handleDelete = async (documentId) => {
    if (!canDelete) { alert("You do not have permission to delete photos."); return; }
    await deleteDocument(documentId);
  };

  const openPreview = (doc) => {
    if (!doc.fileUrl) return alert("File URL not available");
    setPreviewUrl(doc.fileUrl);
  };

  const closePreview = () => setPreviewUrl(null);



  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Photos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Project photo gallery
          </p>
          {!canDelete && canUpload && (
            <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
              Note: You can upload photos, but deletion is restricted.
            </p>
          )}
        </div>
        {canUpload ? (
          <button onClick={() => setOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition">
            + Upload Photo
          </button>
        ) : (
          <div className="text-xs text-gray-500 dark:text-gray-300 mt-2">Upload disabled for your role.</div>
        )}
      </div>

      {error && (
        <div className="text-red-600 bg-red-100 dark:bg-red-200 p-3 rounded">
          Error: {error.message || "Failed to load photos."}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filtered.map((d) => (
          <div key={d.documentId}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow border border-gray-100 dark:border-gray-800 p-3">
            <button onClick={() => openPreview(d)} className="w-full text-left" type="button">
              <div className="h-28 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                {d.fileUrl ? (
                  <img src={d.fileUrl} alt={d.fileName}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                    Click to preview
                  </div>
                )}
              </div>
              <div className="mt-2">
                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                  {d.fileName}
                </p>
                <button className="text-xs text-blue-600 hover:underline" type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/projects/${d.projectId}`); }}>
                  {d.projectName}
                </button>
              </div>
            </button>
            <div className="mt-2 flex justify-end">
              {canDelete ? (
                <button className="text-xs text-red-600 hover:underline" type="button"
                  onClick={() => handleDelete(d.documentId)}>Delete</button>
              ) : (
                <span className="text-xs text-gray-400">—</span>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && loading === false && (
          <div className="col-span-full text-center text-gray-500 dark:text-gray-300 py-10">
            No photos uploaded.
          </div>
        )}
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={closePreview}>
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-2">
              <button className="text-white text-xl" onClick={closePreview} type="button">✕</button>
            </div>
            <img src={previewUrl} alt="Preview" className="w-full rounded-2xl" />
          </div>
        </div>
      )}

      <UploadDocumentModal
        open={open}
        onClose={() => {
          setOpen(false);
          if (newUpload) setSearchParams(projectId ? { projectId } : {});
        }}
        onUploaded={handleUpload}
        projects={projects}
        docType="photo"
        prefillProjectId={projectId}
      />
    </div>
  );
};

export default Photos;