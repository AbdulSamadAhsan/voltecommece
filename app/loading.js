export default function Loading() {
  return (
    <div className="container page" aria-label="Loading products" role="status">
      <div className="skeleton" style={{ minHeight: 100, marginBottom: 30 }} />
      <div className="product-grid">
        {[1, 2, 3, 4].map((i) => (
          <div className="skeleton" key={i} />
        ))}
      </div>
    </div>
  );
}
