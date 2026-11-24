import { useEffect, useState } from "react";
import {
  listBooks,
  getStats,
  createBook,
  replaceBook,
  patchBook,
  deleteBook,
} from "./api/books.js";
import Filters from "./components/Filters.jsx";
import BookList from "./components/BookList.jsx";
import BookForm from "./components/BookForm.jsx";
import StatsPanel from "./components/StatsPanel.jsx";

const INITIAL_FILTERS = { q: "", genre: "", read: "", sort: "", order: "asc" };

export default function App() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [books, setBooks] = useState(null); // null = not loaded yet
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(null);
  // bumped after every confirmed change so list and stats are requested again
  const [reloadKey, setReloadKey] = useState(0);

  const [editing, setEditing] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);

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

  // Statistics are requested again after every confirmed change (reloadKey)
  useEffect(() => {
    const controller = new AbortController();
    getStats(controller.signal)
      .then((data) => {
        setStats(data);
        setStatsError(null);
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setStatsError(error.message);
      });
    return () => controller.abort();
  }, [reloadKey]);

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

  async function runOnBook(book, action) {
    setBusyId(book.id);
    setActionError(null);
    try {
      await action();
      refresh();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setBusyId(null);
    }
  }

  // PATCH: only the changed fields. Unchecking "read" also clears the rating.
  function handleToggleRead(book) {
    const changes = book.read ? { read: false, rating: null } : { read: true };
    return runOnBook(book, () => patchBook(book.id, changes));
  }

  function handleRate(book, value) {
    const rating = value === "" ? null : Number(value);
    return runOnBook(book, () => patchBook(book.id, { rating }));
  }

  function handleDelete(book) {
    return runOnBook(book, async () => {
      await deleteBook(book.id);
      if (editing?.id === book.id) setEditing(null);
    });
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
      <StatsPanel stats={stats} error={statsError} />
      <Filters filters={filters} onChange={setFilters} />
      {actionError && <p role="alert">{actionError}</p>}
      <BookList
        books={books}
        loading={loading}
        error={loadError}
        busyId={busyId}
        onToggleRead={handleToggleRead}
        onRate={handleRate}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
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
