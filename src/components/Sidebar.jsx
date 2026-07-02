import { NavLink } from "react-router-dom";
import lumi from "../assets/lumi.png";
import "./Sidebar.css";

const NAV_ITEMS = [
  { to: "/", label: "Accueil", icon: "⌂", end: true },
  { to: "/heures-miroir", label: "Heures miroir", icon: "✦" },
  { to: "/mediter", label: "Méditer", icon: "◌" },
  { to: "/journal", label: "Journal", icon: "✎" },
  { to: "/lune", label: "Lune", icon: "☾" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <img src={lumi} alt="Lumi" className="sidebar__brand-icon" />
        <span className="sidebar__brand-name">Céleste ✦</span>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              "sidebar__link" + (isActive ? " sidebar__link--active" : "")
            }
          >
            <span className="sidebar__link-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__spacer" />

      <div className="sidebar__plus">
        <div className="sidebar__plus-title">Céleste Plus ✦</div>
        <div className="sidebar__plus-text">
          Tout l'univers de Lumi, en illimité.
        </div>
        <button type="button" className="sidebar__plus-cta">
          Découvrir ✦
        </button>
      </div>
    </aside>
  );
}
