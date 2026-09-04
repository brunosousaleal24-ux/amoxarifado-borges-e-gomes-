import React from 'react';
import { 
  AlertTriangle, 
  ShoppingCart, 
  ArrowRight, 
  CheckCircle2, 
  CircleDollarSign, 
  Building2, 
  PackagePlus,
  Truck
} from 'lucide-react';
import { InventoryItem } from '../types.ts';

interface RestockAlertsProps {
  items: InventoryItem[];
  onRestockItem: (item: InventoryItem, suggestedQty: number) => void;
}

export const RestockAlerts: React.FC<RestockAlertsProps> = ({
  items,
  onRestockItem,
}) => {
  const alertItems = items
    .filter((item) => item.status === 'zerado' || item.status === 'critico' || item.status === 'baixo')
    .sort((a, b) => {
      // Prioritize zerado first, then critico, then baixo
      const weights = { zerado: 0, critico: 1, baixo: 2, ok: 3 };
      return weights[a.status] - weights[b.status];
    });

  const totalReplenishmentCost = alertItems.reduce((acc, item) => {
    const suggestedQty = Math.max(1, item.maxStock - item.currentStock);
    return acc + (suggestedQty * item.unitCost);
  }, 0);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg p-5">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Painel de Alertas de Reposição & Compras
            </h2>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {alertItems.length} itens requerem atenção
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Materiais que atingiram o Ponto de Pedido ou Estoque Mínimo no almoxarifado.
          </p>
        </div>

        {/* Total restock cost */}
        <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <CircleDollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Custo Est. de Reposição</p>
            <p className="text-base font-black text-white font-mono">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReplenishmentCost)}
            </p>
          </div>
        </div>
      </div>

      {/* Items list */}
      <div className="mt-4">
        {alertItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="font-bold text-slate-200">Estoque 100% Abastecido!</p>
            <p className="text-xs text-slate-500">Nenhum item está abaixo do estoque mínimo ou ponto de pedido.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs uppercase font-semibold">
                  <th className="py-3 px-3">Item / SKU</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Estoque Atual</th>
                  <th className="py-3 px-3">Ponto Pedido / Mín.</th>
                  <th className="py-3 px-3">Sugestão de Compra</th>
                  <th className="py-3 px-3">Custo Est.</th>
                  <th className="py-3 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {alertItems.map((item) => {
                  const suggestedQty = Math.max(1, item.maxStock - item.currentStock);
                  const subtotal = suggestedQty * item.unitCost;

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Name & SKU */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                            {item.sku}
                          </span>
                          <div>
                            <p className="font-bold text-slate-200 text-xs">{item.name}</p>
                            <p className="text-[11px] text-slate-500">{item.supplier || 'Sem fornecedor cadastrado'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        {item.status === 'zerado' ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                            ZERADO (RUPTURA)
                          </span>
                        ) : item.status === 'critico' ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            CRÍTICO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                            ESTOQUE BAIXO
                          </span>
                        )}
                      </td>

                      {/* Current stock */}
                      <td className="py-3.5 px-3 font-mono font-bold">
                        <span className={item.currentStock === 0 ? 'text-rose-400' : 'text-amber-400'}>
                          {item.currentStock} {item.unit}
                        </span>
                      </td>

                      {/* Reorder and Min */}
                      <td className="py-3.5 px-3 font-mono text-xs text-slate-400">
                        <span>Pto: {item.reorderPoint} | Mín: {item.minStock}</span>
                      </td>

                      {/* Suggested */}
                      <td className="py-3.5 px-3 font-mono">
                        <span className="text-emerald-400 font-bold">
                          +{suggestedQty} {item.unit}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          (Meta: {item.maxStock})
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="py-3.5 px-3 font-mono text-xs text-slate-200">
                        R$ {subtotal.toFixed(2)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-3 text-right">
                        <button
                          id={`btn-restock-${item.sku}`}
                          onClick={() => onRestockItem(item, suggestedQty)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm active:scale-95"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          <span>Dar Entrada</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
