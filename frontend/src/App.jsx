import { useState } from "react";
import Uploader from "./components/Uploader";
import Chat from "./components/Chat";
import Sidebar from "./components/Sidebar";

export default function App() {
  const [docs, setDocs] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [showUploader, setShowUploader] = useState(true);

  const handleUploaded = (doc) => {
    setDocs(prev => [...prev, doc]);
    setSelectedDocIds(prev => [...prev, doc.docId]); // Auto-select on upload
    setShowUploader(false);
  };

  const handleDelete = (docId) => {
    setDocs(prev => prev.filter(d => d.docId !== docId));
    setSelectedDocIds(prev => prev.filter(id => id !== docId));
    if (selectedDocIds.length <= 1 && selectedDocIds.includes(docId)) {
      setShowUploader(true);
    }
  };

  // Toggles selection state allowing multi-doc evaluation
  const handleToggleSelect = (doc) => {
    setSelectedDocIds(prev => {
      const isSelected = prev.includes(doc.docId);
      const nextSelection = isSelected 
        ? prev.filter(id => id !== doc.docId) 
        : [...prev, doc.docId];
      
      // If everything is unselected, flip back to the uploader workspace view
      if (nextSelection.length === 0) {
        setShowUploader(true);
      } else {
        setShowUploader(false);
      }
      
      return nextSelection;
    });
  };

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "#0d0f17",
      overflow: "hidden",
    }}>
      <Sidebar
        docs={docs}
        selectedDocIds={selectedDocIds}
        onSelect={handleToggleSelect}
        onDelete={handleDelete}
        onNewClick={() => {
          setSelectedDocIds([]);
          setShowUploader(true);
        }}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }}>
        {showUploader || selectedDocIds.length === 0 ? (
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 40,
            gap: 32,
            background: "#0d0f17"
          }}>
            <div style={{ textAlign: "center" }}>
              <h2 style={{ margin: "0 0 10px", fontSize: 26, fontWeight: 700, color: "#f8fafc", letterSpacing: "-0.02em" }}>
                Document Vector Intelligence Engine
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: "#64748b", maxWidth: 440, lineHeight: 1.5 }}>
                Parse unstructured documentation fragments to construct isolated contextual knowledge nodes.
              </p>
            </div>
            
            <Uploader onUploaded={handleUploaded} />
          </div>
        ) : (
          /* Generate unified chat environment keyed to the selection configuration hash */
          <Chat 
            key={selectedDocIds.sort().join(",")} 
            selectedDocIds={selectedDocIds} 
            selectedDocs={docs.filter(d => selectedDocIds.includes(d.docId))}
          />
        )}
      </div>
    </div>
  );
}