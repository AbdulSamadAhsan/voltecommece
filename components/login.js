"use client";
import { useState } from "react";
import { PasswordField } from "./password-field";
import { signIn, signOut } from "next-auth/react";
export default function Login({ admin = false }) {
  const [register, setRegister] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (register) {
        const r = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await r.json();
        if (!r.ok) throw Error(result.error);
      }
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error)
        throw Error("Unable to sign in. Check your email and password.");
      if (admin) {
        const check = await fetch("/api/account");
        const account = await check.json();
        if (account.user?.role !== "admin") {
          await signOut({ redirect: false });
          throw Error("Administrator access is required.");
        }
      }
      window.location.assign(admin ? "/admin" : "/account");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container page">
      <div className="panel auth-panel">
        <span className="eyebrow">
          {admin ? "STORE ADMINISTRATION" : "YOUR WORLD, CONNECTED"}
        </span>
        <h1>
          {admin
            ? "Admin sign in."
            : register
              ? "Make yourself at home."
              : "Welcome back."}
        </h1>
        <form onSubmit={submit} className="form">
          {register && (
            <label>
              Name
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={80}
              />
            </label>
          )}
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
          <PasswordField
            autoComplete={register ? "new-password" : "current-password"}
          />
          <p className="small">Use at least 12 characters.</p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <button className="btn" disabled={busy}>
            {busy ? "One moment…" : register ? "Create account" : "Sign in"}
          </button>
        </form>
        {!admin && (
          <button
            className="text-link"
            style={{ background: "none", border: 0, marginTop: 20 }}
            onClick={() => {
              setRegister(!register);
              setError("");
            }}
          >
            {register
              ? "Already part of the everyday? Sign in"
              : "New here? Create an account"}
          </button>
        )}
      </div>
    </div>
  );
}
