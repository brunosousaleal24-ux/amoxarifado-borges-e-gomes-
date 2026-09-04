import React from 'react';
import { 
  Package, 
  CircleDollarSign, 
  AlertTriangle, 
  ArrowLeftRight, 
  Clock, 
  TrendingDown,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { RealtimeServerState } from '../types.ts';

interface MetricCardsProps {
  stats: RealtimeServerState['stats'];
  onSelectAlerts: () => void;
  onSelectRequisitions: () => void;
  onSelectMovements: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  stats,
  onSelectAlerts,
  onSelectRequisitions,
  onSelectMovements,
}) => {
  const formattedValuation = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(stats.totalValuation);

  const totalAlerts = stats.criticalAlertsCount + stats.lowStockAlertsCount;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
      
      {/* 1. Total de Itens Cadastrados */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total SKUs</span>
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-white tracking-tight">{stats.totalItems}</div>
          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <span className="text-sky-400 font-medium">{stats.totalStockUnits}</span> unidades físicas
          </div>
        </div>
      </div>

      {/* 2. Valor Total do Almoxarifado */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Valor em Estoque</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <CircleDollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl font-black text-white tracking-tight truncate" title={formattedValuation}>
            {formattedValuation}
          </div>
          <div className="text-xs text-emerald-400/90 mt-0.5 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Custo médio avaliado
          </div>
        </div>
      </div>

      {/* 3. Alertas de Estoque Crítico */}
      <div 
        onClick={onSelectAlerts}
        className={`cursor-pointer rounded-xl p-4 shadow-sm transition-all border flex flex-col justify-between ${
          totalAlerts > 0 
            ? 'bg-gradient-to-b from-rose-950/40 to-slate-900 border-rose-800/60 hover:border-rose-600' 
            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider flex items-center gap-1">
            {totalAlerts > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
            Ruptura / Reposição
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400 tracking-tight">{totalAlerts}</span>
            <span className="text-xs text-slate-400">itens requerem compra</span>
          </div>
          <div className="text-[11px] text-rose-400/80 mt-0.5">
            {stats.criticalAlertsCount} zerados/críticos • {stats.lowStockAlertsCount} baixos
          </div>
        </div>
      </div>

      {/* 4. Movimentações Hoje */}
      <div 
        onClick={onSelectMovements}
        className="cursor-pointer bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Movimentos Hoje</span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-white tracking-tight">{stats.movementsTodayCount}</div>
          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <span className="text-amber-400 font-medium">Tempo Real</span> sincronizado
          </div>
        </div>
      </div>

      {/* 5. Requisições Pendentes */}
      <div 
        onClick={onSelectRequisitions}
        className={`cursor-pointer rounded-xl p-4 shadow-sm transition-all border flex flex-col justify-between ${
          stats.pendingRequisitionsCount > 0 
            ? 'bg-gradient-to-b from-sky-950/40 to-slate-900 border-sky-800/60 hover:border-sky-600' 
            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-sky-300 uppercase tracking-wider">Balcão / Pedidos</span>
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/30">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-sky-400 tracking-tight">{stats.pendingRequisitionsCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">
            {stats.pendingRequisitionsCount === 0 ? 'Nenhum pedido na fila' : 'Aguardando atendimento'}
          </div>
        </div>
      </div>

    </div>
  );
};
