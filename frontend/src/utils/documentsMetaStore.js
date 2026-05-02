const KEY = "documents_meta";

export function getDocumentsMeta() {
  return JSON.parse(localStorage.getItem(KEY)) || [];
}

export function saveDocumentsMeta(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addDocumentMeta(meta) {
  const list = getDocumentsMeta();
  const updated = [...list, meta];
  saveDocumentsMeta(updated);
  return updated;
}

export function deleteDocumentMeta(id) {
  const list = getDocumentsMeta();
  const updated = list.filter((d) => d.id !== id);
  saveDocumentsMeta(updated);
  return updated;
}