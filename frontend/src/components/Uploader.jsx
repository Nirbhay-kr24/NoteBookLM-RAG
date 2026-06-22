import { useState, useRef } from "react";
import { uploadDocument } from "../utils/api";

export default function Uploader({ onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    const allowed = ["application/pdf", "text/plain"];
    if (!allowed.includes(file.type)) {
      setError("Supported system fragments include only PDF and RAW text formats.");
      return;
    }
    setError(null);
    setProgress(0);
    try {
      const doc = await uploadDocument(file, setProgress);
      onUploaded(doc);
    } catch (e) {
      setError(e.message);
    } finally {
      setProgress(null);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div style={{ width: "100%", maxWidth: 520, background: "#090a0f", padding: 20 }}>
      {/* Drag & Drop Zone */}
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: `1px dashed ${dragging ? "#818cf8" : "rgba(255, 255, 255, 0.15)"}`,
          borderRadius: 16,
          padding: "54px 32px",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "rgba(99, 102, 241, 0.04)" : "rgba(255, 255, 255, 0.01)",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          userSelect: "none",
          boxShadow: dragging ? "0 0 24px rgba(99, 102, 241, 0.06) inset" : "none",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          style={{ display: "none" }}
          onChange={e => handleFile(e.target.files[0])}
        />
        
        {/* SVG Upload Icon Container */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{ 
            background: "rgba(255, 255, 255, 0.03)", 
            padding: 14, 
            borderRadius: 12, 
            border: "1px solid rgba(255, 255, 255, 0.05)" 
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
        </div>

        <p style={{ fontWeight: 600, fontSize: 15, color: "#f8fafc", margin: "0 0 6px" }}>
          Ingest new documentation node
        </p>
        <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
          Accepts PDF or TXT architectures up to 20 MB
        </p>
      </div>

      {/* Progress Track */}
      {progress !== null && (
        <div style={{ marginTop: 20 }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            fontSize: 12, 
            color: "#94a3b8", 
            marginBottom: 6, 
            fontWeight: 500 
          }}>
            <span style={{ letterSpacing: "0.02em" }}>Tokenizing Vector Matrix…</span>
            <span>{progress}%</span>
          </div>
          <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ 
              height: "100%", 
              width: `${progress}%`, 
              background: "linear-gradient(90deg, #6366f1, #4f46e5)", 
              borderRadius: 99, 
              transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)" 
            }} />
          </div>
        </div>
      )}

      {/* Error Output Console */}
      {error && (
        <div style={{ 
          marginTop: 16, 
          fontSize: 13, 
          color: "#f87171", 
          background: "rgba(248, 113, 113, 0.08)", 
          padding: "10px 14px", 
          borderRadius: 10, 
          border: "1px solid rgba(248, 113, 113, 0.15)", 
          display: "flex", 
          gap: 8, 
          alignItems: "center" 
        }}>
          <span style={{ fontSize: 14 }}>⚠️</span> {error}
        </div>
      )}
    </div>
  );
}