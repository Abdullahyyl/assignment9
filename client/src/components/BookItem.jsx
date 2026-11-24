export default function BookItem({ book, busy, onToggleRead, onRate, onEdit, onDelete }) {
  return (
    <li className={`book${busy ? " busy" : ""}`}>
      <div className="book-main">
        <strong>{book.title}</strong> <span>by {book.author}</span>
        <div className="meta">
          {book.year} - {book.genre}
        </div>
      </div>

      <label>
        <input
          type="checkbox"
          checked={book.read}
          disabled={busy}
          onChange={() => onToggleRead(book)}
        />
        Read
      </label>

      <label>
        Rating
        <select
          value={book.rating ?? ""}
          disabled={busy || !book.read}
          onChange={(e) => onRate(book, e.target.value)}
        >
          <option value="">-</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <button type="button" disabled={busy} onClick={() => onEdit(book)}>
        Edit
      </button>
      <button type="button" disabled={busy} onClick={() => onDelete(book)}>
        Delete
      </button>
    </li>
  );
}
