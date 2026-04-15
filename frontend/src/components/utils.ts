export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN");
}

export function formatDelta(points: number) {
  return `${points >= 0 ? "+" : ""}${points}`;
}

export function extractLocation(geoTag: string) {
  if (geoTag.toLowerCase().includes("chembur")) return "Chembur";
  if (geoTag.toLowerCase().includes("vidyavihar")) return "Vidyavihar";
  return "Chembur/Vidyavihar";
}
