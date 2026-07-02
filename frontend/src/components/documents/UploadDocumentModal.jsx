import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDocuments } from "../../context/DocumentsContext";
import { useAuth } from "../../context/AuthContext";

const MAX_SIZE = 100 * 1024 * 1024; // 100MB (S3 default)

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
  const { uploadDocument, loading, error: contextError } = useDocuments();
  const { user } = useAuth();

  const [projectId, setProjectId] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileMimeType, setFileMimeType] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const inputRef = useRef(null);

  useEffect(() => {

    if (!open) return;

    // reset on open (prevents accidentally re-uploading old selected file)
    setNotes("");
    setFile(null);
    setFileName("");
    setFileMimeType("");
    setError(null);

    if (prefillProjectId) {
      setProjectId(String(prefillProjectId));
    } else {
      setProjectId("");
    }
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
      return (
        name.endsWith(".pdf") || name.endsWith(".doc") || name.endsWith(".docx")
      );
    }
    return true;
  };

  const pickFile = () => inputRef.current?.click();

  const setPickedFile = (f) => {

    if (!f) {
      setFile(null);
      setFileName("");
      setFileMimeType("");
      return;
    }

    if (!isAllowedFile(f)) {
      setError(`Invalid file type. Allowed: ${acceptHint}`);
      return;
    }

    if (f.size > MAX_SIZE) {
      setError("File too large (max 100MB).");
      return;
    }

    setFile(f);
    setFileName(f.name || "");
    setFileMimeType(f.type || "");
    setError(null);
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
    setError(null);

    if (!projectId) {
      setError("Project is required");
      return;
    }
    if (!file) {
      setError("File is required");
      return;
    }

    const p = projects.find((x) => String(x.projectId) === String(projectId));
    if (!p) {
      setError("Invalid project selected");
      return;
    }


    setUploading(true);
    try {
      const metaToSend = {
        projectId: String(projectId),
        projectName: p.name,
        type: docType,
        notes,
        uploadedBy: user
          ? {
            userId: user.userId,
            name: user.name,
            email: user.email,
            roleName: user.roleName,
          }
          : null,
      };


      const uploadedDoc = await uploadDocument(file, {
        ...metaToSend,
        fileName: fileName || file?.name,
        mimeType: fileMimeType || file?.type,
      });


      if (onUploaded) {
        onUploaded(uploadedDoc);
      }

      onClose();
    } catch (err) {
      setError(err?.message || "Upload failed. Please try again.");
      console.error("Upload error:", err);
      console.error("Error details:", {
        name: err?.name,
        message: err?.message,
        status: err?.status,
        data: err?.data,
      });
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white">
              Upload {title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
              Uploaded to S3. Max size: 100MB.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 dark:hover:text-white"
            aria-label="Close"
            type="button"
            disabled={uploading || loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Errors */}
          {(error || contextError) && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-700 dark:text-red-300">
                {error || contextError}
              </p>
            </div>
          )}

          {/* Project */}
          <div>
            <label className="text-xs text-gray-500">Project *</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={uploading || loading}
              className="w-full mt-1 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
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
              disabled={uploading || loading}
              className="hidden"
            />

            <div
              onClick={uploading || loading ? undefined : pickFile}
              onDrop={uploading || loading ? undefined : onDrop}
              onDragOver={uploading || loading ? undefined : onDragOver}
              onDragLeave={uploading || loading ? undefined : onDragLeave}
              role="button"
              tabIndex={uploading || loading ? -1 : 0}
              onKeyDown={(e) => {
                if (
                  (e.key === "Enter" || e.key === " ") &&
                  !uploading &&
                  !loading
                )
                  pickFile();
              }}
              className={`mt-1 rounded-2xl border-2 border-dashed p-4 transition ${uploading || loading
                ? "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 cursor-not-allowed opacity-60"
                : dragOver
                  ? "border-blue-600 bg-blue-50 dark:bg-gray-950 cursor-pointer"
                  : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 cursor-pointer"
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
                      or{" "}
                      <span className="text-blue-600 font-medium">
                        click to browse
                      </span>
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
                    disabled={uploading || loading}
                    className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
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
                      disabled={uploading || loading}
                      className="px-3 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      disabled={uploading || loading}
                      className="px-3 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
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
              disabled={uploading || loading}
              className="w-full mt-1 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder="e.g. Signed contract v2, before/after photos..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading || loading}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!projectId || !file || uploading || loading}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading || loading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default UploadDocumentModal;
