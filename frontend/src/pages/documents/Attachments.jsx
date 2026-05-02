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
  const [projects] = useState(() => JSON.parse(localStorage.getItem("projects")) || []);
  const [docs, setDocs] = useState(() => getDocumentsMeta());

  useEffect(() => setDocs(getDocumentsMeta()), []);

  useEffect(() => {
    // Auto-open only if role can upload
    if (newUpload && canUpload) setOpen(true);
  }, [newUpload, canUpload]);

  const filtered = useMemo(() => {
    const list = docs.filter((d) => d.type === "attachment");
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
      alert("You do not have permission to delete attachments.");
      return;
    }
    await deleteFile(id);
    deleteDocumentMeta(id);
    setDocs(getDocumentsMeta());
  };

  const download = async (id) => {
    const rec = await getFile(id);
    if (!rec?.blob) return alert("File not found in storage");
    const url = URL.createObjectURL(rec.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = rec.fileName || "attachment";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

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
          <button
            onClick={() => setOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
          >
            + Upload Attachment
          </button>
        ) : (
          <div className="text-xs text-gray-500 dark:text-gray-300 mt-2">
            Upload disabled for your role.
          </div>
        )}
      </div>

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
              <tr key={d.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 font-medium text-gray-800 dark:text-gray-100">{d.fileName}</td>
                <td className="p-3">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => navigate(`/projects/${d.projectId}`)}
                    type="button"
                  >
                    {d.projectName}
                  </button>
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-300">
                  {d.uploadedAt ? new Date(d.uploadedAt).toLocaleString() : "—"}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-300">{d.notes || "—"}</td>
                <td className="p-3 text-right space-x-3">
                  <button className="text-indigo-600 hover:underline" onClick={() => download(d.id)} type="button">
                    Download
                  </button>

                  {canDelete ? (
                    <button className="text-red-600 hover:underline" onClick={() => remove(d.id)} type="button">
                      Delete
                    </button>
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
        onUploaded={uploadMeta}
        projects={projects}
        docType="attachment"
        prefillProjectId={projectId}
      />
    </div>
  );
};

export default Attachments;