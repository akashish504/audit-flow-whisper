import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { Company, AuditPeriod, companies as initialCompanies, EmailThread, emailThreads as initialEmails, DiscrepancyItem, reconciliationData, calculateVariance, ReviewCycle, ReviewCompanyEntry, ReviewCycleLog, ReviewStage, reviewCycles as initialReviewCycles, reviewCompanyEntries as initialReviewCompanyEntries, reviewCycleLogs as initialReviewCycleLogs } from '@/data/mockData';

// Extract all unique field names to build default thresholds
const allFieldNames = new Set<string>();
for (const fields of Object.values(reconciliationData)) {
  for (const f of fields) allFieldNames.add(f.Field_Name);
}
const DEFAULT_THRESHOLD = 0.005;
const defaultFieldThresholds: Record<string, number> = {};
allFieldNames.forEach(name => { defaultFieldThresholds[name] = DEFAULT_THRESHOLD; });

function buildDiscrepancies(thresholds: Record<string, number>): DiscrepancyItem[] {
  const items: DiscrepancyItem[] = [];
  for (const [companyId, fields] of Object.entries(reconciliationData)) {
    for (const field of fields) {
      const t = thresholds[field.Field_Name] ?? DEFAULT_THRESHOLD;
      const v = calculateVariance(field.Source_Value, field.Extracted_Value, t);
      if (v.isFlagged) {
        items.push({
          id: `disc-${companyId}-${field.entityId || companyId}-${field.Field_Name}`,
          fieldName: field.Field_Name,
          sourceValue: field.Source_Value,
          extractedValue: field.Extracted_Value,
          entityId: field.entityId || companyId,
          entityName: field.entityName || companyId,
          enabled: true,
          remarks: '',
          l1Reviewer: '',
          l2Reviewer: '',
        });
      }
    }
  }
  return items;
}

interface AppState {
  companies: Company[];
  emails: EmailThread[];
  discrepancies: DiscrepancyItem[];
  fieldThresholds: Record<string, number>;
  setFieldThresholds: (thresholds: Record<string, number>) => void;
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  addEmail: (email: EmailThread) => void;
  attachReport: (companyId: string) => void;
  updateCompanyStatus: (companyId: string, status: Company['status']) => void;
  updateEntityStatus: (companyId: string, status: Company['status']) => void;
  addAuditPeriod: (companyId: string, period: AuditPeriod) => void;
  setActiveAuditPeriod: (companyId: string, periodId: string) => void;
  bulkCreateReviewCycles: (rows: { companyId: string; periodLabel: string }[]) => void;
  archiveCompany: (companyId: string) => void;
  unarchiveCompany: (companyId: string) => void;
  updateDiscrepancy: (id: string, updates: Partial<DiscrepancyItem>) => void;
  addCompany: (name: string, contactName: string, contactEmail: string) => void;
  // Review Cycle Adjustments
  rcCycles: ReviewCycle[];
  rcEntries: ReviewCompanyEntry[];
  rcLogs: ReviewCycleLog[];
  addReviewCycle: (label: string) => void;
  addOrUpdateRCEntries: (cycleId: string, entries: Omit<ReviewCompanyEntry, 'id' | 'reviewCycleId' | 'updatedAt'>[]) => void;
  updateRCEntryStage: (entryId: string, stage: ReviewStage) => void;
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
  const [fieldThresholds, setFieldThresholdsRaw] = useState<Record<string, number>>(defaultFieldThresholds);
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyItem[]>(buildDiscrepancies(defaultFieldThresholds));
  const [rcCycles, setRcCycles] = useState<ReviewCycle[]>(initialReviewCycles);
  const [rcEntries, setRcEntries] = useState<ReviewCompanyEntry[]>(initialReviewCompanyEntries);
  const [rcLogs, setRcLogs] = useState<ReviewCycleLog[]>(initialReviewCycleLogs);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const setFieldThresholds = (thresholds: Record<string, number>) => {
    setFieldThresholdsRaw(thresholds);
    setDiscrepancies(buildDiscrepancies(thresholds));
  };

  const addEmail = (email: EmailThread) => setEmails(prev => [email, ...prev]);

  const attachReport = (companyId: string) => {
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, hasAuditReport: true } : c));
  };

  const updateCompanyStatus = (companyId: string, status: Company['status']) => {
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, status } : c));
  };

  const updateEntityStatus = (companyId: string, status: Company['status']) => {
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, entityStatus: status } : c));
  };

  const addAuditPeriod = (companyId: string, period: AuditPeriod) => {
    setCompanies(prev => prev.map(c => {
      if (c.id !== companyId) return c;
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

  const archiveCompany = (companyId: string) => {
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, isArchived: true } : c));
  };

  const unarchiveCompany = (companyId: string) => {
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, isArchived: false } : c));
  };

  const updateDiscrepancy = (id: string, updates: Partial<DiscrepancyItem>) => {
    setDiscrepancies(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const addCompany = (name: string, contactName: string, contactEmail: string) => {
    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).slice(2, 6);
    const newCompany: Company = {
      id,
      name,
      parentId: 'holding',
      status: 'Pending Review',
      auditPeriod: 'Q4 2024',
      auditPeriods: [{ id: `ap-${id}-1`, label: 'Q4 2024', status: 'Pending Review', isActive: true, createdAt: new Date().toISOString() }],
      contactEmail,
      contactName,
      hasAuditReport: false,
      entityStatus: 'Pending Review',
    };
    setCompanies(prev => [...prev, newCompany]);
  };

  const addReviewCycle = (label: string) => {
    const exists = rcCycles.some(c => c.label === label);
    if (exists) return;
    const newCycle: ReviewCycle = {
      id: `rc-${Date.now()}`,
      label,
      createdAt: new Date().toISOString(),
    };
    setRcCycles(prev => [newCycle, ...prev]);
    setRcLogs(prev => [{
      id: `rcl-${Date.now()}`,
      action: 'Cycle Created',
      timestamp: new Date().toISOString(),
      user: 'admin@vantagecap.com',
      details: `Review cycle ${label} created`,
      reviewCycleId: newCycle.id,
    }, ...prev]);
  };

  const addOrUpdateRCEntries = (cycleId: string, entries: Omit<ReviewCompanyEntry, 'id' | 'reviewCycleId' | 'updatedAt'>[]) => {
    setRcEntries(prev => {
      const updated = [...prev];
      for (const entry of entries) {
        const existingIdx = updated.findIndex(e => e.reviewCycleId === cycleId && e.companyName.toLowerCase() === entry.companyName.toLowerCase());
        if (existingIdx !== -1) {
          updated[existingIdx] = { ...updated[existingIdx], ...entry, updatedAt: new Date().toISOString() };
        } else {
          updated.push({
            ...entry,
            id: `rce-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            reviewCycleId: cycleId,
            updatedAt: new Date().toISOString(),
          });
        }
      }
      return updated;
    });
    setRcLogs(prev => [{
      id: `rcl-${Date.now()}`,
      action: 'CSV Uploaded',
      timestamp: new Date().toISOString(),
      user: 'admin@vantagecap.com',
      details: `${entries.length} companies uploaded/updated for cycle`,
      reviewCycleId: cycleId,
    }, ...prev]);
  };

  const updateRCEntryStage = (entryId: string, stage: ReviewStage) => {
    setRcEntries(prev => prev.map(e => e.id === entryId ? { ...e, stage, updatedAt: new Date().toISOString() } : e));
    const entry = rcEntries.find(e => e.id === entryId);
    setRcLogs(prev => [{
      id: `rcl-${Date.now()}`,
      action: 'Stage Changed',
      timestamp: new Date().toISOString(),
      user: 'admin@vantagecap.com',
      details: `${entry?.companyName ?? 'Company'} stage changed to ${stage}`,
      reviewCycleId: entry?.reviewCycleId,
    }, ...prev]);
  };

  return (
    <AppContext.Provider value={{
      companies, emails, discrepancies, fieldThresholds, setFieldThresholds,
      selectedCompanyId, setSelectedCompanyId,
      addEmail, attachReport, updateCompanyStatus, updateEntityStatus,
      addAuditPeriod, setActiveAuditPeriod, bulkCreateReviewCycles,
      archiveCompany, unarchiveCompany, updateDiscrepancy, addCompany,
      rcCycles, rcEntries, rcLogs,
      addReviewCycle, addOrUpdateRCEntries, updateRCEntryStage,
    }}>
      {children}
    </AppContext.Provider>
  );
};