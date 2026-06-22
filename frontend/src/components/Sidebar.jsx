import { deleteDocument } from "../utils/api";

function formatSize(bytes) {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function Sidebar({ docs, selectedDocIds = [], onSelect, onDelete, onNewClick }) {
  const handleDelete = async (e, docId) => {
    e.stopPropagation();
    try {
      await deleteDocument(docId);
      onDelete(docId);
    } catch (err) {
      alert("Operational fault: " + err.message);
    }
  };

  return (
    <div style={{
      width: 280,
      flexShrink: 0,
      borderRight: "1px solid rgba(255, 255, 255, 0.06)",
      background: "#090a0f",
      display: "flex",
      flexDirection: "column",
      height: "100%",
    }}>
      {/* Sidebar Header */}
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ 
            background: "linear-gradient(135deg, #6366f1, #4f46e5)", 
            width: 24, 
            height: 24, 
            borderRadius: 6, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            flexShrink: 0
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M4 19.5A2.5 2.5 0 0 1 6 17h14M4 4.5A2.5 2.5 0 0 1 6 2h14v20H6a2.5 2.5 0 0 1-2.5-2.5V4.5z"></path>
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc", letterSpacing: "-0.01em" }}>
            NotebookLM
          </span>
        </div>
      </div>

      {/* Action Upload Trigger */}
      <div style={{ padding: "14px 10px 4px" }}>
        <button
          onClick={onNewClick}
          style={{
            width: "100%", padding: "10px 12px", background: "rgba(99, 102, 241, 0.06)",
            color: "#818cf8", border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: 8,
            fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
          }}
        >
          <span>＋</span> Add Document Node
        </button>
      </div>

      {/* Document Explorer List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px 20px" }}>
        {docs.map(doc => {
          const isSelected = selectedDocIds.includes(doc.docId);
          return (
            <div
              key={doc.docId}
              onClick={() => onSelect(doc)}
              style={{
                padding: "12px 12px",
                borderRadius: 10,
                marginBottom: 4,
                cursor: "pointer",
                background: isSelected ? "rgba(99, 102, 241, 0.08)" : "transparent",
                border: isSelected ? "1px solid rgba(99, 102, 241, 0.35)" : "1px solid transparent",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              {/* Checkbox indicator box */}
              <div style={{
                width: 14, height: 14, borderRadius: 4,
                border: isSelected ? "1px solid #818cf8" : "1px solid #475569",
                background: isSelected ? "#4f46e5" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                {isSelected && <span style={{ color: "#fff", fontSize: 9, fontWeight: 900 }}>✓</span>}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, color: isSelected ? "#f8fafc" : "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {doc.name}
                </p>
                <p style={{ margin: "3px 0 0", fontSize: 11, color: isSelected ? "#818cf8" : "#64748b" }}>
                  {doc.chunkCount} vectors · {formatSize(doc.size)}
                </p>
              </div>
              <button
                onClick={e => handleDelete(e, doc.docId)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", fontSize: 13 }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}