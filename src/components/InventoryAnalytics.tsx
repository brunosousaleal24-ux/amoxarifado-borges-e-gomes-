import React, { useMemo, useState } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { 
  PieChart as PieIcon, 
  BarChart3, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Layers, 
  DollarSign, 
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { InventoryItem, StockMovement, ItemCategory } from '../types.ts';

interface InventoryAnalyticsProps {
  items: InventoryItem[];
  movements: StockMovement[];
}

// Color palette for inventory categories
const CATEGORY_COLORS: Record<string, string> = {
  'EPI & Segurança': '#10b981',        // emerald-500
  'Ferramentas': '#f59e0b',            // amber-500
  'Material Elétrico': '#0284c7',      // sky-600
  'Hidráulica & Tubos': '#6366f1',     // indigo-500
  'Fixação & Parafusos': '#a855f7',    // purple-500
  'Químicos & Lubrificantes': '#f43f5e', // rose-500
  'Peças & Rolamentos': '#14b8a6',     // teal-500
};

const DEFAULT_COLOR = '#94a3b8';

export const InventoryAnalytics: React.FC<InventoryAnalyticsProps> = ({ items, movements }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [metricMode, setMetricMode] = useState<'units' | 'operations'>('units');

  // 1. Distribution of Stock Value by Category
  const categoryData = useMemo(() => {
    const map = new Map<string, { totalValue: number; count: number; totalUnits: number }>();

    items.forEach((item) => {
      const cat = item.category || 'Outros';
      const val = (item.currentStock || 0) * (item.unitCost || 0);
      const units = item.currentStock || 0;
      
      const prev = map.get(cat) || { totalValue: 0, count: 0, totalUnits: 0 };
      map.set(cat, {
        totalValue: prev.totalValue + val,
        count: prev.count + 1,
        totalUnits: prev.totalUnits + units,
      });
    });

    const totalInventoryValue = items.reduce(
      (acc, it) => acc + (it.currentStock || 0) * (it.unitCost || 0),
      0
    );

    const result = Array.from(map.entries()).map(([name, data]) => ({
      name,
      value: Math.round(data.totalValue * 100) / 100,
      itemCount: data.count,
      totalUnits: data.totalUnits,
      percentage: totalInventoryValue > 0 ? (data.totalValue / totalInventoryValue) * 100 : 0,
      color: CATEGORY_COLORS[name] || DEFAULT_COLOR,
    }));

    // Sort descending by value
    return result.sort((a, b) => b.value - a.value);
  }, [items]);

  const totalValue = useMemo(() => {
    return categoryData.reduce((acc, c) => acc + c.value, 0);
  }, [categoryData]);

  const topCategory = categoryData[0];

  // 2. Volume of Movements over the Last 7 Days
  const last7DaysData = useMemo(() => {
    // Generate dates for the last 7 calendar days (from 6 days ago up to today)
    const days: { key: string; dateObj: Date; label: string; weekday: string }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;
      
      // Short label: DD/MM
      const label = `${day}/${month}`;
      const weekday = i === 0 ? 'Hoje' : i === 1 ? 'Ontem' : d.toLocaleDateString('pt-BR', { weekday: 'short' });

      days.push({ key, dateObj: d, label, weekday });
    }

    return days.map((day) => {
      // Find movements on that calendar day
      const dayMovements = movements.filter((m) => {
        try {
          const mDate = new Date(m.timestamp);
          const y = mDate.getFullYear();
          const mo = String(mDate.getMonth() + 1).padStart(2, '0');
          const da = String(mDate.getDate()).padStart(2, '0');
          return `${y}-${mo}-${da}` === day.key;
        } catch {
          return false;
        }
      });

      // Units moved
      const saidasUnits = dayMovements
        .filter((m) => m.type === 'SAIDA')
        .reduce((acc, m) => acc + (m.quantity || 0), 0);

      const entradasUnits = dayMovements
        .filter((m) => m.type === 'ENTRADA')
        .reduce((acc, m) => acc + (m.quantity || 0), 0);

      const devolucoesUnits = dayMovements
        .filter((m) => m.type === 'DEVOLUCAO')
        .reduce((acc, m) => acc + (m.quantity || 0), 0);

      // Operations count
      const saidasOps = dayMovements.filter((m) => m.type === 'SAIDA').length;
      const entradasOps = dayMovements.filter((m) => m.type === 'ENTRADA').length;
      const devolucoesOps = dayMovements.filter((m) => m.type === 'DEVOLUCAO').length;

      return {
        date: day.label,
        weekday: day.weekday,
        key: day.key,
        // Units
        saidasUnits,
        entradasUnits,
        devolucoesUnits,
        totalUnits: saidasUnits + entradasUnits + devolucoesUnits,
        // Ops
        saidasOps,
        entradasOps,
        devolucoesOps,
        totalOps: dayMovements.length,
      };
    });
  }, [movements]);

  // Aggregate stats for the 7 days
  const sevenDayTotals = useMemo(() => {
    let totalSaidas = 0;
    let totalEntradas = 0;
    let totalDevolucoes = 0;
    let totalOps = 0;

    last7DaysData.forEach((d) => {
      totalSaidas += d.saidasUnits;
      totalEntradas += d.entradasUnits;
      totalDevolucoes += d.devolucoesUnits;
      totalOps += d.totalOps;
    });

    return { totalSaidas, totalEntradas, totalDevolucoes, totalOps };
  }, [last7DaysData]);

  // Custom Currency Tooltip for Pie Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-sans">
          <div className="flex items-center gap-2 mb-1.5">
            <span 
              className="w-3 h-3 rounded-full shrink-0" 
              style={{ backgroundColor: data.color }} 
            />
            <strong className="text-white text-sm">{data.name}</strong>
          </div>
          <div className="space-y-1 text-slate-300">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Valor Total:</span>
              <span className="font-mono font-bold text-amber-400">
                {data.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Participação:</span>
              <span className="font-bold text-emerald-400">{data.percentage.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">SKUs Cadastrados:</span>
              <span className="font-bold text-white">{data.itemCount} itens</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Unidades Físicas:</span>
              <span className="font-mono text-slate-200">{data.totalUnits} un</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for 7-Day Movements Bar Chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dayData = payload[0]?.payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs min-w-[200px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <strong className="text-white text-sm">
              {label} ({dayData?.weekday})
            </strong>
            <span className="text-[10px] text-slate-400">
              {metricMode === 'units' ? 'Unidades Físicas' : 'Transações'}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-rose-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Saídas / Baixas:
              </span>
              <strong className="font-mono">
                {metricMode === 'units' ? `${dayData?.saidasUnits} un` : `${dayData?.saidasOps} req`}
              </strong>
            </div>

            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Entradas / Recebimentos:
              </span>
              <strong className="font-mono">
                {metricMode === 'units' ? `${dayData?.entradasUnits} un` : `${dayData?.entradasOps} nfe`}
              </strong>
            </div>

            <div className="flex items-center justify-between text-sky-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                Devoluções:
              </span>
              <strong className="font-mono">
                {metricMode === 'units' ? `${dayData?.devolucoesUnits} un` : `${dayData?.devolucoesOps} dev`}
              </strong>
            </div>

            <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-slate-200 font-bold">
              <span>Total Movimentado:</span>
              <span className="font-mono text-amber-400">
                {metricMode === 'units' ? `${dayData?.totalUnits} un` : `${dayData?.totalOps} operações`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl mb-6">
      
      {/* Top Banner & Collapse Toggle */}
      <div className="px-4 py-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <span>Painel Analítico de Estoque & Movimentação</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Tempo Real
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Distribuição patrimonial por categoria e fluxo operacional dos últimos 7 dias
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Collapse/Expand button */}
          <button
            id="btn-toggle-analytics"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1 font-medium"
            title={isExpanded ? 'Recolher gráficos' : 'Expandir gráficos'}
          >
            <span>{isExpanded ? 'Ocultar' : 'Visualizar Gráficos'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Charts Area */}
      {isExpanded && (
        <div className="p-4 lg:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-200">
          
          {/* Left Chart: Distribuição de Valor por Categoria (5 cols on lg) */}
          <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                    Valor do Estoque por Categoria
                  </h4>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-400 block uppercase">Patrimônio Total</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>

              {/* Top Category Badge */}
              {topCategory && (
                <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Maior Alocação Financeira:</span>
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: topCategory.color }} 
                    />
                    <strong className="text-white font-medium">{topCategory.name}</strong>
                    <span className="text-amber-400 font-mono">({topCategory.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              )}

              {/* Recharts Pie Chart */}
              <div className="h-52 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={3}
                      stroke="#0f172a"
                      strokeWidth={2}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          className="hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Categorias</span>
                  <span className="text-base font-black text-slate-100 font-mono">
                    {categoryData.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Category Mini Legend List */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {categoryData.map((cat) => (
                <div 
                  key={cat.name} 
                  className="flex items-center justify-between text-xs py-0.5 hover:bg-slate-900/60 px-1.5 rounded transition-colors"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-sm shrink-0" 
                      style={{ backgroundColor: cat.color }} 
                    />
                    <span className="text-slate-300 truncate text-[11px] font-medium">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                    <span className="text-slate-200">
                      {cat.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-slate-400 font-semibold w-9 text-right">
                      {cat.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right Chart: Volume de Movimentações dos Últimos 7 Dias (7 cols on lg) */}
          <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
            <div>
              {/* Header + Toggle Units vs Operations */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-sky-400" />
                  <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                    Volume de Movimentações (Últimos 7 Dias)
                  </h4>
                </div>

                {/* Metric toggle */}
                <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-semibold self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setMetricMode('units')}
                    className={`px-2.5 py-1 rounded transition-all ${
                      metricMode === 'units'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Unidades (Itens)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetricMode('operations')}
                    className={`px-2.5 py-1 rounded transition-all ${
                      metricMode === 'operations'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Nº de Operações
                  </button>
                </div>
              </div>

              {/* Summary Badges Bar */}
              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                  <div className="flex items-center gap-1 text-rose-400 text-[10px] uppercase font-bold">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>Total Saídas</span>
                  </div>
                  <div className="text-base font-mono font-bold text-white mt-0.5">
                    {sevenDayTotals.totalSaidas} <span className="text-[10px] text-slate-400 font-normal">un</span>
                  </div>
                </div>

                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center gap-1 text-emerald-400 text-[10px] uppercase font-bold">
                    <ArrowDownLeft className="w-3 h-3" />
                    <span>Total Entradas</span>
                  </div>
                  <div className="text-base font-mono font-bold text-white mt-0.5">
                    {sevenDayTotals.totalEntradas} <span className="text-[10px] text-slate-400 font-normal">un</span>
                  </div>
                </div>

                <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg">
                  <div className="flex items-center gap-1 text-sky-400 text-[10px] uppercase font-bold">
                    <CalendarDays className="w-3 h-3" />
                    <span>Operações (7d)</span>
                  </div>
                  <div className="text-base font-mono font-bold text-white mt-0.5">
                    {sevenDayTotals.totalOps} <span className="text-[10px] text-slate-400 font-normal">docs</span>
                  </div>
                </div>
              </div>

              {/* Recharts Bar Chart */}
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={last7DaysData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                      tickFormatter={(val, idx) => {
                        const day = last7DaysData[idx];
                        return day?.weekday === 'Hoje' ? 'Hoje' : val;
                      }}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend 
                      wrapperStyle={{ paddingTop: 8, fontSize: 11 }}
                      formatter={(val) => {
                        if (val === 'saidasUnits' || val === 'saidasOps') return <span className="text-rose-300">Saídas / Cautelas</span>;
                        if (val === 'entradasUnits' || val === 'entradasOps') return <span className="text-emerald-300">Entradas / NF-e</span>;
                        if (val === 'devolucoesUnits' || val === 'devolucoesOps') return <span className="text-sky-300">Devoluções</span>;
                        return val;
                      }}
                    />
                    {metricMode === 'units' ? (
                      <>
                        <Bar 
                          dataKey="saidasUnits" 
                          name="saidasUnits" 
                          fill="#f43f5e" 
                          radius={[4, 4, 0, 0]} 
                          maxBarSize={28}
                        />
                        <Bar 
                          dataKey="entradasUnits" 
                          name="entradasUnits" 
                          fill="#10b981" 
                          radius={[4, 4, 0, 0]} 
                          maxBarSize={28}
                        />
                        <Bar 
                          dataKey="devolucoesUnits" 
                          name="devolucoesUnits" 
                          fill="#38bdf8" 
                          radius={[4, 4, 0, 0]} 
                          maxBarSize={28}
                        />
                      </>
                    ) : (
                      <>
                        <Bar 
                          dataKey="saidasOps" 
                          name="saidasOps" 
                          fill="#f43f5e" 
                          radius={[4, 4, 0, 0]} 
                          maxBarSize={28}
                        />
                        <Bar 
                          dataKey="entradasOps" 
                          name="entradasOps" 
                          fill="#10b981" 
                          radius={[4, 4, 0, 0]} 
                          maxBarSize={28}
                        />
                        <Bar 
                          dataKey="devolucoesOps" 
                          name="devolucoesOps" 
                          fill="#38bdf8" 
                          radius={[4, 4, 0, 0]} 
                          maxBarSize={28}
                        />
                      </>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>

            {/* Bottom Insight Footer */}
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Atualizado a cada nova bipagem ou transação de balcão
              </span>
              <span className="font-mono text-slate-400">
                Média: ~{Math.round((sevenDayTotals.totalSaidas + sevenDayTotals.totalEntradas) / 7)} un/dia
              </span>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
