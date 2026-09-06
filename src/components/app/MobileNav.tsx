import { NavLink } from "react-router-dom";
import { BookHeart, LayoutDashboard, LineChart, MoonStar, Sparkles } from "lucide-react";

const items = [
  { to: "/app", label: "Accueil", icon: LayoutDashboard, end: true },
  { to: "/app/emotions", label: "Carte", icon: MoonStar },
  { to: "/app/journal", label: "Journal", icon: BookHeart },
  { to: "/app/statistiques", label: "Stats", icon: LineChart },
  { to: "/app/ressources", label: "Ressources", icon: Sparkles },
];

export default function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-white/10 bg-void-950/90 backdrop-blur-xl lg:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-3 text-[10px] ${
              isActive ? "text-gold-400" : "text-mist-500"
            }`
          }
        >
          <item.icon size={18} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
