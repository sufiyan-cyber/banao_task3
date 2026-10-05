import React from 'react';
import { History, Clock, User, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-[#E8E4DF] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8E4DF] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-[#B8860B]" />
            <h3 className="font-serif font-bold text-[#1A1A1A] text-base">
              Batch Traceability Log: <span className="font-mono text-[#B8860B]">{batchNumber}</span> ({sku})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#E8E4DF]/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-[#FAFAF8]">
          {logs.length === 0 ? (
            <p className="text-sm text-[#6B6B6B] text-center py-8 italic font-serif">
              No audit records found for this production batch.
            </p>
          ) : (
            <ol className="relative border-l border-[#E8E4DF] ml-3 space-y-5">
              {logs.map((log) => {
                let parsedMeta: any = null;
                try {
                  if (log.metadata) parsedMeta = JSON.parse(log.metadata);
                } catch {}

                return (
                  <li key={log.id} className="ml-6">
                    <span className="absolute -left-2 flex items-center justify-center w-4 h-4 bg-white rounded-full ring-4 ring-[#FAFAF8] border-2 border-[#B8860B]" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="small-caps text-[11px] text-[#1A1A1A] font-bold">
                        {log.event.replace(/_/g, ' ')}
                      </span>
                      <time className="text-[#A39B8E] font-mono text-[10px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#B8860B]" />
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </time>
                    </div>
                    <div className="text-xs text-[#6B6B6B] mt-0.5 flex items-center gap-1.5 font-sans">
                      <User className="w-3 h-3 text-[#A39B8E]" />
                      <span>
                        Operator/Actor: <strong className="text-[#1A1A1A] font-medium">{log.actor}</strong>
                      </span>
                    </div>

                    {parsedMeta && (
                      <div className="mt-2.5 bg-white p-3 rounded-md border border-[#E8E4DF] text-xs font-mono text-[#1A1A1A] overflow-x-auto shadow-sm">
                        <pre className="text-[11px] whitespace-pre-wrap">{JSON.stringify(parsedMeta, null, 2)}</pre>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="px-6 py-3.5 border-t border-[#E8E4DF] bg-[#FAF8F5] flex justify-end">
          <button type="button" onClick={onClose} className="btn-secondary text-xs">
            Close Archive
          </button>
        </div>
      </div>
    </div>
  );
}
