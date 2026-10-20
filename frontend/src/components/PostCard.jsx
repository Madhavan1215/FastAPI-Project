import { forwardRef, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Play, Trash2 } from "lucide-react";
import { imageUrl } from "../api";
import { displayName, timeAgo } from "../utils";
import Avatar from "./Avatar.jsx";
import Button, { IconButton, Spinner } from "./Button.jsx";

// forwardRef lets AnimatePresence (mode="popLayout") measure the card while it animates out.
const PostCard = forwardRef(function PostCard({ post, index, onOpen, onDelete }, ref) {
  const [loaded, setLoaded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const videoRef = useRef(null);
  const isVideo = post.file_type === "video";

  async function confirmDelete() {
    setDeleting(true);
    try {
      await onDelete(post);
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <motion.article
      ref={ref}
      layout
      className="card"
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 260, damping: 24, delay: Math.min(index, 12) * 0.05 },
      }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.25 } }}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      onMouseEnter={() => videoRef.current?.play().catch(() => {})}
      onMouseLeave={() => {
        const v = videoRef.current;
        if (v) {
          v.pause();
          v.currentTime = 0;
        }
      }}
    >
      <button className="card-media" onClick={onOpen} aria-label="Open post">
        {isVideo ? (
          <video
            ref={videoRef}
            src={post.url}
            muted
            loop
            playsInline
            preload="metadata"
            onLoadedData={() => setLoaded(true)}
            className={`media ${loaded ? "loaded" : ""}`}
          />
        ) : (
          <>
            {/* A tiny blurred copy from ImageKit shows instantly while the real image loads */}
            <img className="media-placeholder" src={imageUrl(post.url, "w-40,bl-20,q-30")} alt="" aria-hidden="true" />
            <img
              src={imageUrl(post.url, "w-700,h-875,fo-auto")}
              alt={post.caption || post.file_name}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              className={`media ${loaded ? "loaded" : ""}`}
            />
          </>
        )}
        {isVideo && (
          <span className="media-badge">
            <Play size={12} fill="currentColor" /> Video
          </span>
        )}
        <span className="card-zoom">
          <Maximize2 size={18} />
        </span>
      </button>

      <div className="card-body">
        {post.caption && <p className="caption">{post.caption}</p>}
        <div className="card-meta">
          <Avatar email={post.email} size={30} />
          <div className="card-author">
            <span className="author">
              {displayName(post.email)}
              {post.is_owner && <span className="you-badge">You</span>}
            </span>
            <span className="time">{timeAgo(post.created_at)}</span>
          </div>
          {post.is_owner && (
            <IconButton className="danger" label="Delete post" onClick={() => setConfirming(true)}>
              <Trash2 size={17} />
            </IconButton>
          )}
        </div>
      </div>

      <AnimatePresence>
        {confirming && (
          <motion.div
            className="confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="confirm-box"
              initial={{ scale: 0.85, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 6 }}
              transition={{ type: "spring", stiffness: 400, damping: 26 }}
            >
              <Trash2 size={26} className="confirm-icon" />
              <p>Delete this post?</p>
              <span className="muted small">It's removed from ImageKit too.</span>
              <div className="row">
                <Button variant="ghost" onClick={() => setConfirming(false)} disabled={deleting}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
                  {deleting ? <Spinner size={16} /> : "Delete"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
});

export default PostCard;
