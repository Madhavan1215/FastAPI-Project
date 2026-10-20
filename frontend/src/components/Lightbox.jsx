import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { imageUrl } from "../api";
import { displayName, timeAgo } from "../utils";
import Avatar from "./Avatar.jsx";
import { IconButton } from "./Button.jsx";

export default function Lightbox({ posts, activeId, onClose, onNavigate }) {
  const index = posts.findIndex((p) => p.id === activeId);
  const post = posts[index];
  const [direction, setDirection] = useState(0);

  function go(step) {
    const next = posts[index + step];
    if (!next) return;
    setDirection(step);
    onNavigate(next.id);
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  if (!post) return null;

  return (
    <motion.div
      className="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="lightbox glass"
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lightbox-media">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={post.id}
              className="lightbox-slide"
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -60 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {post.file_type === "video" ? (
                <video src={post.url} controls autoPlay playsInline />
              ) : (
                <img src={imageUrl(post.url, "w-1600,q-90")} alt={post.caption || post.file_name} />
              )}
            </motion.div>
          </AnimatePresence>

          {index > 0 && (
            <IconButton className="nav-btn nav-prev" label="Previous" onClick={() => go(-1)}>
              <ChevronLeft size={22} />
            </IconButton>
          )}
          {index < posts.length - 1 && (
            <IconButton className="nav-btn nav-next" label="Next" onClick={() => go(1)}>
              <ChevronRight size={22} />
            </IconButton>
          )}
        </div>

        <aside className="lightbox-info">
          <div className="card-meta">
            <Avatar email={post.email} size={40} />
            <div className="card-author">
              <span className="author">
                {displayName(post.email)}
                {post.is_owner && <span className="you-badge">You</span>}
              </span>
              <span className="time">{timeAgo(post.created_at)}</span>
            </div>
          </div>
          {post.caption ? <p className="lightbox-caption">{post.caption}</p> : <p className="muted small">No caption</p>}
          <div className="lightbox-footer">
            <span className="muted small file-name" title={post.file_name}>{post.file_name}</span>
            <a className="link" href={post.url} target="_blank" rel="noreferrer">
              Open original <ExternalLink size={14} />
            </a>
          </div>
        </aside>

        <IconButton className="close-btn" label="Close" onClick={onClose}>
          <X size={20} />
        </IconButton>
      </motion.div>
    </motion.div>
  );
}
