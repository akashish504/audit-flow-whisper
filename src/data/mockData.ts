export type AuditStatus = 'Pending Review' | 'Discrepancy Identified' | 'Clarification Requested' | 'Resolved';

export interface AuditPeriod {
  id: string;
  label: string;
  status: AuditStatus;
  isActive: boolean;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  parentId: string | null;
  status: AuditStatus;
  auditPeriod: string;
  auditPeriods: AuditPeriod[];
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

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'discrepancy' | 'follow-up' | 'confirmation' | 'general';
}

export interface TaggedFile {
  id: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  size: string;
  taggedEntityId: string | null;
  taggedEntityName: string | null;
  status: 'processed' | 'pending' | 'error';
}

export interface AuditLogEntry {
  id: string;
  companyId: string;
  action: string;
  timestamp: string;
  user: string;
  details: string;
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

export const emailTemplates: EmailTemplate[] = [
  {
    id: 'tmpl-1',
    name: 'Discrepancy Notification',
    subject: '{{field_name}} Variance — {{company_name}} {{audit_period}}',
    body: '{{contact_name}},\n\nDuring our {{audit_period}} audit reconciliation for {{company_name}}, we identified a variance of {{variance_percent}} in the {{field_name}} line item.\n\nSnowflake source: {{source_value}}\nExtracted value: {{extracted_value}}\n\nPlease provide documentation to clarify this discrepancy at your earliest convenience.\n\nRegards,\nVantage Audit Team',
    category: 'discrepancy',
  },
  {
    id: 'tmpl-2',
    name: 'Follow-Up Request',
    subject: 'Follow-Up: {{subject}} — {{company_name}}',
    body: '{{contact_name}},\n\nThis is a follow-up regarding our previous communication about {{subject}}.\n\nWe have not yet received the requested documentation. Could you please provide an update on the status?\n\nRegards,\nVantage Audit Team',
    category: 'follow-up',
  },
  {
    id: 'tmpl-3',
    name: 'Resolution Confirmation',
    subject: 'Resolved: {{field_name}} — {{company_name}} {{audit_period}}',
    body: '{{contact_name}},\n\nWe are writing to confirm that the {{field_name}} discrepancy for {{company_name}} has been resolved following review of the documentation provided.\n\nThank you for your cooperation.\n\nRegards,\nVantage Audit Team',
    category: 'confirmation',
  },
  {
    id: 'tmpl-4',
    name: 'Audit Report Request',
    subject: 'Audit Report Request — {{company_name}} {{audit_period}}',
    body: '{{contact_name}},\n\nAs part of our {{audit_period}} review, we kindly request that you submit the audit report for {{company_name}} at your earliest convenience.\n\nPlease upload the report to the secure portal or reply to this email with the attached document.\n\nRegards,\nVantage Audit Team',
    category: 'general',
  },
];

export const taggedFiles: TaggedFile[] = [
  { id: 'f1', fileName: 'Acme_Corp_Q4_2024_Audit.pdf', fileType: 'pdf', uploadedAt: '2025-03-10T08:00:00Z', size: '2.4 MB', taggedEntityId: 'acme', taggedEntityName: 'Acme Corp', status: 'processed' },
  { id: 'f2', fileName: 'Meridian_Health_Financials.pdf', fileType: 'pdf', uploadedAt: '2025-03-11T10:30:00Z', size: '1.8 MB', taggedEntityId: 'meridian', taggedEntityName: 'Meridian Health', status: 'processed' },
  { id: 'f3', fileName: 'Nexus_Tech_Q4_Report.pdf', fileType: 'pdf', uploadedAt: '2025-03-12T14:00:00Z', size: '3.1 MB', taggedEntityId: 'nexus', taggedEntityName: 'Nexus Technologies', status: 'processed' },
  { id: 'f4', fileName: 'Acme_Asia_Supplementary.pdf', fileType: 'pdf', uploadedAt: '2025-03-13T09:20:00Z', size: '890 KB', taggedEntityId: 'acme-asia', taggedEntityName: 'Acme Asia Pacific', status: 'processed' },
  { id: 'f5', fileName: 'Meridian_Pharma_Draft.pdf', fileType: 'pdf', uploadedAt: '2025-03-14T16:45:00Z', size: '1.2 MB', taggedEntityId: null, taggedEntityName: null, status: 'pending' },
  { id: 'f6', fileName: 'Unidentified_Report_March.pdf', fileType: 'pdf', uploadedAt: '2025-03-15T11:00:00Z', size: '4.5 MB', taggedEntityId: null, taggedEntityName: null, status: 'pending' },
];

export const auditLogs: AuditLogEntry[] = [
  { id: 'al1', companyId: 'acme', action: 'Report Attached', timestamp: '2025-03-10T08:05:00Z', user: 'System', details: 'Audit report uploaded and attached to Acme Corp' },
  { id: 'al2', companyId: 'acme', action: 'Discrepancy Flagged', timestamp: '2025-03-15T14:28:00Z', user: 'audit@vantagecap.com', details: 'COGS variance of 0.88% flagged for review' },
  { id: 'al3', companyId: 'acme', action: 'Email Sent', timestamp: '2025-03-15T14:30:00Z', user: 'audit@vantagecap.com', details: 'Discrepancy notification sent to j.chen@acmecorp.com' },
  { id: 'al4', companyId: 'meridian', action: 'Report Attached', timestamp: '2025-03-11T10:35:00Z', user: 'System', details: 'Audit report uploaded and attached to Meridian Health' },
  { id: 'al5', companyId: 'meridian', action: 'Discrepancy Flagged', timestamp: '2025-03-16T09:10:00Z', user: 'audit@vantagecap.com', details: 'Total Liabilities variance of 0.63% flagged for review' },
  { id: 'al6', companyId: 'nexus', action: 'Report Attached', timestamp: '2025-03-12T14:05:00Z', user: 'System', details: 'Audit report uploaded and attached to Nexus Technologies' },
  { id: 'al7', companyId: 'nexus', action: 'Status Changed', timestamp: '2025-03-13T11:00:00Z', user: 'audit@vantagecap.com', details: 'Status changed to Clarification Requested' },
  { id: 'al8', companyId: 'acme-asia', action: 'Status Changed', timestamp: '2025-03-14T09:00:00Z', user: 'audit@vantagecap.com', details: 'Status changed to Resolved' },
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
