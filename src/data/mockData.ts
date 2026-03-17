export type AuditStatus = 'Pending Review' | 'Discrepancy Identified' | 'Clarification Requested' | 'Resolved';

export interface Company {
  id: string;
  name: string;
  parentId: string | null;
  status: AuditStatus;
  auditPeriod: string;
  contactEmail: string;
  contactName: string;
  hasAuditReport: boolean;
}

export interface ReconciliationField {
  Field_Name: string;
  Source_Value: number;
  Extracted_Value: number;
}

export interface EmailThread {
  id: string;
  companyId: string;
  subject: string;
  timestamp: string;
  from: string;
  to: string;
  body: string;
  status: 'draft' | 'sent' | 'received';
}

export const companies: Company[] = [
  { id: 'holding', name: 'Vantage Capital Partners', parentId: null, status: 'Pending Review', auditPeriod: 'Q4 2024', contactEmail: '', contactName: '', hasAuditReport: false },
  { id: 'acme', name: 'Acme Corp', parentId: 'holding', status: 'Discrepancy Identified', auditPeriod: 'Q4 2024', contactEmail: 'j.chen@acmecorp.com', contactName: 'James Chen', hasAuditReport: true },
  { id: 'acme-eu', name: 'Acme Europe GmbH', parentId: 'acme', status: 'Pending Review', auditPeriod: 'Q4 2024', contactEmail: 'k.mueller@acme-eu.de', contactName: 'Klaus Mueller', hasAuditReport: false },
  { id: 'acme-asia', name: 'Acme Asia Pacific', parentId: 'acme', status: 'Resolved', auditPeriod: 'Q4 2024', contactEmail: 'l.tanaka@acme-ap.jp', contactName: 'Lisa Tanaka', hasAuditReport: true },
  { id: 'nexus', name: 'Nexus Technologies', parentId: 'holding', status: 'Clarification Requested', auditPeriod: 'Q4 2024', contactEmail: 'm.rodriguez@nexustech.io', contactName: 'Maria Rodriguez', hasAuditReport: true },
  { id: 'nexus-ai', name: 'Nexus AI Labs', parentId: 'nexus', status: 'Pending Review', auditPeriod: 'Q4 2024', contactEmail: 'r.patel@nexus-ai.io', contactName: 'Raj Patel', hasAuditReport: false },
  { id: 'meridian', name: 'Meridian Health', parentId: 'holding', status: 'Discrepancy Identified', auditPeriod: 'Q4 2024', contactEmail: 's.johnson@meridianhealth.com', contactName: 'Sarah Johnson', hasAuditReport: true },
  { id: 'meridian-rx', name: 'Meridian Pharma', parentId: 'meridian', status: 'Pending Review', auditPeriod: 'Q4 2024', contactEmail: 'd.kim@meridian-rx.com', contactName: 'David Kim', hasAuditReport: true },
];

export const reconciliationData: Record<string, ReconciliationField[]> = {
  acme: [
    { Field_Name: 'Revenue', Source_Value: 142500000, Extracted_Value: 142500000 },
    { Field_Name: 'COGS', Source_Value: 85200000, Extracted_Value: 85950000 },
    { Field_Name: 'Gross Profit', Source_Value: 57300000, Extracted_Value: 56550000 },
    { Field_Name: 'EBITDA', Source_Value: 28400000, Extracted_Value: 28400000 },
    { Field_Name: 'Net Income', Source_Value: 18200000, Extracted_Value: 18350000 },
    { Field_Name: 'Total Assets', Source_Value: 312000000, Extracted_Value: 312000000 },
    { Field_Name: 'Total Liabilities', Source_Value: 178000000, Extracted_Value: 179200000 },
    { Field_Name: 'Shareholders Equity', Source_Value: 134000000, Extracted_Value: 132800000 },
  ],
  meridian: [
    { Field_Name: 'Revenue', Source_Value: 89300000, Extracted_Value: 89300000 },
    { Field_Name: 'COGS', Source_Value: 41200000, Extracted_Value: 41800000 },
    { Field_Name: 'Gross Profit', Source_Value: 48100000, Extracted_Value: 47500000 },
    { Field_Name: 'EBITDA', Source_Value: 22100000, Extracted_Value: 21850000 },
    { Field_Name: 'Net Income', Source_Value: 14500000, Extracted_Value: 14500000 },
    { Field_Name: 'Total Assets', Source_Value: 198000000, Extracted_Value: 198000000 },
    { Field_Name: 'Total Liabilities', Source_Value: 112000000, Extracted_Value: 112700000 },
    { Field_Name: 'Shareholders Equity', Source_Value: 86000000, Extracted_Value: 85300000 },
  ],
  nexus: [
    { Field_Name: 'Revenue', Source_Value: 67800000, Extracted_Value: 67800000 },
    { Field_Name: 'COGS', Source_Value: 28900000, Extracted_Value: 28900000 },
    { Field_Name: 'Gross Profit', Source_Value: 38900000, Extracted_Value: 38900000 },
    { Field_Name: 'EBITDA', Source_Value: 15200000, Extracted_Value: 15200000 },
    { Field_Name: 'Net Income', Source_Value: 9800000, Extracted_Value: 9800000 },
    { Field_Name: 'Total Assets', Source_Value: 145000000, Extracted_Value: 145000000 },
  ],
};

export const emailThreads: EmailThread[] = [
  {
    id: 'e1', companyId: 'acme', subject: 'COGS Variance — Acme Corp Q4 2024',
    timestamp: '2025-03-15T14:30:00Z', from: 'audit@vantagecap.com', to: 'j.chen@acmecorp.com',
    body: 'James,\n\nDuring our Q4 2024 audit reconciliation for Acme Corp, we identified a variance of 0.88% in the Cost of Goods Sold line item. Our Snowflake source shows $85,200,000 while the extracted audit report value is $85,950,000.\n\nPlease provide documentation to clarify this discrepancy at your earliest convenience.\n\nRegards,\nVantage Audit Team',
    status: 'sent',
  },
  {
    id: 'e2', companyId: 'meridian', subject: 'Total Liabilities Discrepancy — Meridian Health Q4 2024',
    timestamp: '2025-03-16T09:15:00Z', from: 'audit@vantagecap.com', to: 's.johnson@meridianhealth.com',
    body: 'Sarah,\n\nWe have flagged a 0.63% variance in Total Liabilities for Meridian Health. Snowflake source: $112,000,000. Extracted: $112,700,000.\n\nPlease advise.\n\nRegards,\nVantage Audit Team',
    status: 'sent',
  },
];

export const calculateVariance = (source: number, extracted: number) => {
  if (source === 0) return { diff: extracted, percent: 0, isFlagged: false };
  const diff = extracted - source;
  const percent = diff / source;
  const isFlagged = Math.abs(percent) > 0.005;
  return { diff, percent, isFlagged };
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};
