import "./globals.css";
import { Header } from "@/components/header";
import { StoreProvider } from "@/components/store-provider";
import Link from "next/link";
import { Zap } from "lucide-react";
export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: { default: "VOLT — Tech that fits your life", template: "%s | VOLT" },
  description:
    "Thoughtfully selected electronics. Discover exceptional audio, computing, mobile and everyday accessories.",
  openGraph: {
    title: "VOLT — Tech that fits your life",
    description: "Good design. Great technology. Your next everyday essential.",
    type: "website",
  },
};
export default function Layout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a href="#main" className="skip">
          Skip to content
        </a>
        <StoreProvider>
          <Header />
          <main id="main">{children}</main>
          <footer className="footer">
            <div className="footer-top">
              <div>
                <Link className="logo" href="/">
                  volt
                  <Zap size={20} />
                </Link>
                <p>
                  Technology should make life better.
                  <br />
                  We’re here to help you find the good stuff.
                </p>
              </div>
              <div>
                <h3>EXPLORE</h3>
                <Link href="/shop">All products</Link>
                <Link href="/shop?category=Audio">Audio essentials</Link>
                <Link href="/shop?category=Computing">Computing</Link>
              </div>
              <div>
                <h3>HERE TO HELP</h3>
                <Link href="/account">Account & orders</Link>
                <Link href="/help">Shipping & returns</Link>
                <Link href="/privacy">Privacy policy</Link>
              </div>
            </div>
            <div className="footer-bottom">
              <span>
                © {new Date().getFullYear()} VOLT. Thoughtfully connected.
              </span>
              <span>Secure checkout · Cards & cash on delivery</span>
            </div>
          </footer>
        </StoreProvider>
      </body>
    </html>
  );
}
