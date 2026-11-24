export default function BookItem({ book, onEdit }) {
  return (
    <li className="book">
      <div className="book-main">
        <strong>{book.title}</strong> <span>by {book.author}</span>
        <div className="meta">
          {book.year} - {book.genre}
        </div>
      </div>
      <span>{book.read ? "Read" : "Unread"}</span>
      <span>Rating: {book.rating ?? "-"}</span>
      <button type="button" onClick={() => onEdit(book)}>
        Edit
      </button>
    </li>
  );
}
