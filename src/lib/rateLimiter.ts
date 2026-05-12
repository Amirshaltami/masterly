type Entry = { count: number; expiresAt: number };

const store = new Map<string, Entry>();

export function increment(key: string, ttlSeconds = 300) {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.expiresAt < now) {
    store.set(key, { count: 1, expiresAt: now + ttlSeconds * 1000 });
    return 1;
  }
  entry.count += 1;
  store.set(key, entry);
  return entry.count;
}

export function getCount(key: string) {
  const entry = store.get(key);
  if (!entry || entry.expiresAt < Date.now()) return 0;
  return entry.count;
}

export function reset(key: string) {
  store.delete(key);
}

export function isBlocked(key: string, maxAttempts = 5) {
  return getCount(key) >= maxAttempts;
}
