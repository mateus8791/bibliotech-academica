// src/state/cart.js
export const cart = {
  get() {
    try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; }
  },
  set(items) {
    localStorage.setItem('cart', JSON.stringify(items || []));
  },
  clear() { localStorage.removeItem('cart'); },
  total() {
    return this.get().reduce((sum, it) => sum + (it.price * it.qty), 0);
  }
};
