import { useState } from 'react';
import { emailTemplates as initialTemplates, EmailTemplate } from '@/data/mockData';
import { Mail, Edit2, Save, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

const categoryBadge: Record<string, string> = {
  discrepancy: 'bg-red-100 text-red-800',
  'follow-up': 'bg-yellow-100 text-yellow-800',
  confirmation: 'bg-green-100 text-green-800',
  general: 'bg-blue-100 text-blue-800',
};

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(initialTemplates);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editCategory, setEditCategory] = useState<EmailTemplate['category']>('general');

  const startEdit = (t: EmailTemplate) => {
    setEditingId(t.id);
    setEditName(t.name);
    setEditSubject(t.subject);
    setEditBody(t.body);
    setEditCategory(t.category);
  };

  const saveEdit = () => {
    if (!editingId) return;
    setTemplates(prev => prev.map(t =>
      t.id === editingId ? { ...t, name: editName, subject: editSubject, body: editBody, category: editCategory } : t
    ));
    setEditingId(null);
    toast.success('Template saved');
  };

  const addTemplate = () => {
    const newTemplate: EmailTemplate = {
      id: `tmpl-${Date.now()}`,
      name: 'New Template',
      subject: '',
      body: '',
      category: 'general',
    };
    setTemplates(prev => [...prev, newTemplate]);
    startEdit(newTemplate);
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-xs text-gray-500 mt-1">Predefined templates for audit communications</p>
        </div>
        <button onClick={addTemplate} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm bg-blue-500 text-white hover:bg-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <Plus className="h-3.5 w-3.5" /> New Template
        </button>
      </div>

      <div className="space-y-4">
        {templates.map(t => (
          <div key={t.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all">
            {editingId === t.id ? (
              <div className="p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Template Name</label>
                    <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div className="w-40">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Category</label>
                    <select value={editCategory} onChange={e => setEditCategory(e.target.value as EmailTemplate['category'])} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="discrepancy">Discrepancy</option>
                      <option value="follow-up">Follow-Up</option>
                      <option value="confirmation">Confirmation</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Subject</label>
                  <input value={editSubject} onChange={e => setEditSubject(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Body</label>
                  <textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={8} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none leading-relaxed" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={saveEdit} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm bg-blue-500 text-white hover:bg-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <Save className="h-3.5 w-3.5" /> Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-semibold text-gray-900">{t.name}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryBadge[t.category] || 'bg-gray-100 text-gray-800'}`}>{t.category}</span>
                  </div>
                  <button onClick={() => startEdit(t)} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-all">
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                </div>
                <div className="text-xs text-gray-500 mb-1">Subject: <span className="font-mono text-gray-900">{t.subject}</span></div>
                <pre className="text-xs text-gray-500 whitespace-pre-wrap font-sans mt-2 bg-gray-50 rounded-lg p-3 leading-relaxed border border-gray-100">{t.body}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
