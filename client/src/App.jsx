import { useEffect, useState } from "react";
import { listBooks } from "./api/books.js";
import Filters from "./components/Filters.jsx";
import BookList from "./components/BookList.jsx";

const INITIAL_FILTERS = { q: "", genre: "", read: "", sort: "", order: "asc" };

export default function App() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [books, setBooks] = useState(null); // null = not loaded yet
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // A new request whenever a filter changes. The cleanup aborts the previous
  // request so an old response can never overwrite a newer one.
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    listBooks(filters, controller.signal)
      .then((data) => {
        setBooks(data);
        setLoading(false);
      })
      .catch((error) => {
        if (error.name === "AbortError") return; // cancelled on purpose
        setLoadError(error.message);
        setLoading(false);
      });
    return () => controller.abort();
  }, [filters]);

  return (
    <div className="app">
      <h1>Reading List</h1>
      <Filters filters={filters} onChange={setFilters} />
      <BookList books={books} loading={loading} error={loadError} />
    </div>
  );
}
