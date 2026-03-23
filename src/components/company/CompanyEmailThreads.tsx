import { useState } from 'react';
import { useAppState } from '@/context/AppContext';
import { Mail, Send, Clock, ArrowLeft } from 'lucide-react';

export function CompanyEmailThreads({ companyId }: { companyId: string }) {
  const { emails } = useAppState();
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const companyEmails = emails.filter(e => e.companyId === companyId);
  const email = companyEmails.find(e => e.id === selectedEmail);

  if (companyEmails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <Mail className="h-8 w-8 text-gray-300" />
        <p className="text-sm text-gray-500">No email threads for this entity</p>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <div className="w-72 border-r border-gray-200 bg-white flex flex-col shrink-0">
        <div className="px-3 py-2.5 border-b border-gray-200">
          <p className="text-xs text-gray-500">{companyEmails.length} thread{companyEmails.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex-1 overflow-auto">
          {companyEmails.map(e => (
            <button
              key={e.id}
              onClick={() => setSelectedEmail(e.id)}
              className={`w-full text-left px-3 py-3 border-b border-gray-100 hover:bg-gray-50 transition-all ${selectedEmail === e.id ? 'bg-gray-50' : ''}`}
            >
              <div className="flex items-center gap-2 mb-1">
                {e.status === 'draft' ? <Clock className="h-3 w-3 text-yellow-500 shrink-0" /> : <Send className="h-3 w-3 text-green-500 shrink-0" />}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 uppercase">{e.status}</span>
              </div>
              <div className="text-sm font-medium text-gray-900 truncate">{e.subject}</div>
              <div className="text-xs text-gray-500 mt-0.5">{new Date(e.timestamp).toLocaleDateString()}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {email ? (
          <>
            <div className="px-4 py-3 border-b border-gray-200 bg-white">
              <button onClick={() => setSelectedEmail(null)} className="text-xs text-gray-500 hover:text-gray-900 mb-2 flex items-center gap-1 transition-all">
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
              <h2 className="text-sm font-bold text-gray-900">{email.subject}</h2>
              <div className="flex gap-4 mt-1.5">
                <span className="text-xs text-gray-500">From: <span className="text-gray-900 font-mono text-xs">{email.from}</span></span>
                <span className="text-xs text-gray-500">To: <span className="text-gray-900 font-mono text-xs">{email.to}</span></span>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-50">
              <pre className="text-sm text-gray-900 whitespace-pre-wrap font-sans leading-relaxed">{email.body}</pre>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Mail className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Select a thread to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
