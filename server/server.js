import express from "express";
import cors from "cors";
import {
  queryBooks,
  getAllBooks,
  getBookById,
  createBook,
  replaceBook,
  deleteBook,
} from "./booksStore.js";
import {
  parseId,
  isPlainObject,
  validateBook,
  pickBookFields,
  parseListQuery,
} from "./validate.js";

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

app.post("/api/books", async (req, res) => {
  if (!isPlainObject(req.body)) {
    return sendError(res, 400, "Request body must be a JSON object");
  }
  const { value, error } = validateBook(req.body);
  if (error) return sendError(res, 400, error);

  const result = await createBook(value);
  if (result.conflict) {
    return sendError(res, 409, "A book with this title and author already exists");
  }
  res.status(201).location(`/api/books/${result.book.id}`).json(result.book);
});

app.put("/api/books/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return sendError(res, 400, "id must be a positive integer");
  if (!isPlainObject(req.body)) {
    return sendError(res, 400, "Request body must be a JSON object");
  }
  const { value, error } = validateBook(req.body);
  if (error) return sendError(res, 400, error);

  const result = await replaceBook(id, value);
  if (result.notFound) return sendError(res, 404, `Book ${id} not found`);
  if (result.conflict) {
    return sendError(res, 409, "A book with this title and author already exists");
  }
  res.json(result.book);
});

app.patch("/api/books/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return sendError(res, 400, "id must be a positive integer");
  if (!isPlainObject(req.body)) {
    return sendError(res, 400, "Request body must be a JSON object");
  }
  const changes = pickBookFields(req.body);
  if (Object.keys(changes).length === 0) {
    return sendError(res, 400, "Send at least one of: title, author, year, genre, read, rating");
  }

  const existing = await getBookById(id);
  if (!existing) return sendError(res, 404, `Book ${id} not found`);

  // the merged book must pass the same validation as a complete book
  const { value, error } = validateBook({ ...existing, ...changes });
  if (error) return sendError(res, 400, error);

  const result = await replaceBook(id, value);
  if (result.notFound) return sendError(res, 404, `Book ${id} not found`);
  if (result.conflict) {
    return sendError(res, 409, "A book with this title and author already exists");
  }
  res.json(result.book);
});

app.delete("/api/books/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return sendError(res, 400, "id must be a positive integer");
  const deleted = await deleteBook(id);
  if (!deleted) return sendError(res, 404, `Book ${id} not found`);
  res.status(204).end();
});

// --- Statistics: computed from the current data on every request -------

app.get("/api/stats", async (req, res) => {
  const books = await getAllBooks();
  const rated = books.filter((book) => book.rating !== null);
  const byGenre = {};
  for (const book of books) {
    byGenre[book.genre] = (byGenre[book.genre] ?? 0) + 1;
  }
  const readCount = books.filter((book) => book.read).length;
  res.json({
    total: books.length,
    read: readCount,
    unread: books.length - readCount,
    averageRating:
      rated.length === 0
        ? null
        : Math.round((rated.reduce((sum, book) => sum + book.rating, 0) / rated.length) * 100) / 100,
    byGenre,
  });
});

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT} (allowed origin: ${CLIENT_ORIGIN})`);
});
