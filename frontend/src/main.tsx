import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { ToastProvider, useToast } from "./components/Toast";
import { LoginPage } from "./LoginPage";
import DashboardApp from "./DashboardApp";
import "./index.css";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "citizen" | "collector";
}

function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { currentUser } = useAuth();
  const location = useLocation();
  const { showToast } = useToast();

  if (!currentUser) {
    console.log(
      `[ROUTE] No authenticated user. Redirecting to /login from ${location.pathname}`
    );
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required, check it
  if (
    requiredRole &&
    currentUser.role !== requiredRole
  ) {
    console.warn(
      `[ROUTE] Access Denied: User role mismatch. User role: ${currentUser.role}, Required: ${requiredRole}. Redirecting to /${currentUser.role}`
    );
    
    // Show access denial toast
    const message = 
      requiredRole === "collector"
        ? "Access Denied: BMC Officer Credentials Required"
        : "Access Denied: You must be a Citizen to access this section";
    
    setTimeout(() => showToast(message, "error"), 100);

    const correctRoute =
      currentUser.role === "collector" ? "/collector" : "/citizen";
    return <Navigate to={correctRoute} replace />;
  }

  console.log(
    `[ROUTE] Access granted for ${currentUser.email} (${currentUser.role}) to ${location.pathname}`
  );
  return <>{children}</>;
}

function RoutingComponent() {
  const { currentUser } = useAuth();
  const location = useLocation();

  // Log routing decisions
  React.useEffect(() => {
    console.log(`[ROUTE] Current path: ${location.pathname}, User: ${currentUser?.email || "none"}`);
  }, [location, currentUser]);

  return (
    <Routes>
      {/* Login route - accessible only when not authenticated */}
      <Route
        path="/login"
        element={
          currentUser ? (
            <>
              {console.log(
                `[ROUTE] User already authenticated, redirecting from /login`
              )}
              <Navigate
                to={currentUser.role === "collector" ? "/collector" : "/citizen"}
                replace
              />
            </>
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Root route - redirect to appropriate dashboard or login */}
      <Route
        path="/"
        element={
          currentUser ? (
            <>
              {console.log(
                `[ROUTE] Redirecting authenticated user from / to /${currentUser.role}`
              )}
              <Navigate
                to={currentUser.role === "collector" ? "/collector" : "/citizen"}
                replace
              />
            </>
          ) : (
            <>
              {console.log(`[ROUTE] Redirecting unauthenticated user from / to /login`)}
              <Navigate to="/login" replace />
            </>
          )
        }
      />

      {/* Citizen dashboard - protected */}
      <Route
        path="/citizen"
        element={
          <ProtectedRoute requiredRole="citizen">
            <DashboardApp />
          </ProtectedRoute>
        }
      />

      {/* Collector dashboard - protected */}
      <Route
        path="/collector"
        element={
          <ProtectedRoute requiredRole="collector">
            <DashboardApp />
          </ProtectedRoute>
        }
      />

      {/* Catch-all for undefined routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById("app")!).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <RoutingComponent />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>
);
