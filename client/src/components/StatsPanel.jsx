export default function StatsPanel({ stats, error }) {
  if (error) return <aside className="stats" role="alert">Stats unavailable: {error}</aside>;
  if (!stats) return <aside className="stats">Loading statistics...</aside>;

  return (
    <aside className="stats">
      <h2>Statistics</h2>
      <p>Total: {stats.total}</p>
      <p>Read: {stats.read}</p>
      <p>Unread: {stats.unread}</p>
      <p>Average rating: {stats.averageRating ?? "no ratings yet"}</p>
      <h3>By genre</h3>
      <ul>
        {Object.entries(stats.byGenre).map(([genre, count]) => (
          <li key={genre}>
            {genre}: {count}
          </li>
        ))}
      </ul>
    </aside>
  );
}
