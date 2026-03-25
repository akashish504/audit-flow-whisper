import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FileText } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { SourceReference } from '@/data/mockData';

interface FilePageViewerProps {
  sourceRef: SourceReference | null;
  fieldName: string;
  open: boolean;
  onClose: () => void;
}

const TOTAL_PAGES = 42;

export function FilePageViewer({ sourceRef, fieldName, open, onClose }: FilePageViewerProps) {
  const targetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && targetRef.current) {
      // Small delay to let dialog render
      setTimeout(() => {
        targetRef.current?.scrollIntoView({ behavior: 'auto', block: 'center' });
      }, 150);
    }
  }, [open, sourceRef]);

  if (!sourceRef) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-3xl bg-background max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-destructive/60 shrink-0" />
            <span className="truncate">{sourceRef.fileName}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Showing source for <span className="font-medium text-foreground">{fieldName}</span> — Page {sourceRef.page}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable full PDF view */}
        <div className="flex-1 min-h-0 bg-muted rounded-lg border border-border overflow-auto">
          <div className="flex flex-col items-center gap-4 p-6">
            {Array.from({ length: TOTAL_PAGES }, (_, i) => {
              const page = i + 1;
              const isTarget = page === sourceRef.page;
              return (
                <div
                  key={page}
                  ref={isTarget ? targetRef : undefined}
                  className={`bg-background border rounded-md shadow-sm w-full max-w-md aspect-[3/4] flex flex-col items-center justify-center gap-3 relative transition-all ${
                    isTarget ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                  }`}
                >
                  <div className="absolute top-3 right-3 text-[10px] text-muted-foreground font-mono">
                    Page {page}
                  </div>
                  <FileText className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">Page {page} of {TOTAL_PAGES}</p>
                  {isTarget && (
                    <div className="mt-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded text-xs text-primary font-medium">
                      ✦ {fieldName} value extracted from this page
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
