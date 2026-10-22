"use client";
import { createContext, useContext, useEffect, useState } from "react";
const Context = createContext();
export const useStore = () => useContext(Context);
export function StoreProvider({ children }) {
  const [cart, setCart] = useState([]),
    [wishlist, setWishlist] = useState([]),
    [ready, setReady] = useState(false),
    [notice, setNotice] = useState("");
  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem("volt-cart") || "[]");
      if (Array.isArray(c))
        setCart(
          c
            .filter(
              (x) => x.sku && Number.isInteger(x.quantity) && x.quantity > 0,
            )
            .slice(0, 30),
        );
      const w = JSON.parse(localStorage.getItem("volt-wishlist") || "[]");
      if (Array.isArray(w)) setWishlist(w);
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      localStorage.setItem("volt-cart", JSON.stringify(cart));
      localStorage.setItem("volt-wishlist", JSON.stringify(wishlist));
    }
  }, [cart, wishlist, ready]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);
  function add(item) {
    setCart((old) => {
      const found = old.find((x) => x.sku === item.sku);
      return found
        ? old.map((x) =>
            x.sku === item.sku
              ? { ...x, quantity: Math.min(10, x.quantity + 1) }
              : x,
          )
        : [...old, { ...item, quantity: 1 }];
    });
    setNotice("Added to your bag");
  }
  function wish(id) {
    setWishlist((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
    );
  }
  return (
    <Context.Provider
      value={{ cart, setCart, add, wishlist, wish, notify: setNotice, ready }}
    >
      {children}
      <div className="toast" role="status" aria-live="polite">
        {notice && <span>{notice}</span>}
      </div>
    </Context.Provider>
  );
}
