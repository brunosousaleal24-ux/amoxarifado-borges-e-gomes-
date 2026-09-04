import React, { useState } from 'react';
import { 
  MapPin, 
  Layers, 
  Box, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Warehouse,
  Info
} from 'lucide-react';
import { InventoryItem } from '../types.ts';

interface WarehouseMapProps {
  items: InventoryItem[];
  onSelectItem: (item: InventoryItem) => void;
  onQuickMovement: (item: InventoryItem, defaultType: 'ENTRADA' | 'SAIDA') => void;
}

interface AisleConfig {
  aisle: string;
  name: string;
  category: string;
  shelvesCount: number;
  color: string;
}

export const WarehouseMap: React.FC<WarehouseMapProps> = ({
  items,
  onSelectItem,
  onQuickMovement,
}) => {
  const [selectedAisle, setSelectedAisle] = useState<string>('A');

  const aisles: AisleConfig[] = [
    { aisle: 'A', name: 'Corredor A', category: 'EPI & Proteção', shelvesCount: 3, color: 'from-blue-600/20 to-blue-900/40' },
    { aisle: 'B', name: 'Corredor B', category: 'Ferramentas', shelvesCount: 3, color: 'from-amber-600/20 to-amber-900/40' },
    { aisle: 'C', name: 'Corredor C', category: 'Material Elétrico', shelvesCount: 4, color: 'from-yellow-600/20 to-yellow-900/40' },
    { aisle: 'D', name: 'Corredor D', category: 'Hidráulica & Tubos', shelvesCount: 3, color: 'from-cyan-600/20 to-cyan-900/40' },
    { aisle: 'E', name: 'Corredor E', category: 'Fixação & Rolamentos', shelvesCount: 4, color: 'from-indigo-600/20 to-indigo-900/40' },
    { aisle: 'F', name: 'Corredor F', category: 'Químicos & Lubrificantes', shelvesCount: 3, color: 'from-emerald-600/20 to-emerald-900/40' },
  ];

  const itemsInSelectedAisle = items.filter(
    (it) => it.location.aisle.toUpperCase() === selectedAisle.toUpperCase()
  );

  const totalUnitsInAisle = itemsInSelectedAisle.reduce((acc, it) => acc + it.currentStock, 0);
  const criticalInAisle = itemsInSelectedAisle.filter(it => it.status === 'zerado' || it.status === 'critico').length;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg p-5">
      
      {/* Map Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-amber-500" />
            Planta Baixa & Localizador de Prateleiras
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualize a disposição física do galpão, ocupação de corredores e estoque por endereço.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-300">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Normal
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Baixo
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Crítico/Zerado
          </span>
        </div>
      </div>

      {/* Warehouse Aisles Visual Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-5">
        {aisles.map((a) => {
          const count = items.filter(it => it.location.aisle.toUpperCase() === a.aisle).length;
          const isSelected = selectedAisle === a.aisle;

          return (
            <div
              key={a.aisle}
              onClick={() => setSelectedAisle(a.aisle)}
              className={`cursor-pointer rounded-xl p-3 border transition-all flex flex-col justify-between ${
                isSelected 
                  ? 'bg-amber-500/15 border-amber-500 text-white shadow-md ring-1 ring-amber-500/40' 
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400">
                  RUA {a.aisle}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {count} SKUs
                </span>
              </div>

              <div className="mt-4">
                <h3 className="font-bold text-xs truncate text-white">{a.name}</h3>
                <p className="text-[10px] text-slate-400 truncate">{a.category}</p>
              </div>

              {/* Racks visual icon */}
              <div className="flex items-center gap-1 mt-3 pt-2 border-t border-slate-800/80">
                {Array.from({ length: a.shelvesCount }).map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-2 flex-1 rounded-sm ${isSelected ? 'bg-amber-500' : 'bg-slate-700'}`} 
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Shelves View for Selected Aisle */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <h3 className="font-bold text-white text-sm">
              Itens Armazenados no Corredor {selectedAisle}
            </h3>
            <span className="text-xs text-slate-400">
              ({itemsInSelectedAisle.length} itens • {totalUnitsInAisle} peças em estoque)
            </span>
          </div>

          {criticalInAisle > 0 && (
            <span className="text-xs text-rose-400 font-semibold flex items-center gap-1 bg-rose-950/60 px-2.5 py-1 rounded-md border border-rose-800">
              <AlertTriangle className="w-3.5 h-3.5" />
              {criticalInAisle} item(ns) em situação crítica neste corredor
            </span>
          )}
        </div>

        {itemsInSelectedAisle.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Nenhum item endereçado no corredor {selectedAisle} no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {itemsInSelectedAisle.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        {item.sku}
                      </span>
                      <span className="font-mono text-[11px] text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        P{item.location.shelf} • {item.location.bin}
                      </span>
                    </div>

                    <span className={`w-2 h-2 rounded-full ${
                      item.status === 'zerado' || item.status === 'critico'
                        ? 'bg-rose-500'
                        : item.status === 'baixo'
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                    }`} />
                  </div>

                  <h4 className="font-bold text-slate-100 text-xs line-clamp-2 mt-1">
                    {item.name}
                  </h4>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Saldo: </span>
                    <strong className="text-white text-sm font-black">{item.currentStock}</strong> {item.unit}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onQuickMovement(item, 'SAIDA')}
                      className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded text-[11px] font-bold border border-rose-500/20 transition-colors"
                      title="Dar baixa"
                    >
                      - Baixa
                    </button>
                    <button
                      onClick={() => onQuickMovement(item, 'ENTRADA')}
                      className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded text-[11px] font-bold border border-emerald-500/20 transition-colors"
                      title="Dar entrada"
                    >
                      + Entrada
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
