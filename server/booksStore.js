// In-memory data source. Every function is async (simulating a slow source)
// and never modifies the existing array or objects: it builds new ones instead.

const delay = (ms = 25) => new Promise((resolve) => setTimeout(resolve, ms));

let books = [
  { id: 1, title: "Dune", author: "Frank Herbert", year: 1965, genre: "fiction", read: true, rating: 5 },
  { id: 2, title: "A Brief History of Time", author: "Stephen Hawking", year: 1988, genre: "science", read: true, rating: 4 },
  { id: 3, title: "The Hobbit", author: "J.R.R. Tolkien", year: 1937, genre: "fantasy", read: true, rating: 5 },
  { id: 4, title: "Sapiens", author: "Yuval Noah Harari", year: 2011, genre: "history", read: true, rating: 4 },
  { id: 5, title: "The Name of the Wind", author: "Patrick Rothfuss", year: 2007, genre: "fantasy", read: false, rating: null },
  { id: 6, title: "Educated", author: "Tara Westover", year: 2018, genre: "non-fiction", read: false, rating: null },
  { id: 7, title: "The Selfish Gene", author: "Richard Dawkins", year: 1976, genre: "science", read: false, rating: null },
];
let nextId = 8;

const sameBook = (a, b) =>
  a.title.trim().toLowerCase() === b.title.trim().toLowerCase() &&
  a.author.trim().toLowerCase() === b.author.trim().toLowerCase();

// Books without a rating always sort last, whatever the direction
function compareBooks(sort, order) {
  const direction = order === "desc" ? -1 : 1;
  return (a, b) => {
    if (sort === "rating") {
      if (a.rating === null && b.rating === null) return a.id - b.id;
      if (a.rating === null) return 1;
      if (b.rating === null) return -1;
      return (a.rating - b.rating) * direction || a.id - b.id;
    }
    let result;
    if (sort === "title" || sort === "author") {
      result = a[sort].localeCompare(b[sort], undefined, { sensitivity: "base" });
    } else if (sort === "year") {
      result = a.year - b.year;
    } else {
      result = a.id - b.id;
    }
    return result * direction || a.id - b.id;
  };
}

export async function queryBooks({ genre, read, q, sort, order, limit, page }) {
  await delay();
  const needle = q ? q.toLowerCase() : "";
  const filtered = books.filter(
    (book) =>
      (genre === undefined || book.genre === genre) &&
      (read === undefined || book.read === read) &&
      (needle === "" ||
        book.title.toLowerCase().includes(needle) ||
        book.author.toLowerCase().includes(needle)),
  );
  // sort a copy: filter already made one, but be explicit so the stored array is never sorted
  const sorted = [...filtered].sort(compareBooks(sort, order));
  const start = (page - 1) * limit;
  return sorted.slice(start, start + limit);
}

export async function getAllBooks() {
  await delay();
  return [...books];
}

export async function getBookById(id) {
  await delay();
  return books.find((book) => book.id === id) ?? null;
}

// The duplicate check and the write happen in the same synchronous step
// (no await between them), so two concurrent requests cannot both pass.
export async function createBook(data) {
  await delay();
  if (books.some((book) => sameBook(book, data))) return { conflict: true };
  const book = { ...data, id: nextId };
  nextId += 1;
  books = [...books, book];
  return { book };
}

export async function replaceBook(id, data) {
  await delay();
  const existing = books.find((book) => book.id === id);
  if (!existing) return { notFound: true };
  if (books.some((book) => book.id !== id && sameBook(book, data))) {
    return { conflict: true };
  }
  const updated = { ...data, id };
  books = books.map((book) => (book.id === id ? updated : book));
  return { book: updated };
}

export async function deleteBook(id) {
  await delay();
  if (!books.some((book) => book.id === id)) return false;
  books = books.filter((book) => book.id !== id);
  return true;
}
