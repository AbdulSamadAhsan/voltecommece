"use client";
import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
export function PasswordField({
  label = "Password",
  name = "password",
  autoComplete = "current-password",
  minLength = 12,
}) {
  const [show, setShow] = useState(false);
  const fieldId = useId();
  return (
    <div className="password-control">
      <label htmlFor={fieldId}>{label}</label>
      <span className="password-field">
        <input
          id={fieldId}
          name={name}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={128}
          required
        />
        <button
          type="button"
          aria-label={`${show ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={show}
          onClick={() => setShow(!show)}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </div>
  );
}
