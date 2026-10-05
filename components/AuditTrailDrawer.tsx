import React from 'react';
import { History, ShieldCheck, Clock, User, X } from 'lucide-react';

export interface AuditLogItem {
  id: string;
  event: string;
  actor: string;
  metadata?: string | null;
  createdAt: string | Date;
}

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchNumber: string;
  sku: string;
  logs: AuditLogItem[];
}

export function AuditTrailModal({ isOpen, onClose, batchNumber, sku, logs }: AuditTrailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Batch Traceability Audit Trail: <span className="font-mono text-blue-700">{batchNumber}</span> ({sku})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No audit records found for this batch.</p>
          ) : (
            <ol className="relative border-l border-slate-200 ml-3 space-y-4">
              {logs.map((log) => {
                let parsedMeta: any = null;
                try {
                  if (log.metadata) parsedMeta = JSON.parse(log.metadata);
                } catch {}

                return (
                  <li key={log.id} className="ml-5">
                    <span className="absolute -left-2 flex items-center justify-center w-4 h-4 bg-blue-100 rounded-full ring-4 ring-white border border-blue-400" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 uppercase tracking-wide">
                        {log.event.replace(/_/g, ' ')}
                      </span>
                      <time className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </time>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>Actor: <strong className="text-slate-800">{log.actor}</strong></span>
                    </div>

                    {parsedMeta && (
                      <div className="mt-2 bg-slate-50 p-2.5 rounded border border-slate-200 text-xs font-mono text-slate-700 overflow-x-auto">
                        <pre className="text-[11px] whitespace-pre-wrap">{JSON.stringify(parsedMeta, null, 2)}</pre>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button type="button" onClick={onClose} className="btn-secondary text-xs">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
