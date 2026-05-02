import React, { useEffect, useMemo, useRef, useState } from "react";
import { putFile } from "../../utils/idbFileStore";

const MAX_SIZE = 25 * 1024 * 1024; // 25MB

const bytes = (n) => {
  const v = Number(n || 0);
  if (v < 1024) return `${v} B`;
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`;
  if (v < 1024 * 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(1)} MB`;
  return `${(v / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const UploadDocumentModal = ({
  open,
  onClose,
  onUploaded,
  projects = [],
  docType, // "contract" | "photo" | "attachment"
  prefillProjectId = "",
}) => {
  const [projectId, setProjectId] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    // reset on open (prevents accidentally re-uploading old selected file)
    setNotes("");
    setFile(null);

    if (prefillProjectId) setProjectId(String(prefillProjectId));
    else setProjectId("");
  }, [open, prefillProjectId]);

  const title = useMemo(() => {
    if (docType === "contract") return "Contract";
    if (docType === "photo") return "Photo";
    return "Attachment";
  }, [docType]);

  const accept = useMemo(() => {
    if (docType === "photo") return "image/*";
    if (docType === "contract") return ".pdf,.doc,.docx";
    return "*/*";
  }, [docType]);

  const acceptHint = useMemo(() => {
    if (docType === "photo") return "PNG, JPG, WebP (any image)";
    if (docType === "contract") return "PDF, DOC, DOCX";
    return "Any file type";
  }, [docType]);

  const isAllowedFile = (f) => {
    if (!f) return false;
    if (docType === "photo") return String(f.type || "").startsWith("image/");
    if (docType === "contract") {
      const name = String(f.name || "").toLowerCase();
      return name.endsWith(".pdf") || name.endsWith(".doc") || name.endsWith(".docx");
    }
    return true;
  };

  const pickFile = () => inputRef.current?.click();

  const setPickedFile = (f) => {
    if (!f) return setFile(null);

    if (!isAllowedFile(f)) {
      alert(`Invalid file type. Allowed: ${acceptHint}`);
      return;
    }

    if (f.size > MAX_SIZE) {
      alert("File too large (max 25MB for offline demo).");
      return;
    }

    setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0] || null;
    setPickedFile(f);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!projectId) return alert("Project is required");
    if (!file) return alert("File is required");

    const p = projects.find((x) => String(x.id) === String(projectId));
    if (!p) return alert("Invalid project selected");

    const id = Date.now(); // document id
    await putFile({ id, file });

    const meta = {
      id,
      type: docType,
      projectId: Number(projectId),
      projectName: p.name,
      client: p.client,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      notes,
      uploadedAt: new Date().toISOString(),
    };

    onUploaded(meta);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white">
              Upload {title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
              Stored in IndexedDB (offline demo). Max size: 25MB.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 dark:hover:text-white"
            aria-label="Close"
            type="button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Project */}
          <div>
            <label className="text-xs text-gray-500">Project *</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full mt-1 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.client}
                </option>
              ))}
            </select>
          </div>

          {/* File Dropzone */}
          <div>
            <label className="text-xs text-gray-500">File *</label>

            <input
              ref={inputRef}
              type="file"
              accept={accept}
              onChange={(e) => setPickedFile(e.target.files?.[0] || null)}
              className="hidden"
            />

            <div
              onClick={pickFile}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") pickFile();
              }}
              className={`mt-1 rounded-2xl border-2 border-dashed p-4 cursor-pointer transition ${
                dragOver
                  ? "border-blue-600 bg-blue-50 dark:bg-gray-950"
                  : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
              }`}
              title="Drag & drop a file here, or click to browse"
            >
              {!file ? (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    ↑
                  </div>

                  <div className="flex-1">
                    <div className="font-medium text-gray-800 dark:text-gray-100">
                      Drag & drop your file here
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      or <span className="text-blue-600 font-medium">click to browse</span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">
                      Allowed: {acceptHint}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      pickFile();
                    }}
                    className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm"
                  >
                    Browse
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                      Selected file
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {bytes(file.size)} • {file.type || "unknown type"}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        pickFile();
                      }}
                      className="px-3 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-sm"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="px-3 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-gray-500">Notes (optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full mt-1 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
              placeholder="e.g. Signed contract v2, before/after photos..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!projectId || !file}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadDocumentModal;