import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import DashboardApp from "./DashboardApp";
import "./index.css";

ReactDOM.createRoot(document.getElementById("app")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/citizen" replace />} />
        <Route path="/citizen" element={<DashboardApp />} />
        <Route path="/collector" element={<DashboardApp />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
