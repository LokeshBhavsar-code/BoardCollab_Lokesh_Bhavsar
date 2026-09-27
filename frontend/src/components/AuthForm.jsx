import { useState } from "react";
import { login, register } from "../api/auth.js";

function EyeIcon({ off }) {
  return off ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a20.4 20.4 0 0 1-3.22 4.5M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [fields, setFields] = useState({ email: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isRegister = mode === "register";

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await (isRegister ? register(fields) : login(fields));
      onAuthenticated({ token: result.token, user: result.user });
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || "Unable to authenticate. Check your details and try again.");
    } finally {
      setBusy(false);
    }
  }

  function updateField(event) {
    setFields((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  return (
    <main className="entry-layout">
      <section className="entry-intro">
        <span className="eyebrow">BOARD COLLAB</span>
        <h1>Make room<br />for good ideas.</h1>
        <p>A shared canvas for teams to think together, in real time.</p>
      </section>
      <form className="entry-form" onSubmit={submit}>
        <div className="form-heading">
          <span className="eyebrow">WORKSPACE ACCESS</span>
          <h2>{isRegister ? "Create your account" : "Welcome back"}</h2>
        </div>
        {isRegister && (
          <label>Username
            <input autoComplete="username" name="username" value={fields.username} onChange={updateField} minLength="3" maxLength="30" required />
          </label>
        )}
        <label>Email
          <input autoComplete="email" type="email" name="email" value={fields.email} onChange={updateField} required />
        </label>
        <label>Password
          <div className="password-field">
            <input
              autoComplete={isRegister ? "new-password" : "current-password"}
              type={showPassword ? "text" : "password"}
              name="password"
              value={fields.password}
              onChange={updateField}
              minLength={isRegister ? "8" : undefined}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon off={showPassword} />
            </button>
          </div>
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary form-submit" type="submit" disabled={busy}>
          {busy ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
        </button>
        <p className="form-switch">
          {isRegister ? "Already have an account?" : "New to BoardCollab?"}{" "}
          <button type="button" onClick={() => { setMode(isRegister ? "login" : "register"); setError(""); }}>
            {isRegister ? "Sign in" : "Create an account"}
          </button>
        </p>
      </form>
    </main>
  );
}