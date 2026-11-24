import BookItem from "./BookItem.jsx";

// books === null means "nothing loaded yet"
export default function BookList({ books, loading, error, busyId, onToggleRead, onRate, onEdit, onDelete }) {
  if (error) return <p role="alert">Could not load books: {error}</p>;
  if (books === null) return <p>Loading books...</p>;
  if (books.length === 0) return <p>No books match your filters.</p>;

  return (
    <>
      {loading && <p className="updating">Updating...</p>}
      <ul className="book-list">
        {books.map((book) => (
          <BookItem
            key={book.id}
            book={book}
            busy={busyId === book.id}
            onToggleRead={onToggleRead}
            onRate={onRate}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </>
  );
}
