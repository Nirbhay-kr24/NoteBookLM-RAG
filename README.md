# NotebookLM Clone — Multi-Document RAG Engine

A functional, lightweight multi-document RAG (Retrieval-Augmented Generation) pipeline that lets users upload multiple PDF or text assets, select or deselect specific knowledge nodes, and perform comprehensive cross-document queries. Built with a Node.js/Express backend and a React/Vite frontend powered by Groq's LLaMA 3.3 70B.

---

## Architecture Flow


```

User Uploads Multiple Files
│
▼
[1. Ingestion Engine]
pdf-parse → raw text strings per asset
│
▼
[2. Sliding-Window Chunking]
text → chunks[] (2000 chars, 400 char overlap, tagged with source file name metadata)
│
▼
[3. Local Memory Indexing]
In-memory TF-IDF vector matrix tables mapped per individual file node
│
▼
[4. Multi-Select Control State] ← Frontend tracks active files (array of selectedDocIds)
│
▼
[5. Parallel Retrieval & Global Ranking] (Query Time)
query → Parallel TF-IDF similarity lookup across ALL active selections → Global score sort
│
▼
[6. Synthesized Generation]
Top-k chunks + cross-file metadata injected into System Prompt → LLaMA 3.3 70B → Answer

```

### Key Engineering Features
- **Toggle Selection Logic:** Users can click to select/deselect specific files to dynamically shape the AI's contextual window on the fly.
- **Zero-Dependency Frontend Queries:** The frontend relies purely on the browser's native `fetch` API, completely removing third-party networking packages (like `axios`) to eliminate build errors.
- **Cross-Document Citations:** Retrieved text chunks are appended with source file attributes, forcing the LLM to output precise inline citations (e.g., `[Reference Block 1 | Document Source: "Ikigai.pdf"]`).

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- A [Groq API Key](https://console.groq.com)

### 1. Project Ingestion
Clone the repository and jump into the workspace:
```bash
git clone <your-repo-link>
cd notebooklm

```

### 2. Dependency Setup

Install dependencies inside both decoupled directories:

```bash
# Setup Backend
cd backend
npm install

# Setup Frontend
cd ../frontend
npm install

```

### 3. Environment Variables

Inside the `backend/` directory, create a `.env` file:

```env
PORT=3001
GROQ_API_KEY=gsk_your_actual_key_here
USE_HYDE=true
USE_JUDGE=true

```

*(Note: Ensure your `.gitignore` contains `.env` to avoid pushing secrets to GitHub!)*

### 4. Running Locally

Open two terminal windows to boot up your stack:

* **Terminal 1 (Backend):**
```bash
cd backend && npm run dev

```


* **Terminal 2 (Frontend):**
```bash
cd frontend && npm run dev

```



Open **http://localhost:5173** in your web browser.

---

## Deployment Playbook

### Backend Deployment (Render / Railway)

1. Push your code repository to GitHub (ensuring `node_modules` and `.env` are excluded).
2. Deploy a new **Web Service** tied to your repository.
3. Configure the start runtime script: `node server.js`.
4. Manually add your `GROQ_API_KEY` under the platform's Environment Variables panel.

### Frontend Deployment (Vercel / Netlify)

1. Open `frontend/src/components/Chat.jsx`.
2. Swap out the local endpoint string `"http://localhost:3001/documents/query"` with your live deployed backend URL link.
3. Connect the frontend root to your hosting platform and trigger the production build pipeline.

---

## Project Directory Map

```
notebooklm/
├── backend/
│   ├── server.js          # Express server with parallel multi-document query paths
│   ├── rag.js             # Matrix text-chunking & custom TF-IDF retrieval math
│   ├── store.js           # In-memory session binary store mapping
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.jsx      # Chat workspace built with native fetch streams
│   │   │   ├── Sidebar.jsx   # Multi-checkbox document selector panel
│   │   │   └── Uploader.jsx  # Drag-and-drop document upload interface
│   │   ├── App.jsx           # Global multi-select array synchronization hook
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md

```

---

## Unified Endpoint Interface

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | Server status monitoring probe |
| GET | `/documents` | Pulls all uploaded documents from memory |
| POST | `/documents/upload` | Extracts, chunks, and indexes a single PDF/TXT node |
| POST | `/documents/query` | Evaluates cross-document retrieval arrays simultaneously |
| DELETE | `/documents/:docId` | Deletes a document from the session pool |

### Multi-Query Payload Example (`POST /documents/query`)

```json
{
  "docIds": [
    "8a5c32b9-7512-4c91-9e2e-fa45672a9120",
    "2b9e45c1-1275-491c-8e3d-ba91245e3110"
  ],
  "question": "Compare the primary themes and list out the titles of all selected files.",
  "k": 5
}

```

### Success Response Payload

```json
{
  "answer": "According to [Reference Block 1 | Document Source: \"Ikigai.pdf\"], the core theme focuses on purpose, whereas...",
  "sources": [
    {
      "docName": "Ikigai.pdf",
      "chunkIndex": 2,
      "score": 0.481,
      "preview": "Text fragment containing the relevant matches extracted during runtime..."
    }
  ],
  "model": "llama-3.3-70b-versatile",
  "tokensUsed": 1145
}

```





```

```
