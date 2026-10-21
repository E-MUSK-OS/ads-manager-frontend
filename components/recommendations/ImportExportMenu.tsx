import React, { useRef, useState } from 'react';
import { ArrowUpDown, Download, Upload, Copy, XCircle } from 'lucide-react';
import { Popover } from '@/components/ui/Popover';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { exportRules, importRules } from '@/lib/recommendations-api';
import { useToast } from '@/components/ui/toast';

interface ImportExportMenuProps {
  adsAccountId: number | null;
  selectedIds: number[];
  onDuplicate: (ruleId: number) => Promise<void>;
  onImportComplete: () => void;
}

interface ImportSummary {
  created: number;
  skipped: number;
  invalid: Array<{ index: number; name?: string; reason: string }>;
}

export function ImportExportMenu({
  adsAccountId,
  selectedIds,
  onDuplicate,
  onImportComplete,
}: ImportExportMenuProps) {
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);

  const hasSelection = selectedIds.length > 0;
  const isSingleSelection = selectedIds.length === 1;

  // Export selected rules as JSON Blob
  const handleExport = async () => {
    if (!adsAccountId || !hasSelection) return;
    setPopoverOpen(false);

    try {
      const data = await exportRules(selectedIds);
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const today = new Intl.DateTimeFormat('en-CA').format(new Date());
      const filename = `recommendation-rules-${today}.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      success(`Exported ${selectedIds.length} rule${selectedIds.length > 1 ? 's' : ''}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to export rules';
      toastError('Export failed', msg);
    }
  };

  // Open file picker for import
  const handlePickFile = () => {
    setPopoverOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adsAccountId) return;

    // Reset input so re-selecting same file works
    e.target.value = '';

    setImporting(true);
    setImportResult(null);
    setImportModalOpen(true);

    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON file format');
      }

      const rulesArray = (Array.isArray(parsed) ? parsed : [parsed]) as Array<Record<string, unknown>>;
      const result = await importRules(adsAccountId, rulesArray);

      const created = result.results.filter((r) => r.status === 'created').length;
      const skipped = result.results.filter((r) => r.status === 'skipped').length;
      const invalid = result.results
        .filter((r) => r.status === 'invalid')
        .map((r, i) => ({ index: i, name: r.name, reason: r.reason || 'Invalid rule' }));

      setImportResult({ created, skipped, invalid });
      if (created > 0) {
        onImportComplete();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process import';
      toastError('Import failed', msg);
      setImportModalOpen(false);
    } finally {
      setImporting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!isSingleSelection) return;
    setPopoverOpen(false);
    try {
      await onDuplicate(selectedIds[0]);
    } catch {
      // toast handled in hook
    }
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      <Popover
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
        trigger={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 px-2.5"
            title="Import, Export & Actions"
            aria-label="Import and Export Menu"
          >
            <ArrowUpDown className="size-4" />
          </Button>
        }
        align="end"
      >
        <div className="flex flex-col py-1 w-44">
          {/* Export Selected */}
          <button
            type="button"
            disabled={!hasSelection}
            onClick={handleExport}
            className="flex items-center gap-2.5 px-3 py-2 text-xs text-text-main hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors text-left"
          >
            <Download className="size-3.5 text-text-muted" />
            <span>Export selected {hasSelection ? `(${selectedIds.length})` : ''}</span>
          </button>

          {/* Import Rules */}
          <button
            type="button"
            onClick={handlePickFile}
            className="flex items-center gap-2.5 px-3 py-2 text-xs text-text-main hover:bg-slate-100 transition-colors text-left"
          >
            <Upload className="size-3.5 text-text-muted" />
            <span>Import rules…</span>
          </button>

          <div className="border-t border-border-dim/60 my-1" />

          {/* Duplicate Rule */}
          <button
            type="button"
            disabled={!isSingleSelection}
            onClick={handleDuplicate}
            className="flex items-center gap-2.5 px-3 py-2 text-xs text-text-main hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors text-left"
          >
            <Copy className="size-3.5 text-text-muted" />
            <span>Duplicate rule</span>
          </button>
        </div>
      </Popover>

      {/* Import Result Dialog */}
      <Modal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Rule Import Summary"
        size="md"
      >
        <div className="flex flex-col gap-4">
          {importing ? (
            <div className="py-8 text-center text-xs text-text-muted">
              Importing and validating rules…
            </div>
          ) : importResult ? (
            <div className="flex flex-col gap-3">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-md bg-slate-50 border border-border-dim text-center">
                <div>
                  <div className="text-lg font-bold font-mono text-emerald-600">
                    {importResult.created}
                  </div>
                  <div className="text-[11px] text-text-muted font-medium">Created</div>
                </div>
                <div>
                  <div className="text-lg font-bold font-mono text-amber-600">
                    {importResult.skipped}
                  </div>
                  <div className="text-[11px] text-text-muted font-medium">Skipped</div>
                </div>
                <div>
                  <div className="text-lg font-bold font-mono text-rose-600">
                    {importResult.invalid.length}
                  </div>
                  <div className="text-[11px] text-text-muted font-medium">Invalid</div>
                </div>
              </div>

              {/* Invalid items detail list if any */}
              {importResult.invalid.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-danger flex items-center gap-1">
                    <XCircle className="size-3.5" />
                    Invalid Rules:
                  </span>
                  <div className="max-h-40 overflow-y-auto divide-y divide-border-dim border border-border-dim rounded bg-surface p-2 text-xs">
                    {importResult.invalid.map((item, idx) => (
                      <div key={idx} className="py-1">
                        <span className="font-semibold">{item.name || `Rule #${item.index + 1}`}: </span>
                        <span className="text-text-muted">{item.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={() => setImportModalOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
