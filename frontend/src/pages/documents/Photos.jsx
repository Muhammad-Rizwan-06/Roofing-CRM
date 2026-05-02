import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import UploadDocumentModal from "../../components/documents/UploadDocumentModal";
import { deleteFile, getFile } from "../../utils/idbFileStore";
import {
  addDocumentMeta,
  deleteDocumentMeta,
  getDocumentsMeta,
} from "../../utils/documentsMetaStore";
import { useAuth } from "../../context/AuthContext";
import { ROLE } from "../../config/accessControl";

const Photos = () => {
  const { user } = useAuth();
  const roleName = user?.roleName;

  const canUpload = [ROLE.ADMIN, ROLE.PM, ROLE.WORKER].includes(roleName);
  const canDelete = [ROLE.ADMIN, ROLE.PM].includes(roleName);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") || "";
  const newUpload = searchParams.get("new") === "1";

  const [open, setOpen] = useState(false);
  const [projects] = useState(() => JSON.parse(localStorage.getItem("projects")) || []);
  const [docs, setDocs] = useState(() => getDocumentsMeta());
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => setDocs(getDocumentsMeta()), []);

  useEffect(() => {
    // Auto-open only if role can upload
    if (newUpload && canUpload) setOpen(true);
  }, [newUpload, canUpload]);

  const filtered = useMemo(() => {
    const list = docs.filter((d) => d.type === "photo");
    if (!projectId) return list;
    return list.filter((d) => String(d.projectId) === String(projectId));
  }, [docs, projectId]);

  const uploadMeta = (meta) => {
    addDocumentMeta(meta);
    setDocs(getDocumentsMeta());
    if (projectId) setSearchParams({ projectId });
  };

  const remove = async (id) => {
    if (!canDelete) {
      alert("You do not have permission to delete photos.");
      return;
    }
    await deleteFile(id);
    deleteDocumentMeta(id);
    setDocs(getDocumentsMeta());
  };

  const openPreview = async (id) => {
    const rec = await getFile(id);
    if (!rec?.blob) return alert("File not found in storage");
    const url = URL.createObjectURL(rec.blob);
    setPreviewUrl(url);
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Photos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Project photo gallery (stored in IndexedDB)
          </p>

          {!canDelete && canUpload && (
            <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
              Note: You can upload photos, but deletion is restricted.
            </p>
          )}
        </div>

        {canUpload ? (
          <button
            onClick={() => setOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
          >
            + Upload Photo
          </button>
        ) : (
          <div className="text-xs text-gray-500 dark:text-gray-300 mt-2">
            Upload disabled for your role.
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filtered.map((d) => (
          <div
            key={d.id}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow border border-gray-100 dark:border-gray-800 p-3"
          >
            <button onClick={() => openPreview(d.id)} className="w-full text-left" type="button">
              <div className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 text-xs">
                Click to preview
              </div>
              <div className="mt-2">
                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                  {d.fileName}
                </p>
                <button
                  className="text-xs text-blue-600 hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate(`/projects/${d.projectId}`);
                  }}
                  type="button"
                >
                  {d.projectName}
                </button>
              </div>
            </button>

            <div className="mt-2 flex justify-end">
              {canDelete ? (
                <button
                  className="text-xs text-red-600 hover:underline"
                  onClick={() => remove(d.id)}
                  type="button"
                >
                  Delete
                </button>
              ) : (
                <span className="text-xs text-gray-400">—</span>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center text-gray-500 dark:text-gray-300 py-10">
            No photos uploaded.
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-2">
              <button className="text-white text-xl" onClick={closePreview} type="button">
                ✕
              </button>
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
        onUploaded={uploadMeta}
        projects={projects}
        docType="photo"
        prefillProjectId={projectId}
      />
    </div>
  );
};

export default Photos;