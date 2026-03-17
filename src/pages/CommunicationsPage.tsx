import { useState } from 'react';
import { useAppState } from '@/context/AppContext';
import { Mail, Send, Clock, ArrowLeft } from 'lucide-react';

export default function CommunicationsPage() {
  const { emails, companies } = useAppState();
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  const email = emails.find(e => e.id === selectedEmail);

  return (
    <div className="h-full flex">
      {/* Thread list */}
      <div className="w-80 border-r border-border flex flex-col shrink-0">
        <div className="px-3 py-2.5 border-b border-border">
          <h1 className="text-sm font-semibold tracking-tight text-foreground">Communications</h1>
          <p className="text-xs text-muted-foreground">{emails.length} thread{emails.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex-1 overflow-auto">
          {emails.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No threads</p>
          ) : (
            emails.map(e => {
              const company = companies.find(c => c.id === e.companyId);
              return (
                <button
                  key={e.id}
                  onClick={() => setSelectedEmail(e.id)}
                  className={`w-full text-left px-3 py-3 border-b border-border hover:bg-surface transition-quart ${selectedEmail === e.id ? 'bg-surface' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {e.status === 'draft' ? (
                      <Clock className="h-3 w-3 text-warning shrink-0" />
                    ) : (
                      <Send className="h-3 w-3 text-success shrink-0" />
                    )}
                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                      {e.status === 'draft' ? 'Draft' : 'Sent'}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-foreground truncate">{e.subject}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {company?.name} · {new Date(e.timestamp).toLocaleDateString()}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Email detail */}
      <div className="flex-1 flex flex-col">
        {email ? (
          <>
            <div className="px-4 py-3 border-b border-border bg-surface">
              <button onClick={() => setSelectedEmail(null)} className="text-xs text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1 transition-quart">
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
              <h2 className="text-sm font-semibold text-foreground">{email.subject}</h2>
              <div className="flex gap-4 mt-1.5">
                <span className="text-xs text-muted-foreground">From: <span className="text-foreground font-mono text-xs">{email.from}</span></span>
                <span className="text-xs text-muted-foreground">To: <span className="text-foreground font-mono text-xs">{email.to}</span></span>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{email.body}</pre>
            </div>

            {email.status === 'draft' && (
              <div className="px-4 py-3 border-t border-border bg-surface flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-sm press-effect hover:opacity-90 transition-quart">
                  <Send className="h-3.5 w-3.5" /> Send Inquiry
                </button>
                <button className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-sm press-effect transition-quart">
                  Edit Draft
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Mail className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Select a thread to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
