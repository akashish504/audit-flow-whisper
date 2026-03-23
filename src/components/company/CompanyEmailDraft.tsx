import { useState } from 'react';
import { useAppState } from '@/context/AppContext';
import { emailTemplates } from '@/data/mockData';
import { Send, FileText } from 'lucide-react';
import { toast } from 'sonner';

export function CompanyEmailDraft({ companyId }: { companyId: string }) {
  const { companies, addEmail } = useAppState();
  const company = companies.find(c => c.id === companyId);

  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [to, setTo] = useState(company?.contactEmail || '');

  const handleTemplateSelect = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (!template || !company) return;
    setSelectedTemplate(templateId);

    const replaceVars = (text: string) =>
      text
        .replace(/\{\{company_name\}\}/g, company.name)
        .replace(/\{\{contact_name\}\}/g, company.contactName)
        .replace(/\{\{audit_period\}\}/g, company.auditPeriod)
        .replace(/\{\{field_name\}\}/g, '[Field Name]')
        .replace(/\{\{variance_percent\}\}/g, '[X.XX%]')
        .replace(/\{\{source_value\}\}/g, '[$Source]')
        .replace(/\{\{extracted_value\}\}/g, '[$Extracted]')
        .replace(/\{\{subject\}\}/g, '[Subject]');

    setSubject(replaceVars(template.subject));
    setBody(replaceVars(template.body));
  };

  const handleSend = (asDraft: boolean) => {
    if (!subject.trim() || !body.trim() || !to.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    addEmail({
      id: `e-${Date.now()}`,
      companyId,
      subject,
      timestamp: new Date().toISOString(),
      from: 'audit@vantagecap.com',
      to,
      body,
      status: asDraft ? 'draft' : 'sent',
    });
    toast.success(asDraft ? 'Draft saved' : 'Email sent');
    setSubject('');
    setBody('');
    setSelectedTemplate('');
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-4">
        <label className="text-xs font-medium text-gray-500 block mb-1.5">Use Template</label>
        <select
          value={selectedTemplate}
          onChange={(e) => handleTemplateSelect(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">— Select a template —</option>
          {emailTemplates.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="text-xs font-medium text-gray-500 block mb-1.5">To</label>
        <input
          value={to}
          onChange={e => setTo(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="recipient@example.com"
        />
      </div>

      <div className="mb-3">
        <label className="text-xs font-medium text-gray-500 block mb-1.5">Subject</label>
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Email subject..."
        />
      </div>

      <div className="mb-4">
        <label className="text-xs font-medium text-gray-500 block mb-1.5">Body</label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={10}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none leading-relaxed"
          placeholder="Write your email..."
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleSend(false)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm bg-blue-500 text-white hover:bg-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Send className="h-3.5 w-3.5" /> Send
        </button>
        <button
          onClick={() => handleSend(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <FileText className="h-3.5 w-3.5" /> Save as Draft
        </button>
      </div>
    </div>
  );
}
