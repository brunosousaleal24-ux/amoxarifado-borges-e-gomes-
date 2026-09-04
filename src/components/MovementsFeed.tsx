import React, { useState, useMemo } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  RotateCcw, 
  SlidersHorizontal, 
  FileCheck, 
  Printer, 
  Search, 
  Clock, 
  User, 
  Building2, 
  Hash,
  Sparkles
} from 'lucide-react';
import { StockMovement, MovementType } from '../types.ts';

interface MovementsFeedProps {
  movements: StockMovement[];
  onPrintReceipt: (movement: StockMovement) => void;
}

export const MovementsFeed: React.FC<MovementsFeedProps> = ({
  movements,
  onPrintReceipt,
}) => {
  const [typeFilter, setTypeFilter] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const matchesType = typeFilter === 'TODOS' || m.type === typeFilter;
      const matchesSearch = 
        m.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.itemSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.operator.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [movements, typeFilter, searchTerm]);

  const getTypeBadge = (type: MovementType) => {
    switch (type) {
      case 'ENTRADA':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            ENTRADA
          </span>
        );
      case 'SAIDA':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ArrowUpRight className="w-3.5 h-3.5" />
            SAÍDA
          </span>
        );
      case 'DEVOLUCAO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <RotateCcw className="w-3.5 h-3.5" />
            DEVOLUÇÃO
          </span>
        );
      case 'AJUSTE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            AJUSTE
          </span>
        );
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' - ' + d.toLocaleDateString('pt-BR');
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      
      {/* Header & Filters */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Feed de Movimentações ao Vivo
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Histórico auditável e sincronizado instantaneamente em todos os terminais.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar movimentação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Type filters */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {['TODOS', 'ENTRADA', 'SAIDA', 'DEVOLUCAO', 'AJUSTE'].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  typeFilter === type
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type === 'TODOS' ? 'Todos' : type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Movements list */}
      <div className="divide-y divide-slate-800/60 max-h-[620px] overflow-y-auto">
        {filteredMovements.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-300">Nenhuma movimentação encontrada</p>
            <p className="text-xs text-slate-500">Registros de entrada e saída aparecerão aqui em tempo real.</p>
          </div>
        ) : (
          filteredMovements.map((mov, index) => {
            const isLatest = index === 0;

            return (
              <div 
                key={mov.id} 
                className={`p-4 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isLatest ? 'bg-amber-500/[0.03]' : ''
                }`}
              >
                {/* Left: Type, SKU, Name, Reason */}
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5">
                    {getTypeBadge(mov.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        {mov.itemSku}
                      </span>
                      <span className="font-bold text-slate-100 text-sm">
                        {mov.itemName}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        Destino/Setor: <strong className="text-slate-200">{mov.recipient}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-amber-300/90">
                        <Hash className="w-3.5 h-3.5 text-slate-500" />
                        Ref: {mov.reason}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        Almoxarife: {mov.operator}
                      </span>
                    </div>

                    {mov.notes && (
                      <p className="text-[11px] text-slate-500 italic mt-1 bg-slate-950/60 p-1.5 rounded border border-slate-800/60 max-w-xl">
                        Obs: {mov.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Quantity delta, Cost, Timestamp & Print button */}
                <div className="flex items-center justify-between md:justify-end gap-5 shrink-0">
                  <div className="text-right">
                    <div className="text-base font-black tracking-tight">
                      <span className={
                        mov.type === 'ENTRADA' || mov.type === 'DEVOLUCAO'
                          ? 'text-emerald-400' 
                          : mov.type === 'SAIDA'
                          ? 'text-rose-400' 
                          : 'text-purple-400'
                      }>
                        {mov.type === 'ENTRADA' || mov.type === 'DEVOLUCAO' ? '+' : mov.type === 'SAIDA' ? '-' : '±'}
                        {mov.quantity} {mov.unit}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Saldo: {mov.previousStock} → <strong className="text-slate-200">{mov.newStock} {mov.unit}</strong>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {formatTimestamp(mov.timestamp)}
                    </div>
                  </div>

                  {/* Print / View receipt */}
                  <button
                    id={`btn-print-${mov.id}`}
                    onClick={() => onPrintReceipt(mov)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                    title="Emitir Comprovante / Cautela de Retirada"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Cautela</span>
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
