import { useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Film, Heart, Image, Lock, Mail, Sparkles } from "lucide-react";
import { api } from "../api";
import Button, { Spinner } from "./Button.jsx";
import Logo from "./Logo.jsx";
import Tabs from "./Tabs.jsx";
import { useToast } from "./Toasts.jsx";

const MODES = [
  { id: "login", label: "Log in" },
  { id: "register", label: "Sign up" },
];

const FLOATING = [
  { icon: Image, label: "sunset.jpg", className: "float-1", delay: 0 },
  { icon: Film, label: "trip.mp4", className: "float-2", delay: 0.6 },
  { icon: Heart, label: "shared with you", className: "float-3", delay: 1.2 },
];

function Field({ icon: Icon, label, right, ...inputProps }) {
  return (
    <label className="field">
      <Icon size={18} className="field-icon" />
      <input placeholder=" " {...inputProps} />
      <span className="field-label">{label}</span>
      {right}
    </label>
  );
}

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const shake = useAnimationControls();
  const notify = useToast();

  function fail(message) {
    setError(message);
    shake.start({ x: [0, -12, 12, -8, 8, -4, 0], transition: { duration: 0.45 } });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (mode === "register" && password.length < 6) {
      fail("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "register") await api.register(email.trim(), password);
      const token = await api.login(email.trim(), password);
      notify(mode === "register" ? "Account created. Welcome to Snapshare!" : "Welcome back!");
      onAuthenticated(token);
    } catch (err) {
      fail(err.message);
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <Logo large />
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          Share moments, <span className="gradient-text">beautifully.</span>
        </motion.h1>
        <motion.p
          className="muted"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          Upload photos and videos, see what everyone else is posting, and keep your feed tidy.
        </motion.p>

        <div className="floating-stage" aria-hidden="true">
          {FLOATING.map(({ icon: Icon, label, className, delay }) => (
            <motion.div
              key={label}
              className={`floating-card ${className}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, y: [0, -14, 0] }}
              transition={{
                opacity: { delay: 0.3 + delay / 2 },
                scale: { delay: 0.3 + delay / 2, type: "spring" },
                y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay },
              }}
              whileHover={{ scale: 1.06, rotate: -2 }}
            >
              <span className="floating-icon">
                <Icon size={18} />
              </span>
              {label}
            </motion.div>
          ))}
        </div>
      </section>

      <motion.section
        className="auth-card glass"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 24 }}
      >
        <Tabs
          options={MODES}
          value={mode}
          onChange={(id) => {
            setMode(id);
            setError("");
          }}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: mode === "login" ? -16 : 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === "login" ? 16 : -16 }}
            transition={{ duration: 0.2 }}
          >
            <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
            <p className="muted small">
              {mode === "login" ? "Log in to see your feed." : "It takes ten seconds. No email verification needed."}
            </p>
          </motion.div>
        </AnimatePresence>

        <motion.form onSubmit={handleSubmit} animate={shake} className="auth-form">
          <Field
            icon={Mail}
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            icon={Lock}
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            right={
              <button
                type="button"
                className="field-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <AnimatePresence>
            {error && (
              <motion.p
                className="form-error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <Button type="submit" className="btn-block" disabled={loading}>
            {loading ? (
              <Spinner />
            ) : (
              <>
                {mode === "login" ? "Log in" : "Create account"}
                <ArrowRight size={18} className="btn-arrow" />
              </>
            )}
          </Button>
        </motion.form>

        <p className="auth-footnote muted small">
          <Sparkles size={14} /> Powered by FastAPI + ImageKit
        </p>
      </motion.section>
    </main>
  );
}
