import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  PackageCheck, 
  Send, 
  User, 
  Building2, 
  Hash, 
  Plus,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { Requisition, RequisitionPriority, InventoryItem } from '../types.ts';

interface RequisitionsQueueProps {
  requisitions: Requisition[];
  inventoryItems: InventoryItem[];
  currentOperator: string;
  onFulfillRequisition: (reqId: string) => void;
  onOpenNewRequisition: () => void;
  isFulfillingId?: string | null;
}

export const RequisitionsQueue: React.FC<RequisitionsQueueProps> = ({
  requisitions,
  inventoryItems,
  currentOperator,
  onFulfillRequisition,
  onOpenNewRequisition,
  isFulfillingId,
}) => {
  const [filter, setFilter] = useState<'PENDENTES' | 'ATENDIDAS' | 'TODAS'>('PENDENTES');

  const filtered = requisitions.filter((r) => {
    if (filter === 'PENDENTES') return r.status === 'PENDENTE';
    if (filter === 'ATENDIDAS') return r.status === 'ATENDIDA';
    return true;
  });

  const getPriorityBadge = (priority: RequisitionPriority) => {
    switch (priority) {
      case 'URGENTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
            <Flame className="w-3.5 h-3.5 fill-rose-500" />
            URGENTE
          </span>
        );
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            Normal
          </span>
        );
      case 'BAIXA':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            Baixa
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      
      {/* Header bar */}
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            Balcão de Requisições & Atendimento
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Fila Ao Vivo
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pedidos de materiais enviados por equipes de manutenção, obras e operação.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Status filter */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('PENDENTES')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                filter === 'PENDENTES' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pendentes ({requisitions.filter(r => r.status === 'PENDENTE').length})
            </button>
            <button
              onClick={() => setFilter('ATENDIDAS')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                filter === 'ATENDIDAS' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Atendidas
            </button>
            <button
              onClick={() => setFilter('TODAS')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                filter === 'TODAS' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todas
            </button>
          </div>

          <button
            id="btn-add-requisition-queue"
            onClick={onOpenNewRequisition}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Requisição
          </button>
        </div>
      </div>

      {/* Requisitions List */}
      <div className="p-4 space-y-4 max-h-[640px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <PackageCheck className="w-9 h-9 text-slate-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-300">Nenhuma requisição nesta fila</p>
            <p className="text-xs text-slate-500">Todas as solicitações de materiais foram atendidas.</p>
          </div>
        ) : (
          filtered.map((req) => {
            const isPending = req.status === 'PENDENTE';
            
            // Validate if stock is available for each item
            let canFulfillAll = true;
            const itemsWithStock = req.items.map((item) => {
              const currentInv = inventoryItems.find((inv) => inv.id === item.itemId || inv.sku === item.sku);
              const available = currentInv ? currentInv.currentStock : 0;
              const hasEnough = available >= item.quantity;
              if (!hasEnough) canFulfillAll = false;
              return { ...item, available, hasEnough };
            });

            return (
              <div
                key={req.id}
                className={`rounded-xl border p-4 transition-all shadow-sm ${
                  req.priority === 'URGENTE' && isPending
                    ? 'bg-rose-950/20 border-rose-700/60 ring-1 ring-rose-500/20'
                    : isPending
                    ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/30 border-slate-800/60 opacity-80'
                }`}
              >
                {/* Requisition Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-amber-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      {req.code}
                    </span>
                    {getPriorityBadge(req.priority)}
                    {req.status === 'ATENDIDA' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Atendida por {req.attendedBy || 'Almoxarifado'}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-3">
                    <span>
                      Criado em: {new Date(req.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Requester and context */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300 py-3">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Solicitante: <strong className="text-white">{req.requesterName}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Setor: <strong className="text-white">{req.department}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ordem de Serviço: <strong className="text-amber-300">{req.workOrder || 'Avulsa'}</strong></span>
                  </div>
                </div>

                {/* Items requested table */}
                <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800/80 mt-1">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Itens Solicitados ({req.items.length})
                  </p>
                  <div className="space-y-1.5">
                    {itemsWithStock.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/40 last:border-b-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-amber-400 bg-slate-950 px-1 rounded">
                            {it.sku}
                          </span>
                          <span className="text-slate-200 font-medium">{it.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white">
                            {it.quantity} {it.unit}
                          </span>
                          {isPending && (
                            <span className={`text-[11px] font-mono ${it.hasEnough ? 'text-emerald-400' : 'text-rose-400 font-bold'}`}>
                              (Estoque: {it.available} {it.unit})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes if any */}
                {req.notes && (
                  <p className="text-xs text-slate-400 italic mt-2.5">
                    Obs: {req.notes}
                  </p>
                )}

                {/* Footer action */}
                {isPending && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      {!canFulfillAll ? (
                        <p className="text-xs text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Alerta: Saldo insuficiente em um ou mais itens para atendimento total.
                        </p>
                      ) : (
                        <p className="text-xs text-emerald-400/90 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Estoque disponível conferido para entrega imediata.
                        </p>
                      )}
                    </div>

                    <button
                      id={`btn-fulfill-${req.id}`}
                      onClick={() => onFulfillRequisition(req.id)}
                      disabled={!canFulfillAll || isFulfillingId === req.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>{isFulfillingId === req.id ? 'Baixando Estoque...' : 'Atender e Liberar Material'}</span>
                    </button>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
