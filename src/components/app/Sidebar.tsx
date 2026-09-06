import { NavLink, useNavigate } from "react-router-dom";
import { BookHeart, LayoutDashboard, LineChart, LogOut, MoonStar, Settings, Sparkles } from "lucide-react";

const items = [
  { to: "/app", label: "Tableau de bord", icon: LayoutDashboard, end: true },
  { to: "/app/emotions", label: "Carte des émotions", icon: MoonStar },
  { to: "/app/journal", label: "Journal", icon: BookHeart },
  { to: "/app/statistiques", label: "Statistiques", icon: LineChart },
  { to: "/app/ressources", label: "Ressources", icon: Sparkles },
  { to: "/app/parametres", label: "Paramètres", icon: Settings },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const logout = () => {
    window.localStorage.removeItem("celeste-user-email");
    navigate("/");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/5 bg-void-950/60 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-2 px-7 py-7 font-display text-xl">
        <span className="text-gold-400">✦</span> Céleste
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                isActive
                  ? "bg-white/10 font-semibold text-mist-100"
                  : "text-mist-400 hover:bg-white/5 hover:text-mist-100"
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/5 p-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-mist-500 transition hover:bg-white/5 hover:text-mist-100"
        >
          <LogOut size={18} />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
