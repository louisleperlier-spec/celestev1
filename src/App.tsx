import { BrowserRouter, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AppLayout from "./components/app/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import EmotionMapPage from "./pages/app/EmotionMapPage";
import Journal from "./pages/app/Journal";
import Resources from "./pages/app/Resources";
import Stats from "./pages/app/Stats";
import Settings from "./pages/app/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="emotions" element={<EmotionMapPage />} />
          <Route path="journal" element={<Journal />} />
          <Route path="statistiques" element={<Stats />} />
          <Route path="ressources" element={<Resources />} />
          <Route path="parametres" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
