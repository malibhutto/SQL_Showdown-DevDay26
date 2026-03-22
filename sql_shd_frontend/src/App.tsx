import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminProvider } from "./contexts/AdminContext";
import { CompetitionProvider } from "./contexts/CompetitionContext";
import {
  ProtectedRoute,
  ProtectedAdminRoute,
  FullScreenStatus,
} from "./components";

const Login = lazy(async () => {
  const mod = await import("./pages/Login");
  return { default: mod.Login };
});

const CompetitionLobby = lazy(async () => {
  const mod = await import("./pages/CompetitionLobby");
  return { default: mod.CompetitionLobby };
});

const CompetitionPlay = lazy(async () => {
  const mod = await import("./pages/CompetitionPlay");
  return { default: mod.CompetitionPlay };
});

const NotFound = lazy(async () => {
  const mod = await import("./pages/NotFound");
  return { default: mod.NotFound };
});

const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminHome = lazy(() => import("./pages/AdminHome"));
const RegisterTeam = lazy(() => import("./pages/RegisterTeam"));
const AllTeams = lazy(() => import("./pages/AllTeams"));
const LiveLeaderboard = lazy(() => import("./pages/LiveLeaderboard"));
const ContestConfig = lazy(() => import("./pages/ContestConfig"));
const ManageQuestions = lazy(() => import("./pages/ManageQuestions"));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CompetitionProvider>
          <AdminProvider>
            <Suspense
              fallback={
                <FullScreenStatus
                  title="SQL SHOWDOWN"
                  subtitle="LOADING INTERFACE..."
                />
              }
            >
              <Routes>
                {/* Contestant Routes */}
                <Route path="/login" element={<Login />} />
                <Route
                  path="/competition"
                  element={
                    <ProtectedRoute>
                      <CompetitionLobby />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/competition/play"
                  element={
                    <ProtectedRoute>
                      <CompetitionPlay />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedAdminRoute>
                      <AdminDashboard />
                    </ProtectedAdminRoute>
                  }
                >
                  <Route
                    index
                    element={<Navigate to="/admin/dashboard" replace />}
                  />
                  <Route path="dashboard" element={<AdminHome />} />
                  <Route path="register-team" element={<RegisterTeam />} />
                  <Route path="teams" element={<AllTeams />} />
                  <Route path="leaderboard" element={<LiveLeaderboard />} />
                  <Route path="contest" element={<ContestConfig />} />
                  <Route path="questions" element={<ManageQuestions />} />
                </Route>

                {/* Default Routes */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AdminProvider>
        </CompetitionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
