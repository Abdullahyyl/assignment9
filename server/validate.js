export const GENRES = ["fiction", "non-fiction", "science", "history", "fantasy", "other"];
const SORT_FIELDS = ["title", "author", "year", "rating"];
const BOOK_FIELDS = ["title", "author", "year", "genre", "read", "rating"];

// "12" -> 12, anything else (0, -1, "1.5", "abc", "1e3") -> null
export function parseId(text) {
  return /^[1-9]\d{0,14}$/.test(text) ? Number(text) : null;
}

export function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateText(value, name) {
  if (typeof value !== "string") return `${name} must be a string of 1 to 100 characters`;
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > 100) {
    return `${name} must be 1 to 100 characters after trimming`;
  }
  return null;
}

// Validates a COMPLETE book (used for POST, PUT and the merged result of PATCH).
// Returns { value } with a clean object, or { error } with a message for the developer.
// Only known fields are copied, so unknown fields (and any "id") are ignored.
export function validateBook(input) {
  const titleError = validateText(input.title, "title");
  if (titleError) return { error: titleError };
  const authorError = validateText(input.author, "author");
  if (authorError) return { error: authorError };

  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(input.year) || input.year < 1000 || input.year > currentYear) {
    return { error: `year must be an integer between 1000 and ${currentYear}` };
  }

  if (!GENRES.includes(input.genre)) {
    return { error: `genre must be one of: ${GENRES.join(", ")}` };
  }

  const read = input.read === undefined ? false : input.read;
  if (typeof read !== "boolean") return { error: "read must be true or false" };

  const rating = input.rating === undefined ? null : input.rating;
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return { error: "rating must be an integer from 1 to 5, or null" };
  }
  if (rating !== null && read !== true) {
    return { error: "rating is only allowed when read is true" };
  }

  return {
    value: {
      title: input.title.trim(),
      author: input.author.trim(),
      year: input.year,
      genre: input.genre,
      read,
      rating,
    },
  };
}

// Only the known book fields that were actually sent
export function pickBookFields(body) {
  return Object.fromEntries(BOOK_FIELDS.filter((key) => key in body).map((key) => [key, body[key]]));
}

// Validates and converts the query string of GET /api/books.
// A repeated parameter arrives as an array and is rejected.
export function parseListQuery(query) {
  const names = ["genre", "read", "q", "sort", "order", "limit", "page"];
  for (const name of names) {
    if (name in query && typeof query[name] !== "string") {
      return { error: `query parameter "${name}" must be given exactly once` };
    }
  }

  const options = { order: "asc", limit: 50, page: 1 };

  if ("genre" in query) {
    if (!GENRES.includes(query.genre)) {
      return { error: `genre must be one of: ${GENRES.join(", ")}` };
    }
    options.genre = query.genre;
  }
  if ("read" in query) {
    if (query.read !== "true" && query.read !== "false") {
      return { error: 'read must be "true" or "false"' };
    }
    options.read = query.read === "true";
  }
  if ("q" in query) options.q = query.q.trim();
  if ("sort" in query) {
    if (!SORT_FIELDS.includes(query.sort)) {
      return { error: `sort must be one of: ${SORT_FIELDS.join(", ")}` };
    }
    options.sort = query.sort;
  }
  if ("order" in query) {
    if (query.order !== "asc" && query.order !== "desc") {
      return { error: 'order must be "asc" or "desc"' };
    }
    options.order = query.order;
  }
  if ("limit" in query) {
    const limit = /^\d+$/.test(query.limit) ? Number(query.limit) : NaN;
    if (!(limit >= 1 && limit <= 50)) return { error: "limit must be an integer from 1 to 50" };
    options.limit = limit;
  }
  if ("page" in query) {
    const page = /^\d+$/.test(query.page) ? Number(query.page) : NaN;
    if (!(page >= 1)) return { error: "page must be an integer of 1 or more" };
    options.page = page;
  }
  return { options };
}
