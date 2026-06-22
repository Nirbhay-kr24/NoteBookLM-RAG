import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import Groq from "groq-sdk";

import { chunkText, buildIndex, retrieve } from "./rag.js";
import { saveDocument, getDocument, listDocuments, deleteDocument } from "./store.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_, file, cb) => {
    const allowed = ["application/pdf", "text/plain"];
    cb(null, allowed.includes(file.mimetype));
  },
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.3-70b-versatile";

const USE_HYDE = process.env.USE_HYDE !== "false";
const USE_JUDGE = process.env.USE_JUDGE !== "false";

// Enhanced retrieval helpers

/**
 * HyDE (Hypothetical Document Embeddings).
 */
async function generateHypothetical(question) {
  try {
    const r = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "Write a brief, plausible passage (2-4 sentences) that could answer the user's question, " +
            "in the style of an excerpt from a document. Invent specific details if needed — this text " +
            "is used only to improve search matching and is never shown to the user.",
        },
        { role: "user", content: question },
      ],
      temperature: 0.5,
      max_tokens: 200,
    });
    return r.choices[0]?.message?.content?.trim() || "";
  } catch (err) {
    console.error("HyDE error:", err);
    return "";
  }
}

/**
 * LLM judge (CRAG-style relevance evaluator).
 * Modified to support cross-document item attribution arrays safely.
 */
async function judgeChunks(question, candidates) {
  if (!candidates || candidates.length === 0) return [];

  const list = candidates
    .map((c, i) => `[${i + 1}] Source File: ${c.docName} | Content: ${c.chunk.text.slice(0, 500)}`)
    .join("\n\n");

  try {
    const r = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a retrieval relevance judge working with multiple text references. You are given a QUESTION and candidate PASSAGES, each " +
            "prefixed with a bracketed number like [1], [2]. Identify which passages contain information " +
            "useful for answering the question. Use ONLY those bracketed passage numbers — ignore any " +
            "internal numbering or section labels that appear inside the passage text. " +
            'Respond with ONLY JSON of the form {"relevant":[<passage numbers>]}. ' +
            'Return {"relevant":[]} only if no passage is useful.',
        },
        { role: "user", content: `QUESTION: ${question}\n\nPASSAGES:\n${list}` },
      ],
      temperature: 0,
      max_tokens: 150,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(r.choices[0].message.content);
    const raw = Array.isArray(parsed.relevant) ? parsed.relevant : [];
    const valid = raw.map(n => candidates[Number(n) - 1]).filter(Boolean);
    
    return valid;
  } catch (err) {
    console.error("Judge filtering exception, passing candidates safely through:", err);
    return candidates; 
  }
}

// Routes

app.get("/health", (_, res) => res.json({ status: "ok" }));

app.get("/documents", (_, res) => {
  res.json(listDocuments());
});

app.post("/documents/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded or unsupported type." });
    }

    const { originalname, mimetype, buffer, size } = req.file;
    let rawText = "";
    let pages = 1;

    if (mimetype === "application/pdf") {
      const parsed = await pdfParse(buffer);
      rawText = parsed.text;
      pages = parsed.numpages;
    } else {
      rawText = buffer.toString("utf-8");
    }

    if (!rawText.trim()) {
      return res.status(422).json({ error: "Document appears to be empty." });
    }

    const chunks = chunkText(rawText);
    const index = buildIndex(chunks);
    const docId = uuidv4();

    saveDocument(docId, {
      metadata: {
        name: originalname,
        size,
        pages,
        mimetype,
        uploadedAt: new Date().toISOString(),
      },
      rawText,
      index,
    });

    res.json({
      docId,
      name: originalname,
      pages,
      chunkCount: chunks.length,
      charCount: rawText.length,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to process document." });
  }
});

app.delete("/documents/:docId", (req, res) => {
  const deleted = deleteDocument(req.params.docId);
  if (!deleted) return res.status(404).json({ error: "Document not found." });
  res.json({ success: true });
});

/**
 * Multi-Document Query Interface Engine
 * Replaces the old single :docId endpoint parameter to parse parallel cross-document trees.
 */
app.post("/documents/query", async (req, res) => {
  const { docIds, question, k = 5 } = req.body;

  if (!Array.isArray(docIds) || docIds.length === 0) {
    return res.status(400).json({ error: "An array of selected docIds is required to evaluate query bounds." });
  }

  if (!question?.trim()) {
    return res.status(400).json({ error: "Question is required." });
  }

  try {
    let combinedResults = [];
    let queryToExecute = question;

    // 1. Generate standard HyDE vector baseline if enabled
    if (USE_HYDE) {
      const hypothetical = await generateHypothetical(question);
      if (hypothetical) queryToExecute = `${question}\n\n${hypothetical}`;
    }

    // 2. Query each active document node concurrently 
    for (const docId of docIds) {
      const doc = getDocument(docId);
      if (!doc) continue;

      const candidateK = USE_JUDGE ? Math.max(k * 2, k + 3) : k;
      const docResults = retrieve(queryToExecute, doc.index, candidateK);

      // Map document names onto each chunk entry to ensure cross-document traceability
      const annotatedResults = docResults.map(resItem => ({
        ...resItem,
        docId,
        docName: doc.metadata.name
      }));

      combinedResults.push(...annotatedResults);
    }

    if (combinedResults.length === 0) {
      return res.json({
        answer: "I couldn't find any relevant content matching your terms across the selected documents.",
        sources: [],
        retrieval: { hyde: USE_HYDE, judge: USE_JUDGE, candidates: 0, kept: 0 },
      });
    }

    // Sort cross-document chunk structures globally based on proximity matching scores
    combinedResults.sort((a, b) => b.score - a.score);
    const totalCandidates = combinedResults.length;

    // 3. Process aggregated pool using the LLM relevance judge step
    let judgeRejectedEverything = false;
    let finalSelection = [...combinedResults];

    if (USE_JUDGE) {
      const kept = await judgeChunks(question, combinedResults);
      if (kept.length === 0) {
        judgeRejectedEverything = true;
        // Recovery path: fail open to the absolute best raw matching items across files
        finalSelection = combinedResults.slice(0, k);
      } else {
        finalSelection = kept.slice(0, k);
      }
    } else {
      finalSelection = finalSelection.slice(0, k);
    }

    // 4. Transform references into a unified multi-document prompt context
    const context = finalSelection
      .map((r, idx) => `[Reference Block ${idx + 1} | Document Source: "${r.docName}" | Chunk Index: ${r.chunk.index + 1}]\n${r.chunk.text}`)
      .join("\n\n---\n\n");

    const systemPrompt = `You are an advanced multi-document research analyst. You answer user queries strictly using contextual data slices extracted from several source frameworks.

RULES:
- Synthesize responses using data from ALL relevant documents when the user asks comparative questions (e.g., "summarise the books", "title of all 3 books").
- Explicitly cite your origins using the bracket metadata blocks provided (e.g., "According to [Reference Block 1 | Document Source: \"Ikigai.pdf\"]...").
- Do not make assumptions or blend external real-world info outside what is written in the context blocks.
- If some files do not have relevant data mentioned in the context, clearly summarize the parts you *can* verify from the text blocks.

CONTEXT SELECTION MAP:
${context}`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    });

    let answer = completion.choices[0].message.content;

    if (judgeRejectedEverything && answer.toLowerCase().includes("couldn't find")) {
      answer = `[Cross-Document Vector Variance Mismatch] ${answer}\n\nHint: Try phrasing queries to reference unique keywords present inside the specific documents you want to bridge.`;
    }

    res.json({
      answer,
      sources: finalSelection.map(r => ({
        docName: r.docName,
        chunkIndex: r.chunk.index,
        score: Math.round(r.score * 1000) / 1000,
        preview: r.chunk.text.slice(0, 200) + (r.chunk.text.length > 200 ? "…" : ""),
        startChar: r.chunk.startChar,
        endChar: r.chunk.endChar,
      })),
      model: completion.model,
      tokensUsed: completion.usage?.total_tokens,
      retrieval: {
        hyde: USE_HYDE,
        judge: USE_JUDGE,
        candidates: totalCandidates,
        kept: finalSelection.length,
      },
    });

  } catch (err) {
    console.error("Cross-Document analytical query processing fault:", err);
    const msg = err?.error?.message || err?.message || "Internal RAG engine connection fault.";
    res.status(502).json({ error: msg });
  }
});

// Start
app.listen(PORT, () => {
  console.log(`Multi-RAG Server running on http://localhost:${PORT}`);
});