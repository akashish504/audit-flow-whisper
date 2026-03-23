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
        <h1 className="text-2xl font-bold text-gray-900">Email Tagging</h1>
        <p className="text-xs text-gray-500 mt-1">Tag emails to portfolio entities for organization</p>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">Status</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">Subject</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">From</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">To</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">Date</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">Tagged Entity</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-center px-4 py-3 w-24">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {emails.map(email => {
              const currentEntityId = tagOverrides[email.id] || email.companyId;
              const currentEntity = companies.find(c => c.id === currentEntityId);

              return (
                <tr key={email.id} className="hover:bg-gray-50 transition-all">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${email.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {email.status === 'draft' ? <Clock className="h-3 w-3" /> : <Send className="h-3 w-3" />}
                      <span className="capitalize">{email.status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500 shrink-0" />
                      <span className="text-sm text-gray-900 truncate max-w-[250px]">{email.subject}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">{email.from}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">{email.to}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(email.timestamp).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {taggingEmailId === email.id ? (
                      <select
                        autoFocus
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      <span className="text-sm text-gray-900">{currentEntity?.name || 'Untagged'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setTaggingEmailId(email.id)}
                      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-all mx-auto"
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
