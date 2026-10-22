import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  ArrowRight,
  Headphones,
  Laptop,
  Smartphone,
  Cable,
  Watch,
  Truck,
  ShieldCheck,
  RotateCcw,
  LockKeyhole,
  Zap,
} from "lucide-react";
import { catalog } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
export const dynamic = "force-dynamic";
const categories = [
  ["Audio", "Find your frequency", Headphones],
  ["Computing", "Power your potential", Laptop],
  ["Mobile", "Always connected", Smartphone],
  ["Accessories", "The little upgrades", Cable],
  ["Wearables", "Made for your rhythm", Watch],
];
export default async function Home() {
  let products = [],
    unavailable = false;
  try {
    products = (await catalog({ sort: "featured" })).items.slice(0, 4);
  } catch {
    unavailable = true;
  }
  return (
    <div className="container">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <i className="dot" /> A LITTLE UPGRADE. A BIG DIFFERENCE.
          </span>
          <h1>
            Great tech.
            <br />
            Better <em>living.</em>
          </h1>
          <p>
            Thoughtfully chosen electronics for the way you work, play, and
            everything in between.
          </p>
          <div className="hero-actions">
            <Link className="btn" href="/shop">
              Find your next upgrade <ArrowUpRight size={16} />
            </Link>
            <Link className="text-link" href="#discover">
              Take a look around
            </Link>
          </div>
          <div className="hero-foot">
            <div className="avatar-stack">
              <span>V</span>
              <span>O</span>
              <span>L</span>
              <span>T</span>
            </div>
            <span>Curated for everyday. Built for what’s next.</span>
          </div>
        </div>
        <Link className="hero-art" href="/shop?category=Audio">
          <Image
            src="https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1200&auto=format&fit=crop&q=85"
            alt="Premium headphones with a sculpted, comfortable design"
            fill
            priority
            sizes="(max-width:760px) 90vw,45vw"
          />
          <span className="hero-label">TURN THE EVERYDAY UP</span>
          <div className="hero-art-caption">
            <div>
              <span className="eyebrow">LESS NOISE. MORE YOU.</span>
              <h2>Find your sound.</h2>
              <span className="small" style={{ color: "#e4e8dd" }}>
                Discover the audio collection
              </span>
            </div>
            <span className="circle-arrow">
              <ArrowUpRight size={22} />
            </span>
          </div>
        </Link>
      </section>
      <section className="benefits" aria-label="Shopping benefits">
        {[
          [Truck, "On the house", "Free shipping over $150"],
          [ShieldCheck, "The real deal", "Authentic products, always"],
          [RotateCcw, "Peace of mind", "30-day returns"],
          [LockKeyhole, "Shop with confidence", "Secure, encrypted checkout"],
        ].map(([Icon, title, desc]) => (
          <div className="benefit" key={title}>
            <Icon size={27} strokeWidth={1.2} />
            <div>
              <strong>{title}</strong>
              <small>{desc}</small>
            </div>
          </div>
        ))}
      </section>
      <section id="discover">
        <div className="section-head">
          <div>
            <span className="eyebrow">YOUR WORLD, UPGRADED</span>
            <h2>A good place to start.</h2>
          </div>
          <Link className="text-link" href="/shop">
            Explore everything ↗
          </Link>
        </div>
        <div className="categories">
          {categories.map(([name, desc, Icon]) => (
            <Link
              href={`/shop?category=${name}`}
              className="category-tile"
              key={name}
            >
              <Icon size={30} strokeWidth={1.2} />
              <strong>{name}</strong>
              <small>{desc}</small>
              <ArrowUpRight className="tile-arrow" size={15} />
            </Link>
          ))}
        </div>
      </section>
      <section>
        <div className="section-head">
          <div>
            <span className="eyebrow">CURATED. NEVER COMPLICATED.</span>
            <h2>Meet your new essentials.</h2>
            <p>Good design meets great performance.</p>
          </div>
          <Link href="/shop" className="text-link">
            Shop the collection ↗
          </Link>
        </div>
        {products.length ? (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        ) : (
          <div className="empty">
            {unavailable
              ? "The catalog is temporarily unavailable. Please try again soon."
              : "New essentials are on their way. Check back soon."}
          </div>
        )}
      </section>
      <section className="feature-banner">
        <div>
          <span className="eyebrow">LESS SCROLLING. MORE LIVING.</span>
          <h2>Your everyday, elevated.</h2>
          <p>
            From your first meeting to your last playlist. Find considered tech
            that quietly makes a difference.
          </p>
          <Link className="text-link" href="/shop">
            Discover the collection{" "}
            <ArrowRight size={13} style={{ display: "inline" }} />
          </Link>
        </div>
        <div className="banner-right">
          <Zap className="big-zap" strokeWidth={0.7} />
          <div>
            <span className="eyebrow">THE VOLT EDIT</span>
            <h2 style={{ fontFamily: "Georgia", fontStyle: "italic" }}>
              Simply. Better.
            </h2>
          </div>
        </div>
      </section>
      <div className="brand-row">
        <small>
          GREAT COMPANY.
          <br />
          EVEN BETTER TECH.
        </small>
        {["SONY", "Apple", "SAMSUNG", "logitech", "BOSE", "anker"].map((x) => (
          <strong key={x}>{x}</strong>
        ))}
      </div>
    </div>
  );
}
