export type GuestCartLine = { listingId: number; title: string; priceKobo: number; quantity: number; imageUrl?: string };

const KEY = "esut-marketplace-guest-cart";

export function readGuestCart(): GuestCartLine[] {
  try { const raw = localStorage.getItem(KEY); const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed.filter(line => Number.isInteger(line?.listingId) && Number.isInteger(line?.quantity) && line.quantity > 0).slice(0, 50) : []; } catch { return []; }
}
function write(lines: GuestCartLine[]) { try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch {} return lines; }
export function replaceGuestCart(lines: GuestCartLine[]) { return write(lines.slice(0, 50)); }
export function addGuestCartLine(line: GuestCartLine) { const current = readGuestCart(); const existing = current.findIndex(item => item.listingId === line.listingId); if (existing >= 0) current[existing] = { ...current[existing], quantity: Math.min(25, current[existing].quantity + line.quantity), title: line.title, priceKobo: line.priceKobo, imageUrl: line.imageUrl }; else current.push({ ...line, quantity: Math.min(25, Math.max(1, line.quantity)) }); return write(current); }
export function setGuestCartQuantity(listingId: number, quantity: number) { const next = readGuestCart().flatMap(line => line.listingId === listingId ? quantity > 0 ? [{ ...line, quantity: Math.min(25, quantity) }] : [] : [line]); return write(next); }
export function removeGuestCartLine(listingId: number) { return write(readGuestCart().filter(line => line.listingId !== listingId)); }
export function clearGuestCart() { try { localStorage.removeItem(KEY); } catch {} }
