import { useEffect, useState } from "react";
import { listBooks, createBook, replaceBook } from "./api/books.js";
import Filters from "./components/Filters.jsx";
import BookList from "./components/BookList.jsx";
import BookForm from "./components/BookForm.jsx";

const INITIAL_FILTERS = { q: "", genre: "", read: "", sort: "", order: "asc" };

export default function App() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [books, setBooks] = useState(null); // null = not loaded yet
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  // bumped after every confirmed change so the list is requested again
  const [reloadKey, setReloadKey] = useState(0);

  const [editing, setEditing] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

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
  }, [filters, reloadKey]);

  const refresh = () => setReloadKey((key) => key + 1);

  // The screen only changes after the server has confirmed: we wait for the
  // request, then ask the server for fresh data.
  async function handleFormSubmit(data) {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editing) {
        await replaceBook(editing.id, data); // PUT: complete replacement
        setEditing(null);
      } else {
        await createBook(data);
      }
      setFormKey((key) => key + 1);
      refresh();
    } catch (error) {
      setFormError(error.message); // the server's own message
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(book) {
    setFormError(null);
    setEditing(book);
    setFormKey((key) => key + 1);
  }

  function handleCancelEdit() {
    setEditing(null);
    setFormError(null);
    setFormKey((key) => key + 1);
  }

  return (
    <div className="app">
      <h1>Reading List</h1>
      <Filters filters={filters} onChange={setFilters} />
      <BookList books={books} loading={loading} error={loadError} onEdit={handleEdit} />
      <BookForm
        key={formKey}
        book={editing}
        submitting={submitting}
        error={formError}
        onSubmit={handleFormSubmit}
        onCancel={handleCancelEdit}
      />
    </div>
  );
}
