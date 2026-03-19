import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminProvider } from "./contexts/AdminContext";
import { CompetitionProvider } from "./contexts/CompetitionContext";
import { ProtectedRoute, ProtectedAdminRoute } from "./components";
import { Login } from "./pages/Login";
import { CompetitionLobby } from "./pages/CompetitionLobby";
import { CompetitionPlay } from "./pages/CompetitionPlay";
import { NotFound } from "./pages/NotFound";

// Admin imports
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminHome from "./pages/AdminHome";
import RegisterTeam from "./pages/RegisterTeam";
import AllTeams from "./pages/AllTeams";
import LiveLeaderboard from "./pages/LiveLeaderboard";
import ContestConfig from "./pages/ContestConfig";
import ManageQuestions from "./pages/ManageQuestions";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CompetitionProvider>
          <AdminProvider>
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
          </AdminProvider>
        </CompetitionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
