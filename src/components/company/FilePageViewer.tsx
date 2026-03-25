import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import type { SourceReference } from '@/data/mockData';

interface FilePageViewerProps {
  sourceRef: SourceReference | null;
  fieldName: string;
  open: boolean;
  onClose: () => void;
}

export function FilePageViewer({ sourceRef, fieldName, open, onClose }: FilePageViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 42; // simulated total

  useEffect(() => {
    if (sourceRef) setCurrentPage(sourceRef.page);
  }, [sourceRef]);

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
            Showing source for <span className="font-medium text-foreground">{fieldName}</span> — Page {currentPage}
          </DialogDescription>
        </DialogHeader>

        {/* Page viewer */}
        <div className="flex-1 min-h-0 bg-muted rounded-lg border border-border overflow-auto">
          <div className="flex flex-col items-center justify-center p-8 min-h-[450px]">
            {/* Simulated page */}
            <div className="bg-background border border-border rounded-md shadow-sm w-full max-w-md aspect-[3/4] flex flex-col items-center justify-center gap-3 relative">
              <div className="absolute top-3 right-3 text-[10px] text-muted-foreground font-mono">
                Page {currentPage}
              </div>
              <FileText className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-foreground">{sourceRef.fileName}</p>
              <p className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</p>
              {currentPage === sourceRef.page && (
                <div className="mt-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded text-xs text-primary font-medium">
                  ✦ {fieldName} value extracted from this page
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Page</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={e => {
                const v = parseInt(e.target.value);
                if (v >= 1 && v <= totalPages) setCurrentPage(v);
              }}
              className="w-14 text-center text-sm border border-border rounded px-1.5 py-1 bg-background text-foreground"
            />
            <span className="text-xs text-muted-foreground">of {totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
