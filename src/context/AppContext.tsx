import React, { createContext, useContext, useState } from 'react';
import { Company, companies as initialCompanies, EmailThread, emailThreads as initialEmails } from '@/data/mockData';

interface AppState {
  companies: Company[];
  emails: EmailThread[];
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  addEmail: (email: EmailThread) => void;
  attachReport: (companyId: string) => void;
  updateCompanyStatus: (companyId: string, status: Company['status']) => void;
}

const AppContext = createContext<AppState | null>(null);

export const useAppState = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [emails, setEmails] = useState<EmailThread[]>(initialEmails);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const addEmail = (email: EmailThread) => setEmails(prev => [email, ...prev]);

  const attachReport = (companyId: string) => {
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, hasAuditReport: true } : c));
  };

  const updateCompanyStatus = (companyId: string, status: Company['status']) => {
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, status } : c));
  };

  return (
    <AppContext.Provider value={{ companies, emails, selectedCompanyId, setSelectedCompanyId, addEmail, attachReport, updateCompanyStatus }}>
      {children}
    </AppContext.Provider>
  );
};
