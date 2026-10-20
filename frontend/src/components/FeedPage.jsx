import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, RefreshCw } from "lucide-react";
import { api } from "../api";
import { displayName } from "../utils";
import Button, { IconButton } from "./Button.jsx";
import Header from "./Header.jsx";
import Lightbox from "./Lightbox.jsx";
import PostCard from "./PostCard.jsx";
import Tabs from "./Tabs.jsx";
import UploadModal from "./UploadModal.jsx";
import { useToast } from "./Toasts.jsx";

const FILTERS = [
  { id: "all", label: "Everyone" },
  { id: "mine", label: "My posts" },
];

export default function FeedPage({ token, user, onLogout }) {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const notify = useToast();

  const handleError = useCallback(
    (err) => {
      notify(err.message, "error");
      if (err.status === 401) onLogout();
    },
    [notify, onLogout]
  );

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setPosts(await api.feed(token));
      setStatus("ready");
    } catch (err) {
      setStatus((s) => (s === "loading" ? "error" : s));
      handleError(err);
    } finally {
      setRefreshing(false);
    }
  }, [token, handleError]);

  useEffect(() => {
    load();
  }, [load]);

  // Stop the page behind a modal from scrolling.
  useEffect(() => {
    document.body.style.overflow = uploadOpen || activeId ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [uploadOpen, activeId]);

  async function deletePost(post) {
    try {
      await api.deletePost(token, post.id);
      setPosts((ps) => ps.filter((p) => p.id !== post.id));
      notify("Post deleted");
    } catch (err) {
      handleError(err);
      throw err;
    }
  }

  const visible = filter === "mine" ? posts.filter((p) => p.is_owner) : posts;
  const myCount = posts.filter((p) => p.is_owner).length;

  return (
    <div className="app">
      <Header user={user} onUpload={() => setUploadOpen(true)} onLogout={onLogout} />

      <main className="feed">
        <div className="feed-top">
          <div>
            <h1>
              Hey {displayName(user.email)} <span className="wave">👋</span>
            </h1>
            <p className="muted">
              {posts.length} {posts.length === 1 ? "post" : "posts"} in the feed · {myCount} by you
            </p>
          </div>
          <div className="feed-controls">
            <Tabs options={FILTERS} value={filter} onChange={setFilter} small />
            <IconButton label="Refresh feed" onClick={load} disabled={refreshing}>
              <RefreshCw size={18} className={refreshing ? "spin" : ""} />
            </IconButton>
          </div>
        </div>

        {status === "loading" ? (
          <div className="grid">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="card skeleton" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        ) : status === "error" ? (
          <div className="state-card">
            <h2>Couldn't load the feed</h2>
            <p className="muted">Check that the backend is running, then try again.</p>
            <Button onClick={load}>
              <RefreshCw size={16} /> Retry
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <motion.div className="state-card empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <motion.span
              className="empty-icon"
              animate={{ rotate: [0, -8, 8, 0], y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <ImagePlus size={36} />
            </motion.span>
            <h2>{filter === "mine" ? "You haven't posted yet" : "The feed is empty"}</h2>
            <p className="muted">Share a photo or video. It'll show up here for everyone.</p>
            <Button onClick={() => setUploadOpen(true)}>
              <ImagePlus size={18} /> Create the first post
            </Button>
          </motion.div>
        ) : (
          <motion.div layout className="grid">
            <AnimatePresence mode="popLayout">
              {visible.map((post, i) => (
                <PostCard key={post.id} post={post} index={i} onOpen={() => setActiveId(post.id)} onDelete={deletePost} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {uploadOpen && (
          <UploadModal
            token={token}
            onClose={() => setUploadOpen(false)}
            onUploaded={(post) => {
              setPosts((ps) => [post, ...ps]);
              notify("Posted! Your upload is live.");
            }}
            onAuthError={(err) => {
              setUploadOpen(false);
              handleError(err);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeId && <Lightbox posts={visible} activeId={activeId} onClose={() => setActiveId(null)} onNavigate={setActiveId} />}
      </AnimatePresence>
    </div>
  );
}
