import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container page">
      <h1>A little off the grid.</h1>
      <p>We couldn’t find this page.</p>
      <Link className="btn" href="/shop">
        Explore the collection
      </Link>
    </div>
  );
}
