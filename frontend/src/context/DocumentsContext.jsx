import { createContext, useContext, useState, useCallback } from "react";
import { apiClient } from "../utils/apiClient";

// ─── Context ──────────────────────────────────────────────────────────────────

const DocumentsContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DocumentsProvider({ children }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── helpers ──────────────────────────────────────────────────────────────────

  const handleStart = () => {
    setLoading(true);
    setError(null);
  };
  const handleError = (e) => {
    setError(e?.message ?? "Something went wrong");
    setLoading(false);
  };

  // ── GET /documents ────────────────────────────────────────────────────────────
  /**
   * @param {{ projectId?: string, type?: "contract"|"attachment"|"photo" }} filters
   */
  const fetchDocuments = useCallback(async (filters = {}) => {
    handleStart();
    try {
      const params = new URLSearchParams();
      if (filters.projectId) params.set("projectId", filters.projectId);
      if (filters.type) params.set("type", filters.type);

      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await apiClient.get(`/documents${query}`);
      setDocuments(res.documents ?? []);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── POST /documents/upload-url ────────────────────────────────────────────────
  /**
   * Step 1 of upload — get presigned S3 PUT url.
   * @param {{
   *   fileName:  string,
   *   mimeType:  string,
   *   projectId: string,
   *   type:      "contract"|"attachment"|"photo"
   * }} data
   * @returns {{ uploadUrl: string, fileKey: string, documentId: string }}
   */
  const getUploadUrl = useCallback(async (data) => {
    handleStart();
    try {
      const res = await apiClient.post("/documents/upload-url", data);
      return res; // { uploadUrl, fileKey, documentId }
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Upload file directly to S3 ────────────────────────────────────────────────
  /**
   * Step 2 of upload — PUT file directly to S3 using presigned url.
   * Bypasses Lambda entirely — no auth header needed.
   * @param {string} uploadUrl  - presigned S3 url from getUploadUrl
   * @param {File}   file       - raw File object from input
   */
  const uploadToS3 = useCallback(async (uploadUrl, file) => {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    if (!res.ok) throw new Error("S3 upload failed");
  }, []);

  // ── POST /documents ───────────────────────────────────────────────────────────
  /**
   * Step 3 of upload — save metadata to DynamoDB after S3 upload succeeds.
   * @param {{
   *   documentId:  string,
   *   projectId:   string,
   *   projectName?: string,
   *   type:        "contract"|"attachment"|"photo",
   *   fileName:    string,
   *   fileKey:     string,
   *   mimeType?:   string,
   *   notes?:      string,
   *   uploadedBy?: { userId, name, email, roleName }
   * }} data
   * @returns {object} saved document
   */
  const saveDocument = useCallback(async (data) => {
    handleStart();
    try {
      const res = await apiClient.post("/documents", data);
      const newDocument = res.document;
      setDocuments((prev) => [newDocument, ...prev]);
      return newDocument;
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Full upload flow (convenience method) ─────────────────────────────────────
  /**
   * Combines all 3 steps: getUploadUrl → uploadToS3 → saveDocument
   * @param {File}   file
   * @param {{
   *   projectId:   string,
   *   projectName?: string,
   *   type:        "contract"|"attachment"|"photo",
   *   notes?:      string,
   *   uploadedBy?: { userId, name, email, roleName }
   * }} meta
   * @returns {object} saved document
   */
  const uploadDocument = useCallback(async (file, meta) => {
    handleStart();
    try {
      // Use meta properties as primary source, fallback to file object
      const fileName = meta.fileName || file?.name;
      const mimeType = meta.mimeType || file?.type;

      if (!fileName) {
        throw new Error("File name is required");
      }

      // 1. Get presigned url
      const { uploadUrl, fileKey, documentId } = await apiClient.post(
        "/documents/upload-url",
        {
          fileName: fileName,
          mimeType: mimeType,
          projectId: meta.projectId,
          type: meta.type,
        },
      );

      // 2. Upload file directly to S3
      await uploadToS3(uploadUrl, file);

      // 3. Save metadata
      const res = await apiClient.post("/documents", {
        documentId,
        fileKey,
        fileName: fileName,
        mimeType: mimeType,
        projectId: meta.projectId,
        projectName: meta.projectName || "",
        type: meta.type,
        notes: meta.notes || "",
        uploadedBy: meta.uploadedBy || null,
      });

      const newDocument = res.document;
      setDocuments((prev) => [newDocument, ...prev]);
      return newDocument;
    } catch (e) {
      console.error("uploadDocument error:", e);
      handleError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── PATCH /documents/{documentId}/sign ────────────────────────────────────────
  /**
   * Save signature on a contract.
   * @param {string} documentId
   * @param {{
   *   projectId:  string,
   *   signedBy:   { userId, name, email, roleName },
   *   signature:  { dataUrl: string, mimeType: string }
   * }} data
   * @returns {object} updated document
   */
  const signDocument = useCallback(async (documentId, data) => {
    handleStart();
    try {
      const res = await apiClient.patch(`/documents/${documentId}/sign`, data);
      const updatedDocument = res.document;
      setDocuments((prev) =>
        prev.map((d) => (d.documentId === documentId ? updatedDocument : d)),
      );
      return updatedDocument;
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── DELETE /documents/{documentId} ────────────────────────────────────────────
  /**
   * Deletes metadata from DynamoDB + file from S3.
   * @param {string} documentId
   */
  const deleteDocument = useCallback(async (documentId) => {
    handleStart();
    try {
      await apiClient.delete(`/documents/${documentId}`);
      setDocuments((prev) => prev.filter((d) => d.documentId !== documentId));
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── context value ─────────────────────────────────────────────────────────────

  const value = {
    // state
    documents,
    loading,
    error,

    // actions
    fetchDocuments,
    uploadDocument, // convenience — use this in components
    getUploadUrl, // if you need manual control over the 3-step flow
    uploadToS3, // if you need manual control over the 3-step flow
    saveDocument, // if you need manual control over the 3-step flow
    signDocument,
    deleteDocument,
  };

  return (
    <DocumentsContext.Provider value={value}>
      {children}
    </DocumentsContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * const {
 *   documents, loading, error,
 *   fetchDocuments, uploadDocument,
 *   signDocument, deleteDocument,
 * } = useDocuments();
 */
export function useDocuments() {
  const ctx = useContext(DocumentsContext);
  if (!ctx)
    throw new Error("useDocuments must be used inside <DocumentsProvider>");
  return ctx;
}
