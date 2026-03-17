import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { AppLayout } from "@/components/AppLayout";
import OrgChartPage from "@/pages/OrgChartPage";
import AuditPipelinePage from "@/pages/AuditPipelinePage";
import ComparisonWorkspacePage from "@/pages/ComparisonWorkspacePage";
import CommunicationsPage from "@/pages/CommunicationsPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AppProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<OrgChartPage />} />
              <Route path="/pipeline" element={<AuditPipelinePage />} />
              <Route path="/workspace" element={<ComparisonWorkspacePage />} />
              <Route path="/communications" element={<CommunicationsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </AppProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
