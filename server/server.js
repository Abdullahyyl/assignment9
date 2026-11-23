import express from "express";
import cors from "cors";
import { queryBooks, getBookById } from "./booksStore.js";
import { parseId, parseListQuery } from "./validate.js";

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// CORS: only the client's exact origin is allowed (never "*")
app.use(cors({ origin: CLIENT_ORIGIN }));
// Body parsing must come BEFORE the routes
app.use(express.json());

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

// --- Books -------------------------------------------------------------

app.get("/api/books", async (req, res) => {
  const parsed = parseListQuery(req.query);
  if (parsed.error) return sendError(res, 400, parsed.error);
  const books = await queryBooks(parsed.options);
  res.json(books);
});

app.get("/api/books/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return sendError(res, 400, "id must be a positive integer");
  const book = await getBookById(id);
  if (!book) return sendError(res, 404, `Book ${id} not found`);
  res.json(book);
});

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT} (allowed origin: ${CLIENT_ORIGIN})`);
});
