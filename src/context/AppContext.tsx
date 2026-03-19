import React, { createContext, useContext, useState } from 'react';
import { Company, AuditPeriod, companies as initialCompanies, EmailThread, emailThreads as initialEmails } from '@/data/mockData';

interface AppState {
  companies: Company[];
  emails: EmailThread[];
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  addEmail: (email: EmailThread) => void;
  attachReport: (companyId: string) => void;
  updateCompanyStatus: (companyId: string, status: Company['status']) => void;
  addAuditPeriod: (companyId: string, period: AuditPeriod) => void;
  setActiveAuditPeriod: (companyId: string, periodId: string) => void;
  bulkCreateReviewCycles: (rows: { companyId: string; periodLabel: string }[]) => void;
  archiveCompany: (companyId: string) => void;
  unarchiveCompany: (companyId: string) => void;
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

  const addAuditPeriod = (companyId: string, period: AuditPeriod) => {
    setCompanies(prev => prev.map(c => {
      if (c.id !== companyId) return c;
      // If new period is active, deactivate others
      const updatedPeriods = period.isActive
        ? c.auditPeriods.map(p => ({ ...p, isActive: false }))
        : [...c.auditPeriods];
      return {
        ...c,
        auditPeriods: [period, ...updatedPeriods],
        ...(period.isActive ? { auditPeriod: period.label, status: period.status } : {}),
      };
    }));
  };

  const setActiveAuditPeriod = (companyId: string, periodId: string) => {
    setCompanies(prev => prev.map(c => {
      if (c.id !== companyId) return c;
      const updatedPeriods = c.auditPeriods.map(p => ({
        ...p,
        isActive: p.id === periodId,
      }));
      const activePeriod = updatedPeriods.find(p => p.isActive);
      return {
        ...c,
        auditPeriods: updatedPeriods,
        auditPeriod: activePeriod?.label ?? c.auditPeriod,
        status: activePeriod?.status ?? c.status,
      };
    }));
  };

  const bulkCreateReviewCycles = (rows: { companyId: string; periodLabel: string }[]) => {
    setCompanies(prev => {
      const updated = [...prev];
      for (const row of rows) {
        const idx = updated.findIndex(c => c.id === row.companyId);
        if (idx === -1) continue;
        const company = updated[idx];
        // Skip if period already exists
        if (company.auditPeriods.some(p => p.label === row.periodLabel)) continue;
        const newPeriod: AuditPeriod = {
          id: `ap-${row.companyId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          label: row.periodLabel,
          status: 'Pending Review',
          isActive: false,
          createdAt: new Date().toISOString(),
        };
        updated[idx] = {
          ...company,
          auditPeriods: [newPeriod, ...company.auditPeriods],
        };
      }
      return updated;
    });
  };

  return (
    <AppContext.Provider value={{
      companies, emails, selectedCompanyId, setSelectedCompanyId,
      addEmail, attachReport, updateCompanyStatus,
      addAuditPeriod, setActiveAuditPeriod, bulkCreateReviewCycles,
    }}>
      {children}
    </AppContext.Provider>
  );
};
