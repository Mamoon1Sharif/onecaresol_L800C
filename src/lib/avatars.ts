import cg1 from "@/assets/avatars/cg-1.jpg";
import cg2 from "@/assets/avatars/cg-2.jpg";
import cg3 from "@/assets/avatars/cg-3.jpg";
import cg4 from "@/assets/avatars/cg-4.jpg";
import cg5 from "@/assets/avatars/cg-5.jpg";
import cr1 from "@/assets/avatars/cr-1.jpg";
import cr2 from "@/assets/avatars/cr-2.jpg";
import cr3 from "@/assets/avatars/cr-3.jpg";
import cr4 from "@/assets/avatars/cr-4.jpg";
import cr5 from "@/assets/avatars/cr-5.jpg";

const cgAvatars = [cg1, cg2, cg3, cg4, cg5];
const crAvatars = [cr1, cr2, cr3, cr4, cr5];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function getCareGiverAvatar(id: string, override?: string | null): string {
  if (override) return override;
  return cgAvatars[hashStr(id) % cgAvatars.length];
}

const HEART_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;

export function getCareReceiverAvatar(id: string, override?: string | null): string {
  if (override) return override;
  return HEART_SVG;
}
