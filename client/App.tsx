import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PhoneCall, Users, BookOpen, MessageSquare } from "lucide-react";

import Activity from "./pages/Activity";
import ControlPanelPage from "./pages/ControlPanelPage";
import Desk from "./pages/Desk";
import DeskPage from "./pages/DeskPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import Placeholder from "./pages/Placeholder";
import Schedule from "./pages/Schedule";
import SettingsPage from "./pages/SettingsPage";
import SalesforcePage from "./pages/SalesforcePage";
import ServiceNowPage from "./pages/ServiceNowPage";
import WemPage from "./pages/WemPage";
import ReportingPage from "./pages/ReportingPage";
import DirectoryPage from "./pages/DirectoryPage";
import ScenarioControllerPage from "./pages/ScenarioControllerPage";
import ScenarioPanel from "./pages/ScenarioPanel";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

// ─── Inner workspace routes (rendered inside Layout) ─────────────────────────
function WorkspaceRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/activity"     element={<Activity />} />
        <Route path="/control-center" element={<ControlPanelPage />} />
        <Route path="/queue"        element={<ControlPanelPage mode="inbox" />} />
        <Route path="/desk"         element={<DeskPage />} />
        <Route path="/desk-panel"   element={<Desk />} />
        <Route path="/directory"    element={<DirectoryPage />} />
        <Route path="/schedule"     element={<Schedule />} />
        <Route path="/settings"     element={<SettingsPage />} />
        <Route path="/scenarios"    element={<ScenarioPanel />} />
        <Route path="/reporting"    element={<ReportingPage />} />
        <Route path="/salesforce"   element={<SalesforcePage />} />
        <Route path="/service-now"  element={<ServiceNowPage />} />
        <Route path="/wem"          element={<WemPage />} />
        <Route path="/calls"    element={<Placeholder title="Active Calls"       description="Manage active voice calls, view call history, and access call analytics in one place." icon={PhoneCall} />} />
        <Route path="/chats"    element={<Placeholder title="Active Chats"       description="Handle multi-channel chat interactions from web, SMS, and social platforms."           icon={MessageSquare} />} />
        <Route path="/customers" element={<Placeholder title="Customer Directory" description="View comprehensive customer profiles, interaction history, and segment data."           icon={Users} />} />
        <Route path="/knowledge" element={<Placeholder title="Knowledge Base"    description="Access internal documentation, canned responses, and AI-suggested articles."           icon={BookOpen} />} />
        <Route path="*"         element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="bottom-right" />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          {/* Default → login */}
          <Route path="/"      element={<Navigate to="/login" replace />} />

          {/* Login page — no sidebar / header chrome */}
          <Route path="/login" element={<LoginPage />} />

          {/* Scenario controller — standalone tab, no Layout chrome */}
          <Route path="/controller" element={<ScenarioControllerPage />} />

          {/* All workspace routes — wrapped in Layout */}
          <Route path="/*" element={<WorkspaceRoutes />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

// Reuse existing root on HMR full reloads to prevent duplicate-root errors
// caused by Layout.tsx's mixed component+hook exports disabling Fast Refresh.
const rootElement = document.getElementById("root")!;
declare global { interface Window { __reactRoot?: ReturnType<typeof createRoot> } }
if (!window.__reactRoot) {
  window.__reactRoot = createRoot(rootElement);
}
window.__reactRoot.render(<App />);
