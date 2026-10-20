import { useState } from "react";
import { motion } from "framer-motion";

// A button that springs on hover/press and sends a ripple out from where you click.
export default function Button({ children, variant = "primary", className = "", onPointerDown, disabled, ...props }) {
  const [ripples, setRipples] = useState([]);

  function addRipple(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const id = performance.now() + Math.random();
    setRipples((r) => [...r, { id, x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size }]);
    setTimeout(() => setRipples((r) => r.filter((ripple) => ripple.id !== id)), 650);
    onPointerDown?.(e);
  }

  return (
    <motion.button
      className={`btn btn-${variant} ${className}`}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      onPointerDown={disabled ? undefined : addRipple}
      disabled={disabled}
      {...props}
    >
      <span className="btn-content">{children}</span>
      {ripples.map((r) => (
        <span key={r.id} className="ripple" style={{ left: r.x, top: r.y, width: r.size, height: r.size }} />
      ))}
    </motion.button>
  );
}

export function IconButton({ children, className = "", label, ...props }) {
  return (
    <motion.button
      className={`icon-btn ${className}`}
      aria-label={label}
      title={label}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.88 }}
      transition={{ type: "spring", stiffness: 500, damping: 20 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function Spinner({ size = 18 }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-label="Loading" />;
}
