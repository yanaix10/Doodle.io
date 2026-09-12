export const AVATAR_COLORS = [
  "#6366f1", // Indigo
  "#ec4899", // Pink
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#8b5cf6", // Purple
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#14b8a6", // Teal
  "#f97316"  // Orange
];

export const TOTAL_EYES = 6;
export const TOTAL_MOUTHS = 6;
export const TOTAL_HATS = 5;

export function getRandomAvatar() {
  return {
    color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    eyes: Math.floor(Math.random() * TOTAL_EYES),
    mouth: Math.floor(Math.random() * TOTAL_MOUTHS),
    hat: Math.floor(Math.random() * TOTAL_HATS)
  };
}
