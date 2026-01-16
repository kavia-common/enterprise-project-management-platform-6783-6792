import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";

import { AuthProvider } from "./context/AuthContext";
import { UIProvider, useUI } from "./context/UIContext";

import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProjectsPage from "./pages/ProjectsPage";
import UsersPage from "./pages/UsersPage";
import RolesPage from "./pages/RolesPage";

import ToastViewport from "./components/ToastViewport";

function GlobalLoadingBar() {
  const { globalLoading } = useUI();
  return globalLoading ? <div className="loading-bar" aria-hidden="true" /> : null;
}

// PUBLIC_INTERFACE
function App() {
  /** This is a public function. */
  return (
    <UIProvider>
      <AuthProvider>
        <BrowserRouter>
          <GlobalLoadingBar />
          <ToastViewport />

          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected app */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/roles" element={<RolesPage />} />
                <Route path="/" element={<Navigate to="/projects" replace />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </UIProvider>
  );
}

export default App;
