import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";

import UploadDocumentModal from "../../components/documents/UploadDocumentModal";
import { deleteFile, getFile } from "../../utils/idbFileStore";
import {
  addDocumentMeta,
  deleteDocumentMeta,
  getDocumentsMeta,
  saveDocumentsMeta,
} from "../../utils/documentsMetaStore";

import { useAuth } from "../../context/AuthContext";
import { ROLE } from "../../config/accessControl";
import { getCustomerProjectIdSet } from "../../utils/customerScope";

const SIGN_HEIGHT = 220;

const Contracts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const roleName = user?.roleName;

  const isPortal = location.pathname.startsWith("/portal");
  const projectBase = isPortal ? "/portal/projects" : "/projects";

  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") || "";
  const newUpload = searchParams.get("new") === "1";

  const [openUpload, setOpenUpload] = useState(false);

  const [projects] = useState(() => JSON.parse(localStorage.getItem("projects")) || []);
  const [docs, setDocs] = useState(() => getDocumentsMeta());

  // Signature modal state
  const [signOpen, setSignOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState(null);

  // Signature canvas refs
  const sigRef = useRef(null);
  const sigWrapRef = useRef(null);
  const [sigWidth, setSigWidth] = useState(700);

  // Permissions
  const canUploadContract = [ROLE.ADMIN, ROLE.SALES, ROLE.PM].includes(roleName);
  const canDeleteContract = [ROLE.ADMIN, ROLE.PM].includes(roleName);
  const canSignContract = [ROLE.ADMIN, ROLE.SALES, ROLE.PM, ROLE.CUSTOMER].includes(roleName);

  const myProjectIds = useMemo(() => {
    if (roleName !== ROLE.CUSTOMER) return null;
    return getCustomerProjectIdSet(projects, user);
  }, [projects, roleName, user]);

  useEffect(() => setDocs(getDocumentsMeta()), []);
  useEffect(() => {
    if (newUpload && canUploadContract) setOpenUpload(true);
  }, [newUpload, canUploadContract]);

  const filtered = useMemo(() => {
    let list = docs.filter((d) => d.type === "contract");

    if (projectId) {
      list = list.filter((d) => String(d.projectId) === String(projectId));
    }

    // ✅ Customer sees only their projects
    if (roleName === ROLE.CUSTOMER && myProjectIds) {
      list = list.filter((d) => myProjectIds.has(String(d.projectId)));
    }

    return list;
  }, [docs, projectId, roleName, myProjectIds]);

  const uploadMeta = (meta) => {
    addDocumentMeta(meta);
    setDocs(getDocumentsMeta());
    if (projectId) setSearchParams({ projectId });
  };

  const remove = async (id) => {
    if (!canDeleteContract) {
      alert("You do not have permission to delete contracts.");
      return;
    }
    await deleteFile(id);
    deleteDocumentMeta(id);
    setDocs(getDocumentsMeta());
  };

  const openOrDownload = async (id, download = false) => {
    const rec = await getFile(id);
    if (!rec?.blob) return alert("File not found in storage");

    const url = URL.createObjectURL(rec.blob);
    if (download) {
      const a = document.createElement("a");
      a.href = url;
      a.download = rec.fileName || "contract";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 8000);
    }
  };

  const closeSignModal = () => {
    setSignOpen(false);
    setActiveDoc(null);
    setTimeout(() => {
      try {
        sigRef.current?.clear();
      } catch {}
    }, 0);
  };

  const openSignModal = (doc) => {
    if (!canSignContract) {
      alert("You do not have permission to sign contracts.");
      return;
    }
    setActiveDoc(doc);
    setSignOpen(true);
  };

  useEffect(() => {
    if (!signOpen) return;

    const el = sigWrapRef.current;
    if (!el) return;

    const applySize = () => {
      const w = el.clientWidth;
      if (w && w !== sigWidth) setSigWidth(w);
    };

    applySize();

    const ro = new ResizeObserver(() => applySize());
    ro.observe(el);

    setTimeout(() => {
      try {
        sigRef.current?.clear();
      } catch {}
    }, 0);

    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signOpen]);

  const clearSignature = () => {
    try {
      sigRef.current?.clear();
    } catch {}
  };

  const saveSignature = () => {
    try {
      if (!activeDoc) return;

      if (activeDoc.signed) {
        alert("This contract is already signed.");
        return;
      }

      if (!sigRef.current) {
        alert("Signature pad not ready. Close and open again.");
        return;
      }

      if (sigRef.current.isEmpty()) {
        alert("Please draw a signature first.");
        return;
      }

      const dataUrl = sigRef.current.getCanvas().toDataURL("image/png");
      const now = new Date().toISOString();

      const signedBy = user
        ? {
            userId: user.id,
            name: user.name,
            email: user.email,
            roleName: user.roleName,
          }
        : null;

      const updated = docs.map((d) =>
        d.id === activeDoc.id
          ? {
              ...d,
              signed: true,
              signedAt: now,
              signedBy,
              signature: {
                dataUrl,
                mimeType: "image/png",
              },
            }
          : d
      );

      saveDocumentsMeta(updated);

      const fresh = getDocumentsMeta();
      setDocs(fresh);

      closeSignModal();
      alert("Contract signed successfully.");
    } catch (e) {
      console.error(e);
      alert(`Failed to save signature: ${e?.message || e}`);
    }
  };

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
          <div className="text-xs text-gray-500 dark:text-gray-300 mt-2">
            Upload disabled for your role.
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">
          Contract List
        </div>

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
            {filtered.map((d) => {
              const signed = Boolean(d.signed);

              return (
                <tr key={d.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="p-3 font-medium text-gray-800 dark:text-gray-100">
                    {d.fileName}
                  </td>

                  <td className="p-3">
                    <button
                      type="button"
                      className="text-blue-600 hover:underline"
                      onClick={() => navigate(`${projectBase}/${d.projectId}`)}
                    >
                      {d.projectName}
                    </button>
                  </td>

                  <td className="p-3">
                    {signed ? (
                      <div className="inline-flex items-center gap-2">
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                          Signed
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-300">
                          {d.signedAt ? new Date(d.signedAt).toLocaleString() : ""}
                        </span>
                      </div>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                        Unsigned
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-gray-600 dark:text-gray-300">
                    {d.uploadedAt ? new Date(d.uploadedAt).toLocaleString() : "—"}
                  </td>

                  <td className="p-3 text-gray-600 dark:text-gray-300">{d.notes || "—"}</td>

                  <td className="p-3 text-right space-x-3">
                    <button
                      type="button"
                      className="text-blue-600 hover:underline"
                      onClick={() => openOrDownload(d.id, false)}
                    >
                      Open
                    </button>

                    <button
                      type="button"
                      className="text-indigo-600 hover:underline"
                      onClick={() => openOrDownload(d.id, true)}
                    >
                      Download
                    </button>

                    {canSignContract && (
                      <button
                        type="button"
                        className="text-emerald-700 hover:underline"
                        onClick={() => openSignModal(d)}
                        title={signed ? "View signature details" : "Sign contract"}
                      >
                        {signed ? "View Signature" : "Sign"}
                      </button>
                    )}

                    {canDeleteContract && (
                      <button
                        type="button"
                        className="text-red-600 hover:underline"
                        onClick={() => remove(d.id)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500 dark:text-gray-300">
                  No contracts uploaded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      <UploadDocumentModal
        open={openUpload}
        onClose={() => {
          setOpenUpload(false);
          if (newUpload) setSearchParams(projectId ? { projectId } : {});
        }}
        onUploaded={uploadMeta}
        projects={projects}
        docType="contract"
        prefillProjectId={projectId}
      />

      {/* Sign Modal */}
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

              <button
                type="button"
                onClick={closeSignModal}
                className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm"
              >
                Close
              </button>
            </div>

            <div className="p-4 space-y-4">
              {activeDoc.signed ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-700 dark:text-gray-200">
                    <div>
                      <span className="font-semibold">Signed at:</span>{" "}
                      {activeDoc.signedAt ? new Date(activeDoc.signedAt).toLocaleString() : "—"}
                    </div>
                    <div className="mt-1">
                      <span className="font-semibold">Signed by:</span>{" "}
                      {activeDoc.signedBy?.name || "—"}{" "}
                      <span className="text-xs text-gray-500">
                        ({activeDoc.signedBy?.roleName || "—"})
                      </span>
                    </div>
                  </div>

                  {activeDoc.signature?.dataUrl ? (
                    <div className="border rounded-xl p-3 bg-gray-50">
                      <img
                        src={activeDoc.signature.dataUrl}
                        alt="Signature"
                        className="max-h-48 w-auto"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Signature image not found.</p>
                  )}
                </div>
              ) : (
                <>
                  <div
                    ref={sigWrapRef}
                    className="w-full h-[220px] border rounded-2xl overflow-hidden bg-white"
                  >
                    <SignatureCanvas
                      ref={sigRef}
                      penColor="black"
                      canvasProps={{
                        width: sigWidth,
                        height: SIGN_HEIGHT,
                        className: "block w-full h-full bg-white",
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
                    >
                      Clear
                    </button>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={closeSignModal}
                        className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveSignature}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        Save Signature
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    Tip: signature is stored in localStorage for demo.
                  </p>
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