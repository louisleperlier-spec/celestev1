import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import Starfield from "../Starfield";

export default function AppLayout() {
  return (
    <div className="relative min-h-screen bg-void-900">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-void-900" />
        <Starfield count={70} />
      </div>

      <Sidebar />
      <MobileNav />

      <main className="px-5 pb-24 pt-8 lg:pb-10 lg:pl-72 lg:pr-10 lg:pt-10">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
