import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CloudUpload, RefreshCw, X } from "lucide-react";
import { api } from "../api";
import Button, { IconButton } from "./Button.jsx";

const MAX_BYTES = 50 * 1024 * 1024; // keep in sync with MAX_UPLOAD_BYTES in app/app.py
const CAPTION_LIMIT = 500;

function formatSize(bytes) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

export default function UploadModal({ token, onClose, onUploaded, onAuthError }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(null); // null = not uploading, 0..1 = upload progress
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const busy = progress !== null;

  // Free the preview's memory when it changes or the modal closes.
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  function pick(f) {
    if (!f) return;
    if (!/^(image|video)\//.test(f.type)) return setError("Only images and videos are supported.");
    if (f.size > MAX_BYTES) return setError(`That file is ${formatSize(f.size)}. The limit is 50 MB.`);
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file || busy) return;
    setError("");
    setProgress(0);
    try {
      const post = await api.upload(token, file, caption, setProgress);
      setDone(true);
      onUploaded(post);
      setTimeout(onClose, 1100);
    } catch (err) {
      setProgress(null);
      if (err.status === 401) onAuthError(err);
      else setError(err.message);
    }
  }

  const status = done ? "Posted!" : progress === null ? null : progress < 1 ? `Uploading… ${Math.round(progress * 100)}%` : "Saving to ImageKit…";

  return (
    <motion.div
      className="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => !busy && onClose()}
    >
      <motion.form
        className="modal glass"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-title"
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
      >
        <div className="modal-head">
          <h2 id="upload-title">New post</h2>
          <IconButton label="Close" type="button" onClick={onClose} disabled={busy}>
            <X size={20} />
          </IconButton>
        </div>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              className="upload-success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
            >
              <svg viewBox="0 0 52 52" className="success-check">
                <motion.circle
                  cx="26" cy="26" r="24" fill="none" strokeWidth="3"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }}
                />
                <motion.path
                  d="M15 27 l7 7 l15 -15" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4, duration: 0.35 }}
                />
              </svg>
              <p>Your post is live</p>
            </motion.div>
          ) : !file ? (
            <motion.div
              key="drop"
              className={`dropzone ${dragging ? "dragging" : ""}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, scale: dragging ? 1.02 : 1 }}
              exit={{ opacity: 0, y: -10 }}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                pick(e.dataTransfer.files[0]);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
            >
              <motion.span
                className="drop-icon"
                animate={{ y: dragging ? -8 : [0, -6, 0] }}
                transition={dragging ? { type: "spring" } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <CloudUpload size={34} />
              </motion.span>
              <p className="drop-title">{dragging ? "Drop it!" : "Drag a photo or video here"}</p>
              <p className="muted small">
                or <span className="link">browse your files</span> · up to 50 MB
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              className="preview"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
            >
              {file.type.startsWith("video/") ? (
                <video src={preview} muted autoPlay loop playsInline />
              ) : (
                <img src={preview} alt="Selected file preview" />
              )}
              <div className="preview-bar">
                <span className="file-name" title={file.name}>
                  {file.name} · {formatSize(file.size)}
                </span>
                {!busy && (
                  <button type="button" className="chip" onClick={() => inputRef.current?.click()}>
                    <RefreshCw size={13} /> Change
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          hidden
          onChange={(e) => {
            pick(e.target.files[0]);
            e.target.value = "";
          }}
        />

        {!done && (
          <>
            <label className="caption-field">
              <textarea
                placeholder="Write a caption…"
                value={caption}
                maxLength={CAPTION_LIMIT}
                rows={3}
                disabled={busy}
                onChange={(e) => setCaption(e.target.value)}
              />
              <span className="counter">
                {caption.length}/{CAPTION_LIMIT}
              </span>
            </label>

            <AnimatePresence>
              {error && (
                <motion.p className="form-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {busy && (
              <div className="progress" aria-label={status}>
                <motion.span
                  className={`progress-fill ${progress >= 1 ? "indeterminate" : ""}`}
                  animate={{ width: `${Math.max(progress, 0.03) * 100}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>
            )}

            <div className="modal-actions">
              <span className="muted small">{status}</span>
              <Button type="submit" disabled={!file || busy}>
                {busy ? "Posting…" : "Share post"}
              </Button>
            </div>
          </>
        )}
      </motion.form>
    </motion.div>
  );
}
