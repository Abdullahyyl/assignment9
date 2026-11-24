// All network access lives here. Components never build URLs or call fetch.
// VITE_API_URL is read at build time; only variables prefixed with VITE_ are exposed to the browser.
const API_URL = import.meta.env.VITE_API_URL;

async function request(path, { method = "GET", body, signal } = {}) {
  const options = { method, signal, headers: {} };
  // Content-Type only when there is a body
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${path}`, options);

  // 204 No Content has no body to parse
  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch {
    // the body was empty or not JSON
  }

  // fetch does not reject on 4xx/5xx: turn the server's { error } into an Error
  if (!response.ok) {
    throw new Error(data?.error ?? `Request failed with status ${response.status}`);
  }
  return data;
}

// Builds "?genre=fantasy&q=the+hobbit" safely: values are encoded, empty ones skipped
export function buildQuery(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== "" && value !== undefined && value !== null) {
      search.set(key, String(value));
    }
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

export function listBooks(filters, signal) {
  return request(`/books${buildQuery(filters)}`, { signal });
}

export function getStats(signal) {
  return request("/stats", { signal });
}

export function createBook(book) {
  return request("/books", { method: "POST", body: book });
}

export function replaceBook(id, book) {
  return request(`/books/${id}`, { method: "PUT", body: book });
}

export function patchBook(id, changes) {
  return request(`/books/${id}`, { method: "PATCH", body: changes });
}

export function deleteBook(id) {
  return request(`/books/${id}`, { method: "DELETE" });
}
