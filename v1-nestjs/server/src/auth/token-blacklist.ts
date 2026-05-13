// In-memory token blacklist placeholder
// In production, replace with Redis-backed implementation
const tokenBlacklist: Set<string> = new Set();

export function addToBlacklist(token: string): void {
  tokenBlacklist.add(token);
}

export function isTokenBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token);
}

export function resetBlacklist(): void {
  tokenBlacklist.clear();
}
