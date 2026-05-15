const store = new Map();

module.exports = {
  set(id, text, ttl = 5 * 60 * 1000) {
    store.set(id, { text: text.toLowerCase(), expireAt: Date.now() + ttl });
  },
  verify(id, input) {
    const entry = store.get(id);
    store.delete(id);
    if (!entry || Date.now() > entry.expireAt) return false;
    return entry.text === (input || '').toLowerCase();
  }
};
