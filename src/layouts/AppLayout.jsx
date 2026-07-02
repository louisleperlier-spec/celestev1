import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import SkyBackground from "../components/SkyBackground.jsx";
import "./AppLayout.css";

export default function AppLayout() {
  return (
    <div className="app-layout">
      <SkyBackground />
      <Sidebar />
      <main className="app-layout__main">
        <Outlet />
      </main>
    </div>
  );
}
