import { motion } from "framer-motion";

// Equal-width tabs with a pill that slides behind the active one.
// (The pill is always mounted and moved with `x`, instead of using framer's layoutId,
// which can stop a page from finishing its exit animation.)
export default function Tabs({ options, value, onChange, small = false }) {
  const index = Math.max(0, options.findIndex((o) => o.id === value));

  return (
    <div className={`tabs ${small ? "tabs-small" : ""}`} role="tablist" style={{ "--count": options.length }}>
      <motion.span
        className="tab-pill"
        initial={false}
        animate={{ x: `${index * 100}%` }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
      />
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          className={`tab ${value === o.id ? "active" : ""}`}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
