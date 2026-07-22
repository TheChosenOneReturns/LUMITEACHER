import { MotionConfig } from "motion/react";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { AppShell } from "./components/AppShell";
import { CreateStoryPage } from "./pages/CreateStoryPage";
import { LoadingState } from "./components/PageState";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";

const HomePage = lazy(() =>
  import("./pages/HomePage").then((module) => ({ default: module.HomePage })),
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((module) => ({ default: module.ProfilePage })),
);
const QuizPage = lazy(() =>
  import("./pages/QuizPage").then((module) => ({ default: module.QuizPage })),
);
const ReadingPage = lazy(() =>
  import("./pages/ReadingPage").then((module) => ({ default: module.ReadingPage })),
);
const ResultsPage = lazy(() =>
  import("./pages/ResultsPage").then((module) => ({ default: module.ResultsPage })),
);

function RequireAuth() {
  const { profile } = useAuth();
  const location = useLocation();

  if (!profile) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return <AppShell protectedOutlet />;
}

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Suspense fallback={<LoadingState message="Preparando tu próxima aventura…" />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="inicio" element={<HomePage />} />
            <Route path="crear" element={<CreateStoryPage />} />
            <Route path="perfil" element={<ProfilePage />} />
            <Route path="historias/:storyId" element={<ReadingPage />} />
            <Route path="historias/:storyId/desafio" element={<QuizPage />} />
            <Route path="historias/:storyId/resultados/:attemptId" element={<ResultsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </MotionConfig>
  );
}
