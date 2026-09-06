import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#carte", label: "Carte des émotions" },
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#ressources", label: "Ressources" },
  { href: "#tarifs", label: "Tarifs" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-void-900/80 backdrop-blur-lg border-b border-white/5" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link to="/" className="flex items-center gap-2 font-display text-xl tracking-wide">
          <span className="text-gold-400">✦</span>
          <span>Céleste</span>
        </Link>

        <div className="hidden items-center gap-9 lg:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-mist-400 transition hover:text-mist-100">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-mist-300 transition hover:text-mist-100"
          >
            Connexion
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="rounded-full bg-gradient-to-r from-gold-400 to-aurora-violet px-5 py-2.5 text-sm font-semibold text-void-950 shadow-[0_0_24px_-4px_rgba(245,212,138,0.5)] transition hover:shadow-[0_0_32px_-2px_rgba(245,212,138,0.7)]"
          >
            Essayer gratuitement
          </button>
        </div>

        <button className="text-mist-100 lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/5 bg-void-900/95 px-6 py-6 backdrop-blur-lg lg:hidden">
          <div className="flex flex-col gap-5">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-mist-300">
                {l.label}
              </a>
            ))}
            <hr className="border-white/10" />
            <button onClick={() => navigate("/login")} className="text-left text-mist-300">
              Connexion
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="rounded-full bg-gradient-to-r from-gold-400 to-aurora-violet px-5 py-2.5 text-center text-sm font-semibold text-void-950"
            >
              Essayer gratuitement
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
