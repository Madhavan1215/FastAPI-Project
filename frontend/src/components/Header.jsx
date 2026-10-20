import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Plus } from "lucide-react";
import Avatar from "./Avatar.jsx";
import Button from "./Button.jsx";
import Logo from "./Logo.jsx";

export default function Header({ user, onUpload, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (e.type === "keydown" ? e.key === "Escape" : !menuRef.current?.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menuOpen]);

  return (
    <motion.header
      className="header glass"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
    >
      <Logo />
      <div className="header-actions">
        <Button onClick={onUpload} className="upload-btn">
          <Plus size={18} strokeWidth={2.5} />
          <span className="hide-sm">Upload</span>
        </Button>

        <div className="menu" ref={menuRef}>
          <motion.button
            className="avatar-btn"
            onClick={() => setMenuOpen((o) => !o)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Account menu"
            aria-expanded={menuOpen}
          >
            <Avatar email={user.email} size={38} />
          </motion.button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                className="menu-panel glass"
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.16 }}
              >
                <div className="menu-user">
                  <Avatar email={user.email} size={40} />
                  <div>
                    <span className="menu-label">Signed in as</span>
                    <span className="menu-email">{user.email}</span>
                  </div>
                </div>
                <button className="menu-item" onClick={onLogout}>
                  <LogOut size={16} /> Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}
