import { motion } from "framer-motion";
import { Aperture } from "lucide-react";

export default function Logo({ large = false }) {
  return (
    <span className={`logo ${large ? "logo-large" : ""}`}>
      <motion.span
        className="logo-mark"
        whileHover={{ rotate: 120, scale: 1.08 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
      >
        <Aperture size={large ? 26 : 20} strokeWidth={2.2} />
      </motion.span>
      <span className="logo-text">Snapshare</span>
    </span>
  );
}
