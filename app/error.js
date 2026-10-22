"use client";
export default function ErrorPage({ reset }) {
  return (
    <div className="container page">
      <h1>Let’s try that again.</h1>
      <p>The store is temporarily unavailable.</p>
      <button className="btn" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
