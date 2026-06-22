import { useState, useRef, useEffect } from "react";

const API_BASE = import.meta.env.DEV
  ? "http://localhost:3001"
  : "https://notebooklm-rag-vtvj.onrender.com";

export default function Chat({ selectedDocIds, selectedDocs = [] }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const names = selectedDocs.map((d) => d.name).join(", ");

    setMessages([
      {
        role: "assistant",
        content: `Connected to files: ${
          names || "None"
        }. Ask me anything about them!`,
      },
    ]);
  }, [selectedDocIds, selectedDocs]);

  const handleSend = async (e) => {
    e.preventDefault();

    if (!input.trim() || loading) return;

    const userQuery = input.trim();

    setInput("");
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userQuery,
      },
    ]);

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/documents/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          docIds: selectedDocIds,
          question: userQuery,
          k: 5,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned code ${response.status}`);
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || "No answer returned.",
          sources: data.sources || [],
        },
      ]);
    } catch (err) {
      console.error("Network fault:", err);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `❌ Error: ${err.message}`,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#0d0f17",
        color: "#cbd5e1",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 24px",
          background: "#090a0f",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: "#f8fafc",
          }}
        >
          Chatting with {selectedDocs.length} Document(s)
        </h3>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: 840,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {messages.map((msg, i) => {
            const isUser = msg.role === "user";

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: isUser ? "#818cf8" : "#475569",
                  }}
                >
                  {isUser ? "YOU" : "AI"}
                </span>

                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    fontSize: 14,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    background: isUser
                      ? "rgba(99,102,241,0.12)"
                      : "#131622",
                    color: msg.isError ? "#ef4444" : "#e2e8f0",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}

          {loading && (
            <div
              style={{
                fontSize: 13,
                color: "#64748b",
                paddingLeft: 4,
              }}
            >
              Reading files...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div
        style={{
          padding: "16px 24px",
          background: "#090a0f",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <form
          onSubmit={handleSend}
          style={{
            maxWidth: 840,
            margin: "0 auto",
            display: "flex",
            gap: 12,
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question here..."
            disabled={loading}
            style={{
              flex: 1,
              background: "#131622",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              padding: "12px",
              color: "#f8fafc",
              fontSize: 14,
              outline: "none",
            }}
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "0 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
