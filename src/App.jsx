import { Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout.jsx";
import Home from "./pages/Home.jsx";
import Placeholder from "./pages/Placeholder.jsx";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route
          path="heures-miroir"
          element={
            <Placeholder
              title="Heures miroir ✦"
              tagline="Retrouve ici tes heures miroir passées et à venir."
            />
          }
        />
        <Route
          path="mediter"
          element={
            <Placeholder
              title="Méditer ◌"
              tagline="Une bibliothèque de méditations guidées par Lumi."
            />
          }
        />
        <Route
          path="journal"
          element={
            <Placeholder
              title="Journal ✎"
              tagline="Note tes petites joies et tes intentions du jour."
            />
          }
        />
        <Route
          path="lune"
          element={
            <Placeholder
              title="Lune ☾"
              tagline="Suis les phases de la lune et ses rituels associés."
            />
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
