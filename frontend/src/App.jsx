import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, ServerCrash } from "lucide-react";
import { api } from "./api";
import AuthPage from "./components/AuthPage.jsx";
import FeedPage from "./components/FeedPage.jsx";
import Button, { Spinner } from "./components/Button.jsx";

const TOKEN_KEY = "snapshare_token";

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable (e.g. private mode): the session just won't survive a refresh
  }
}

const page = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

export default function App() {
  const [token, setToken] = useState(readToken);
  const [user, setUser] = useState(null);
  const [bootError, setBootError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const login = useCallback((newToken) => {
    writeToken(newToken);
    setBootError("");
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    writeToken(null);
    setUser(null);
    setToken(null);
  }, []);

  // Whenever we have a token, ask the backend who it belongs to.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setBootError("");
    api
      .me(token)
      .then((u) => !cancelled && setUser(u))
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 401) logout();
        else setBootError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [token, logout, attempt]);

  // Only two top-level views ("auth" and "app") so the page transition runs once per login/logout.
  let content;
  if (bootError) {
    content = (
      <div className="center-screen">
        <div className="state-card">
          <ServerCrash size={40} className="state-icon" />
          <h2>Server unreachable</h2>
          <p>{bootError}</p>
          <div className="row">
            <Button variant="ghost" onClick={logout}>Log out</Button>
            <Button onClick={() => setAttempt((a) => a + 1)}>
              <RefreshCw size={16} /> Try again
            </Button>
          </div>
        </div>
      </div>
    );
  } else if (!user) {
    content = (
      <div className="center-screen">
        <Spinner size={36} />
      </div>
    );
  } else {
    content = <FeedPage token={token} user={user} onLogout={logout} />;
  }

  const view = token ? (
    <motion.div key="app" {...page}>
      {content}
    </motion.div>
  ) : (
    <motion.div key="auth" {...page}>
      <AuthPage onAuthenticated={login} />
    </motion.div>
  );

  return (
    <>
      <div className="bg" aria-hidden="true">
        <span className="blob blob-1" />
        <span className="blob blob-2" />
        <span className="blob blob-3" />
      </div>
      <AnimatePresence mode="wait">{view}</AnimatePresence>
    </>
  );
}
