import React, { useState, useRef, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Settings, ChevronDown, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);

  const currencySymbol = currency === 'USD' ? '$' : '₹';
  const exchangeDisplay = currency === 'USD' ? '$1 = ₹93.0000' : '₹1 = $0.0108';

  const handleSyncData = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success('Data synced successfully');
    }, 4000);
  };

  useEffect(() => {
    if (!currencyDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) setCurrencyDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [currencyDropdownOpen]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Sync blocking overlay */}
          {isSyncing && (
            <div className="absolute inset-0 z-[100] bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm font-medium text-gray-700">Syncing data, please wait...</p>
              </div>
            </div>
          )}

          <header className="h-10 flex items-center justify-between border-b border-gray-200 bg-white px-2 shrink-0 z-10">
            <SidebarTrigger className="text-gray-400 hover:text-gray-600" />

            <div className="flex items-center gap-2 pr-2">
              {/* Currency Settings */}
              <div className="relative" ref={currencyRef}>
                <button
                  onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-gray-300 rounded-md text-xs text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Settings className="h-3.5 w-3.5 text-gray-400" />
                  <span className="font-medium">{currencySymbol}</span>
                  <span>{currency}</span>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </button>
                {currencyDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[220px]">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Currency Settings</p>
                    <p className="text-sm text-gray-800 font-medium mb-0.5">{currencySymbol}&nbsp; Current: {currency}</p>
                    <p className="text-xs text-gray-500 mb-3">Rate: {exchangeDisplay}</p>
                    <button
                      onClick={() => {
                        setCurrency(currency === 'USD' ? 'INR' : 'USD');
                        setCurrencyDropdownOpen(false);
                        toast.success(`Currency switched to ${currency === 'USD' ? 'INR' : 'USD'}`);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit Currency Settings
                    </button>
                  </div>
                )}
              </div>

              {/* Sync Data */}
              <button
                onClick={handleSyncData}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {isSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                {isSyncing ? 'Syncing...' : 'Sync Data'}
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-hidden bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
