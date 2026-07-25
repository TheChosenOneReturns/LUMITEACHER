import { MotionConfig } from "motion/react";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { UserRole } from "@story-teacher/shared";
import { useAuth } from "./auth/AuthContext";
import { AppShell } from "./components/AppShell";
import { LoadingState } from "./components/PageState";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { FaqPage } from "./pages/FaqPage";

const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const CreateStoryPage = lazy(() => import("./pages/CreateStoryPage").then((module) => ({ default: module.CreateStoryPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then((module) => ({ default: module.ProfilePage })));
const QuizPage = lazy(() => import("./pages/QuizPage").then((module) => ({ default: module.QuizPage })));
const ReadingPage = lazy(() => import("./pages/ReadingPage").then((module) => ({ default: module.ReadingPage })));
const ResultsPage = lazy(() => import("./pages/ResultsPage").then((module) => ({ default: module.ResultsPage })));
const RewardsPage = lazy(() => import("./pages/RewardsPage").then((module) => ({ default: module.RewardsPage })));
const JoinCoursePage = lazy(() => import("./pages/JoinCoursePage").then((module) => ({ default: module.JoinCoursePage })));
const AdultDashboardPage = lazy(() => import("./pages/AdultDashboardPage").then((module) => ({ default: module.AdultDashboardPage })));
const AdultCoursesPage = lazy(() => import("./pages/AdultCoursesPage").then((module) => ({ default: module.AdultCoursesPage })));
const AdultCoursePage = lazy(() => import("./pages/AdultCoursePage").then((module) => ({ default: module.AdultCoursePage })));
const CreateMissionPage = lazy(() => import("./pages/CreateMissionPage").then((module) => ({ default: module.CreateMissionPage })));
const StudentProgressPage = lazy(() => import("./pages/StudentProgressPage").then((module) => ({ default: module.StudentProgressPage })));

function RequireAuth({ role }: { role?: UserRole }) {
  const { profile, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingState message="Abriendo tu mundo…" />;
  if (!profile) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }
  if (role && profile.role !== role) {
    return <Navigate to={profile.role === "adult" ? "/adulto" : "/inicio"} replace />;
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
            <Route path="preguntas-frecuentes" element={<FaqPage />} />
            <Route path="unirse/:token" element={<JoinCoursePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="perfil" element={<ProfilePage />} />
          </Route>
          <Route element={<RequireAuth role="student" />}>
            <Route path="inicio" element={<HomePage />} />
            <Route path="crear" element={<CreateStoryPage />} />
            <Route path="recompensas" element={<RewardsPage />} />
            <Route path="historias/:storyId" element={<ReadingPage />} />
            <Route path="historias/:storyId/desafio" element={<QuizPage />} />
            <Route path="historias/:storyId/resultados/:attemptId" element={<ResultsPage />} />
          </Route>
          <Route element={<RequireAuth role="adult" />}>
            <Route path="adulto" element={<AdultDashboardPage />} />
            <Route path="adulto/cursos" element={<AdultCoursesPage />} />
            <Route path="adulto/cursos/:courseId" element={<AdultCoursePage />} />
            <Route path="adulto/cursos/:courseId/crear-mision" element={<CreateMissionPage />} />
            <Route path="adulto/cursos/:courseId/alumnos/:studentId" element={<StudentProgressPage />} />
          </Route>
        </Routes>
      </Suspense>
    </MotionConfig>
  );
}
