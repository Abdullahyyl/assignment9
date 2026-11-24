import { useState } from "react";
import { GENRES } from "./Filters.jsx";

// Used for both adding (book = null, POST) and editing (book given, PUT).
// The parent gives it a different `key` for each book so the fields reset.
export default function BookForm({ book, submitting, error, onSubmit, onCancel }) {
  const [title, setTitle] = useState(book?.title ?? "");
  const [author, setAuthor] = useState(book?.author ?? "");
  const [year, setYear] = useState(book ? String(book.year) : "");
  const [genre, setGenre] = useState(book?.genre ?? "fiction");
  const [read, setRead] = useState(book?.read ?? false);
  const [rating, setRating] = useState(book?.rating ? String(book.rating) : "");

  function handleSubmit(event) {
    event.preventDefault();
    // no client-side validation of the values: the server decides and explains
    onSubmit({
      title,
      author,
      year: year === "" ? null : Number(year),
      genre,
      read,
      rating: read && rating !== "" ? Number(rating) : null,
    });
  }

  function handleReadChange(checked) {
    setRead(checked);
    if (!checked) setRating(""); // a rating needs read = true
  }

  return (
    <form className="book-form" onSubmit={handleSubmit}>
      <h2>{book ? `Edit "${book.title}"` : "Add a book"}</h2>
      <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input placeholder="Author" value={author} onChange={(e) => setAuthor(e.target.value)} />
      <input
        type="number"
        placeholder="Year"
        value={year}
        onChange={(e) => setYear(e.target.value)}
      />
      <select value={genre} onChange={(e) => setGenre(e.target.value)}>
        {GENRES.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
      <label>
        <input
          type="checkbox"
          checked={read}
          onChange={(e) => handleReadChange(e.target.checked)}
        />
        Read
      </label>
      <select value={rating} disabled={!read} onChange={(e) => setRating(e.target.value)}>
        <option value="">No rating</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      {error && <p role="alert">{error}</p>}

      <div className="form-buttons">
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : book ? "Save changes" : "Add book"}
        </button>
        {book && (
          <button type="button" disabled={submitting} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
