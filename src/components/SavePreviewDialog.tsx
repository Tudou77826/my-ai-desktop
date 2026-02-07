// ==================== SavePreviewDialog Component ====================

import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';

interface SavePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath: string;
  diff: string;
  onConfirm: () => void;
}

export function SavePreviewDialog({
  open,
  onOpenChange,
  filePath,
  diff,
  onConfirm,
}: SavePreviewDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Preview Changes"
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Save Changes
          </Button>
        </>
      }
    >
      {/* File Path */}
      <p className="text-sm text-gray-600 mb-4">{filePath}</p>

      {/* Diff Preview */}
      <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
        <pre className="text-sm font-mono">
          {diff.split('\n').map((line, i) => {
            let colorClass = 'text-gray-300';
            if (line.startsWith('-')) {
              colorClass = 'text-red-400';
            } else if (line.startsWith('+')) {
              colorClass = 'text-green-400';
            }
            return (
              <div key={i} className={colorClass}>
                {line || ' '}
              </div>
            );
          })}
        </pre>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-400 rounded" />
          <span className="text-gray-600">Removed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded" />
          <span className="text-gray-600">Added</span>
        </div>
      </div>
    </Dialog>
  );
}
