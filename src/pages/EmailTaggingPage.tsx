import { useState } from 'react';
import { useAppState } from '@/context/AppContext';
import { companies } from '@/data/mockData';
import { Mail, Tag, Send, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function EmailTaggingPage() {
  const { emails } = useAppState();
  const entities = companies.filter(c => c.parentId !== null);
  const [tagOverrides, setTagOverrides] = useState<Record<string, string>>({});
  const [taggingEmailId, setTaggingEmailId] = useState<string | null>(null);

  const handleTag = (emailId: string, entityId: string) => {
    const entity = companies.find(c => c.id === entityId);
    setTagOverrides(prev => ({ ...prev, [emailId]: entityId }));
    setTaggingEmailId(null);
    toast.success(`Email tagged to ${entity?.name}`);
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Email Tagging</h1>
        <p className="text-xs text-muted-foreground">Tag emails to portfolio entities for organization</p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary/50">
              <th className="data-header text-left px-4 py-3">Status</th>
              <th className="data-header text-left px-4 py-3">Subject</th>
              <th className="data-header text-left px-4 py-3">From</th>
              <th className="data-header text-left px-4 py-3">To</th>
              <th className="data-header text-left px-4 py-3">Date</th>
              <th className="data-header text-left px-4 py-3">Tagged Entity</th>
              <th className="data-header text-center px-4 py-3 w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {emails.map(email => {
              const currentEntityId = tagOverrides[email.id] || email.companyId;
              const currentEntity = companies.find(c => c.id === currentEntityId);

              return (
                <tr key={email.id} className="border-t border-border hover:bg-accent/50 transition-quart">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {email.status === 'draft' ? (
                        <Clock className="h-3.5 w-3.5 text-warning" />
                      ) : (
                        <Send className="h-3.5 w-3.5 text-success" />
                      )}
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">{email.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm text-foreground truncate max-w-[250px]">{email.subject}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{email.from}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{email.to}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(email.timestamp).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {taggingEmailId === email.id ? (
                      <select
                        autoFocus
                        className="px-2 py-1 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        onChange={e => handleTag(email.id, e.target.value)}
                        onBlur={() => setTaggingEmailId(null)}
                        defaultValue={currentEntityId}
                      >
                        <option value="" disabled>Select entity...</option>
                        {entities.map(e => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm text-foreground">{currentEntity?.name || 'Untagged'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setTaggingEmailId(email.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-quart press-effect mx-auto"
                    >
                      <Tag className="h-3 w-3" /> Retag
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
