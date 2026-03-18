import { useState } from 'react';
import { emailTemplates as initialTemplates, EmailTemplate } from '@/data/mockData';
import { Mail, Edit2, Save, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

const categoryColors: Record<string, string> = {
  discrepancy: 'bg-destructive/10 text-destructive border-destructive/30',
  'follow-up': 'bg-warning/10 text-warning border-warning/30',
  confirmation: 'bg-success/10 text-success border-success/30',
  general: 'bg-primary/10 text-primary border-primary/30',
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
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Email Templates</h1>
          <p className="text-xs text-muted-foreground">Predefined templates for audit communications</p>
        </div>
        <button onClick={addTemplate} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md press-effect hover:opacity-90 transition-quart">
          <Plus className="h-3.5 w-3.5" /> New Template
        </button>
      </div>

      <div className="space-y-4">
        {templates.map(t => (
          <div key={t.id} className="bg-card border border-border rounded-lg overflow-hidden">
            {editingId === t.id ? (
              <div className="p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground block mb-1">Template Name</label>
                    <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="w-40">
                    <label className="text-xs text-muted-foreground block mb-1">Category</label>
                    <select value={editCategory} onChange={e => setEditCategory(e.target.value as EmailTemplate['category'])} className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="discrepancy">Discrepancy</option>
                      <option value="follow-up">Follow-Up</option>
                      <option value="confirmation">Confirmation</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Subject</label>
                  <input value={editSubject} onChange={e => setEditSubject(e.target.value)} className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Body</label>
                  <textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={8} className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono resize-none leading-relaxed" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={saveEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md press-effect hover:opacity-90 transition-quart">
                    <Save className="h-3.5 w-3.5" /> Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md press-effect transition-quart">
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">{t.name}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm border ${categoryColors[t.category]}`}>{t.category}</span>
                  </div>
                  <button onClick={() => startEdit(t)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-quart press-effect">
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                </div>
                <div className="text-xs text-muted-foreground mb-1">Subject: <span className="font-mono text-foreground">{t.subject}</span></div>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans mt-2 bg-secondary/30 rounded-md p-3 leading-relaxed">{t.body}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
