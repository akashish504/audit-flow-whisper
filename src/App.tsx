import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { AppLayout } from "@/components/AppLayout";
import PortfolioCompaniesPage from "@/pages/PortfolioCompaniesPage";
import CompanyDetailPage from "@/pages/CompanyDetailPage";
import EmailTemplatesPage from "@/pages/EmailTemplatesPage";
import FileTaggingPage from "@/pages/FileTaggingPage";
import FileDetailPage from "@/pages/FileDetailPage";
import EmailTaggingPage from "@/pages/EmailTaggingPage";
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
              <Route path="/" element={<PortfolioCompaniesPage />} />
              <Route path="/company/:companyId" element={<CompanyDetailPage />} />
              <Route path="/email-templates" element={<EmailTemplatesPage />} />
              <Route path="/file-tagging" element={<FileTaggingPage />} />
              <Route path="/email-tagging" element={<EmailTaggingPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </AppProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
