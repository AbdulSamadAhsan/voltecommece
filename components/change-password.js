"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { PasswordField } from "./password-field";
export function ChangePassword({ admin = false }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setError("");
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (values.newPassword !== values.confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw Error(data.error);
      await signOut({
        callbackUrl: (admin ? "/admin/login" : "/login") + "?password=changed",
      });
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  return (
    <form className="panel form" onSubmit={submit}>
      <h2>Password & security</h2>
      <p className="small">
        Choose at least 12 characters. Changing your password signs out all
        sessions.
      </p>
      <PasswordField
        label="Current password"
        name="currentPassword"
        minLength={1}
      />
      <PasswordField
        label="New password"
        name="newPassword"
        autoComplete="new-password"
      />
      <PasswordField
        label="Confirm new password"
        name="confirmPassword"
        autoComplete="new-password"
      />
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button className="btn" disabled={busy}>
        {busy ? "Updating password…" : "Change password"}
      </button>
    </form>
  );
}
