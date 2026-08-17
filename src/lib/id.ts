/** Identifiant local court, suffisant pour une app mono-utilisateur sans backend. */
export function generateId(prefix = 'e'): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${random}`;
}
