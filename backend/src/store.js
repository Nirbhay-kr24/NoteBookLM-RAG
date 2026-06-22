/**
 * In-memory document store.
 * Maps docId -> { metadata, rawText, index }
 * * Production Note: Swap this structure out for Redis, PostgreSQL, or MongoDB.
 */

const store = new Map();

export function saveDocument(docId, data) {
  store.set(docId, data);
}

export function getDocument(docId) {
  return store.get(docId) || null;
}

/**
 * Lists all indexed documents.
 * Properties are mapped to match front-end data models cleanly.
 */
export function listDocuments() {
  return [...store.entries()].map(([id, doc]) => ({
    docId: id, // Explicitly renamed from 'id' to 'docId' to match the frontend framework
    name: doc.metadata.name,
    size: Number(doc.metadata.size) || 0, // Enforce true numeric type safety
    pages: doc.metadata.pages,
    chunkCount: doc.index?.chunks?.length || 0,
    uploadedAt: doc.metadata.uploadedAt,
  }));
}

export function deleteDocument(docId) {
  return store.delete(docId);
}