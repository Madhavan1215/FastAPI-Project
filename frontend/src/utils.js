export function displayName(email = "") {
  return email.split("@")[0];
}

export function timeAgo(iso) {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  const steps = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [7, "d"],
  ];
  if (seconds < 30) return "just now";
  let value = seconds;
  for (const [size, unit] of steps) {
    if (value < size) return `${Math.floor(value)}${unit} ago`;
    value /= size;
  }
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// Same email always gets the same avatar colours.
export function avatarGradient(email = "") {
  let hash = 0;
  for (const ch of email) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = hash % 360;
  return `linear-gradient(135deg, hsl(${hue} 85% 62%), hsl(${(hue + 50) % 360} 85% 55%))`;
}
