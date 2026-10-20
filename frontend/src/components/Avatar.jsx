import { avatarGradient } from "../utils";

export default function Avatar({ email, size = 32 }) {
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.42, background: avatarGradient(email) }}
      aria-hidden="true"
    >
      {(email?.[0] || "?").toUpperCase()}
    </span>
  );
}
