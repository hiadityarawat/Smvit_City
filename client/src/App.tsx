import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AuthBootstrap } from "./features/auth/AuthBootstrap";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { AppHomePage } from "./pages/AppHomePage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { InteriorPage } from "./pages/InteriorPage";
import { AdminPage } from "./pages/AdminPage";
const WorldPage = lazy(() => import("./pages/WorldPage"));

export function App() {
  return (
    <AuthBootstrap><Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/app" element={<ProtectedRoute><AppHomePage /></ProtectedRoute>} />
      <Route path="/world" element={<ProtectedRoute><Suspense fallback={<main className="session-loading">Preparing the city…</main>}><WorldPage /></Suspense></ProtectedRoute>} />
      <Route path="/preview" element={<Suspense fallback={<main className="session-loading">Preparing the city…</main>}><WorldPage /></Suspense>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/interior/:id" element={<ProtectedRoute><InteriorPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes></AuthBootstrap>
  );
}
