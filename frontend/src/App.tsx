import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { CreateStoryPage } from "./pages/CreateStoryPage";
import { HomePage } from "./pages/HomePage";
import { LandingPage } from "./pages/LandingPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { QuizPage } from "./pages/QuizPage";
import { ReadingPage } from "./pages/ReadingPage";
import { ResultsPage } from "./pages/ResultsPage";

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<LandingPage />} />
        <Route path="inicio" element={<HomePage />} />
        <Route path="crear" element={<CreateStoryPage />} />
        <Route path="historias/:storyId" element={<ReadingPage />} />
        <Route
          path="historias/:storyId/desafio"
          element={<QuizPage />}
        />
        <Route
          path="historias/:storyId/resultados/:attemptId"
          element={<ResultsPage />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

