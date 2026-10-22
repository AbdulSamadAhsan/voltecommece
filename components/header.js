"use client";
import Link from "next/link";
import {
  Search,
  ShoppingBag,
  User,
  Sun,
  Moon,
  ArrowUpRight,
  Menu,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "./store-provider";
export function Header() {
  const { cart } = useStore();
  const [dark, setDark] = useState(false),
    [open, setOpen] = useState(false);
  useEffect(() => {
    const value = localStorage.getItem("volt-theme") === "dark";
    setDark(value);
    document.documentElement.classList.toggle("dark", value);
  }, []);
  function theme() {
    setDark(!dark);
    document.documentElement.classList.toggle("dark", !dark);
    localStorage.setItem("volt-theme", !dark ? "dark" : "light");
  }
  return (
    <>
      <div className="announcement">
        <span>Better tech. Better everyday.</span>
        <span>
          Free shipping on orders $150+ <ArrowUpRight size={12} />
        </span>
      </div>
      <header className="header">
        <Link href="/" className="logo" aria-label="Volt home">
          v<span>o</span>lt
          <Zap size={20} fill="currentColor" />
        </Link>
        <nav className={open ? "nav open" : "nav"} aria-label="Main navigation">
          <Link href="/shop" onClick={() => setOpen(false)}>
            Shop all
          </Link>
          <Link href="/shop?category=Audio" onClick={() => setOpen(false)}>
            Audio
          </Link>
          <Link href="/shop?category=Computing" onClick={() => setOpen(false)}>
            Computing
          </Link>
          <Link href="/shop?category=Mobile" onClick={() => setOpen(false)}>
            Mobile
          </Link>
          <Link
            href="/shop?category=Accessories"
            onClick={() => setOpen(false)}
          >
            Accessories
          </Link>
        </nav>
        <div className="header-actions">
          <Link href="/shop" aria-label="Search products">
            <Search size={20} />
          </Link>
          <button aria-label="Toggle dark mode" onClick={theme}>
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link href="/account" aria-label="Your account">
            <User size={20} />
          </Link>
          <Link
            href="/cart"
            className="bag"
            aria-label={`Shopping bag, ${cart.reduce((s, x) => s + x.quantity, 0)} items`}
          >
            <ShoppingBag size={20} />
            <sup>{cart.reduce((s, x) => s + x.quantity, 0)}</sup>
          </Link>
          <button
            className="mobile-menu"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
    </>
  );
}
