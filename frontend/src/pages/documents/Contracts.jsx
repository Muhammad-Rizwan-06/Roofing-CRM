import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import UploadDocumentModal from "../../components/documents/UploadDocumentModal";
import { useAuth } from "../../context/AuthContext";
import { ROLE } from "../../config/accessControl";
import { useDocuments } from "../../context/DocumentsContext";
import { useProjects } from "../../context/ProjectsContext";
import { getCustomerProjectIdSet } from "../../utils/customerScope";

const SIGN_HEIGHT = 220;

const Contracts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const roleName = user?.roleName;

  const isPortal   = location.pathname.startsWith("/portal");
  const projectBase = isPortal ? "/portal/projects" : "/projects";

  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") || "";
  const searchQuery = searchParams.get("search") || "";
  const newUpload = searchParams.get("new") === "1";

  const [openUpload, setOpenUpload] = useState(false);
  const [signOpen,   setSignOpen]   = useState(false);
  const [activeDoc,  setActiveDoc]  = useState(null);

  const sigRef     = useRef(null);
  const sigWrapRef = useRef(null);
  const [sigWidth, setSigWidth] = useState(700);

  const canUploadContract = [ROLE.ADMIN, ROLE.SALES, ROLE.PM].includes(roleName);
  const canDeleteContract = [ROLE.ADMIN, ROLE.PM].includes(roleName);
  const canSignContract   = [ROLE.ADMIN, ROLE.SALES, ROLE.PM, ROLE.CUSTOMER].includes(roleName);

  const {
    documents,
    loading,
    error,
    fetchDocuments,
    uploadDocument,
    signDocument,
    deleteDocument,
  } = useDocuments();

  const { projects, getAll: fetchProjects } = useProjects();

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchDocuments({ projectId: projectId || undefined, type: "contract" });
    fetchProjects();
  }, [projectId]);

  useEffect(() => {
    if (newUpload && canUploadContract) setOpenUpload(true);
  }, [newUpload, canUploadContract]);

  // ── Customer scope ────────────────────────────────────────────────────────────
  const myProjectIds = useMemo(() => {
    if (roleName !== ROLE.CUSTOMER) return null;
    return getCustomerProjectIdSet(projects, user);
  }, [projects, roleName, user]);

  const filtered = useMemo(() => {
    let list = documents.filter((d) => d.type === "contract");
    if (roleName === ROLE.CUSTOMER && myProjectIds) {
      list = list.filter((d) => myProjectIds.has(String(d.projectId)));
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter((d) => {
      const fileName = (d.fileName || "").toLowerCase();
      const projectName = (d.projectName || "").toLowerCase();
      const notes = (d.notes || "").toLowerCase();
      const status = d.signed ? "signed" : "unsigned";
      return (
        fileName.includes(q) ||
        projectName.includes(q) ||
        notes.includes(q) ||
        status.includes(q)
      );
    });
  }, [documents, roleName, myProjectIds, searchQuery]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleUpload = async (uploadedDoc) => {
    // Document already uploaded by UploadDocumentModal
    // Just close the modal and refresh if needed
    setOpenUpload(false);
    // Re-fetch to ensure UI is in sync with server
    await fetchDocuments({ projectId: projectId || undefined, type: "contract" });
    if (projectId) setSearchParams({ projectId });
  };

  const handleDelete = async (documentId) => {
    if (!canDeleteContract) { alert("You do not have permission to delete contracts."); return; }
    await deleteDocument(documentId);
  };

  const openSignModal = (doc) => {
    if (!canSignContract) { alert("You do not have permission to sign contracts."); return; }
    setActiveDoc(doc);
    setSignOpen(true);
  };

  const closeSignModal = () => {
    setSignOpen(false);
    setActiveDoc(null);
    setTimeout(() => { try { sigRef.current?.clear(); } catch {} }, 0);
  };

  const clearSignature = () => { try { sigRef.current?.clear(); } catch {} };

  const handleSaveSignature = async () => {
    try {
      if (!activeDoc)               return;
      if (activeDoc.signed)         { alert("This contract is already signed."); return; }
      if (!sigRef.current)          { alert("Signature pad not ready."); return; }
      if (sigRef.current.isEmpty()) { alert("Please draw a signature first."); return; }

      const dataUrl = sigRef.current.getCanvas().toDataURL("image/png");

      await signDocument(activeDoc.documentId, {
        projectId:  activeDoc.projectId,
        signedBy: {
          userId:   user?.userId,
          name:     user?.name,
          email:    user?.email,
          roleName: user?.roleName,
        },
        signature: { dataUrl, mimeType: "image/png" },
      });

      closeSignModal();
      alert("Contract signed successfully.");
    } catch (e) {
      alert(`Failed to save signature: ${e?.message || e}`);
    }
  };

  const openOrDownload = (doc, download = false) => {
    if (!doc.fileUrl) return alert("File URL not available");
    if (download) {
      const a = document.createElement("a");
      a.href     = doc.fileUrl;
      a.download = doc.fileName;
      a.click();
    } else {
      window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  useEffect(() => {
    if (!signOpen) return;
    const el = sigWrapRef.current;
    if (!el) return;
    const applySize = () => { const w = el.clientWidth; if (w && w !== sigWidth) setSigWidth(w); };
    applySize();
    const ro = new ResizeObserver(() => applySize());
    ro.observe(el);
    setTimeout(() => { try { sigRef.current?.clear(); } catch {} }, 0);
    return () => ro.disconnect();
  }, [signOpen]);



  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Contracts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Project-linked contracts (PDF/DOC) + digital signatures
          </p>
        </div>
        {canUploadContract ? (
          <button
            type="button"
            onClick={() => setOpenUpload(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
          >
            + Upload Contract
          </button>
        ) : (
          <div className="text-xs text-gray-500 dark:text-gray-300 mt-2">Upload disabled for your role.</div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          Error loading contracts: {error.message || String(error)}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">Contract List</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="text-left p-3">File</th>
              <th className="text-left p-3">Project</th>
              <th className="text-left p-3">Status</th>
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
                  <button type="button" className="text-blue-600 hover:underline"
                    onClick={() => navigate(`${projectBase}/${d.projectId}`)}>
                    {d.projectName}
                  </button>
                </td>
                <td className="p-3">
                  {d.signed ? (
                    <div className="inline-flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Signed</span>
                      <span className="text-xs text-gray-500 dark:text-gray-300">
                        {d.signedAt ? new Date(d.signedAt).toLocaleString() : ""}
                      </span>
                    </div>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">Unsigned</span>
                  )}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-300">
                  {d.uploadedAt ? new Date(d.uploadedAt).toLocaleString() : "—"}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-300">{d.notes || "—"}</td>
                <td className="p-3 text-right space-x-3">
                  <button type="button" className="text-blue-600 hover:underline"
                    onClick={() => openOrDownload(d, false)}>Open</button>
                  <button type="button" className="text-indigo-600 hover:underline"
                    onClick={() => openOrDownload(d, true)}>Download</button>
                  {canSignContract && (
                    <button type="button" className="text-emerald-700 hover:underline"
                      onClick={() => openSignModal(d)}>
                      {d.signed ? "View Signature" : "Sign"}
                    </button>
                  )}
                  {canDeleteContract && (
                    <button type="button" className="text-red-600 hover:underline"
                      onClick={() => handleDelete(d.documentId)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500 dark:text-gray-300">
                  No contracts uploaded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <UploadDocumentModal
        open={openUpload}
        onClose={() => {
          setOpenUpload(false);
          if (newUpload) setSearchParams(projectId ? { projectId } : {});
        }}
        onUploaded={handleUpload}
        projects={projects}
        docType="contract"
        prefillProjectId={projectId}
      />

      {signOpen && activeDoc && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {activeDoc.signed ? "Signature (Signed Contract)" : "Sign Contract"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                  {activeDoc.fileName} • {activeDoc.projectName}
                </p>
              </div>
              <button type="button" onClick={closeSignModal}
                className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-600 text-sm">
                Close
              </button>
            </div>
            <div className="p-4 space-y-4">
              {activeDoc.signed ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-700 dark:text-gray-200">
                    <div><span className="font-semibold">Signed at:</span>{" "}
                      {activeDoc.signedAt ? new Date(activeDoc.signedAt).toLocaleString() : "—"}
                    </div>
                    <div className="mt-1"><span className="font-semibold">Signed by:</span>{" "}
                      {activeDoc.signedBy?.name || "—"}{" "}
                      <span className="text-xs text-gray-500">({activeDoc.signedBy?.roleName || "—"})</span>
                    </div>
                  </div>
                  {activeDoc.signature?.dataUrl ? (
                    <div className="border rounded-xl p-3 bg-gray-50">
                      <img src={activeDoc.signature.dataUrl} alt="Signature" className="max-h-48 w-auto" />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Signature image not found.</p>
                  )}
                </div>
              ) : (
                <>
                  <div ref={sigWrapRef} className="w-full h-55 border rounded-2xl overflow-hidden bg-white">
                    <SignatureCanvas
                      ref={sigRef}
                      penColor="black"
                      canvasProps={{ width: sigWidth, height: SIGN_HEIGHT, className: "block w-full h-full bg-white" }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <button type="button" onClick={clearSignature}
                      className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-600">
                      Clear
                    </button>
                    <div className="flex gap-2">
                      <button type="button" onClick={closeSignModal}
                        className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-600">
                        Cancel
                      </button>
                      <button type="button" onClick={handleSaveSignature}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
                        Save Signature
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contracts;