import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  MapPin, 
  Minus, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Barcode,
  History,
  Edit2,
  ExternalLink,
  Trash2,
  Crown
} from 'lucide-react';
import { InventoryItem, ItemCategory, StockStatus } from '../types.ts';

interface InventoryTableProps {
  items: InventoryItem[];
  isAdmin?: boolean;
  isReadOnly?: boolean;
  onQuickMovement: (item: InventoryItem, defaultType: 'ENTRADA' | 'SAIDA') => void;
  onEditItem: (item: InventoryItem) => void;
  onViewItemHistory: (item: InventoryItem) => void;
  onDeleteItem?: (item: InventoryItem) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  isAdmin = false,
  isReadOnly = false,
  onQuickMovement,
  onEditItem,
  onViewItemHistory,
  onDeleteItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [sortBy, setSortBy] = useState<'name' | 'stockAsc' | 'stockDesc' | 'status'>('status');

  const categories: string[] = [
    'TODAS',
    'EPI & Segurança',
    'Ferramentas',
    'Material Elétrico',
    'Hidráulica & Tubos',
    'Fixação & Parafusos',
    'Químicos & Lubrificantes',
    'Peças & Rolamentos'
  ];

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesSearch = 
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.barcode.includes(searchTerm) ||
          (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
          `${item.location.aisle}${item.location.shelf}${item.location.bin}`.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'TODAS' || item.category === selectedCategory;

        let matchesStatus = true;
        if (statusFilter === 'ALERTAS') {
          matchesStatus = item.status === 'zerado' || item.status === 'critico' || item.status === 'baixo';
        } else if (statusFilter === 'CRITICOS') {
          matchesStatus = item.status === 'zerado' || item.status === 'critico';
        } else if (statusFilter === 'OK') {
          matchesStatus = item.status === 'ok';
        }

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'stockAsc') return a.currentStock - b.currentStock;
        if (sortBy === 'stockDesc') return b.currentStock - a.currentStock;
        if (sortBy === 'status') {
          const weight: Record<StockStatus, number> = { zerado: 0, critico: 1, baixo: 2, ok: 3 };
          return weight[a.status] - weight[b.status];
        }
        return 0;
      });
  }, [items, searchTerm, selectedCategory, statusFilter, sortBy]);

  const getStatusBadge = (status: StockStatus) => {
    switch (status) {
      case 'zerado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            Zerado
          </span>
        );
      case 'critico':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            Crítico
          </span>
        );
      case 'baixo':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Estoque Baixo
          </span>
        );
      case 'ok':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Normal
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      
      {/* Search & Filter Bar */}
      <div className="p-4 border-b border-slate-800 space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-inventory-search"
              type="text"
              placeholder="Buscar por SKU, nome, código de barras, localização..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          {/* Status & Sort selector */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Status pills */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setStatusFilter('TODOS')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  statusFilter === 'TODOS' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos ({items.length})
              </button>
              <button
                onClick={() => setStatusFilter('ALERTAS')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  statusFilter === 'ALERTAS' ? 'bg-rose-950 text-rose-300 border border-rose-800 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Em Alerta
              </button>
              <button
                onClick={() => setStatusFilter('OK')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  statusFilter === 'OK' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Normais
              </button>
            </div>

            {/* Sort selection */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                aria-label="Ordenar itens do almoxarifado"
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="status" className="bg-slate-900 text-white">Ordenar: Criticidade</option>
                <option value="stockAsc" className="bg-slate-900 text-white">Menor Estoque</option>
                <option value="stockDesc" className="bg-slate-900 text-white">Maior Estoque</option>
                <option value="name" className="bg-slate-900 text-white">Nome (A - Z)</option>
              </select>
            </div>

          </div>

        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs uppercase font-semibold tracking-wider">
              <th className="py-3 px-4">Item & SKU</th>
              <th className="py-3 px-3">Localização</th>
              <th className="py-3 px-4">Estoque Atual</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Valor Unitário</th>
              <th className="py-3 px-4 text-right">Ações Rápidas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-8 h-8 text-slate-500" />
                    <p className="font-semibold text-slate-300">Nenhum item localizado</p>
                    <p className="text-xs text-slate-500">Tente ajustar seus termos de busca ou filtros de categoria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const stockPercent = Math.min(100, Math.round((item.currentStock / Math.max(item.maxStock, 1)) * 100));
                
                return (
                  <tr 
                    key={item.id} 
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Item details */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 block text-center">
                            {item.sku}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-1 justify-center">
                            <Barcode className="w-3 h-3" />
                            {item.barcode.slice(-5)}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span className="text-sky-400">{item.category}</span>
                            <span>•</span>
                            <span>{item.supplier || 'Almoxarifado Geral'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Location Badge */}
                    <td className="py-3.5 px-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>
                          C-{item.location.aisle} • P{item.location.shelf} • {item.location.bin}
                        </span>
                      </div>
                    </td>

                    {/* Current Stock Bar */}
                    <td className="py-3.5 px-4 min-w-[160px]">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="text-base font-black text-white">
                          {item.currentStock} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Mín: {item.minStock} | Máx: {item.maxStock}
                        </span>
                      </div>
                      
                      {/* Health meter */}
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div 
                          className={`h-full transition-all rounded-full ${
                            item.status === 'zerado' 
                              ? 'w-0' 
                              : item.status === 'critico' 
                              ? 'bg-rose-500' 
                              : item.status === 'baixo' 
                              ? 'bg-amber-400' 
                              : 'bg-emerald-400'
                          }`}
                          style={{ width: `${item.status === 'zerado' ? 0 : Math.max(10, stockPercent)}%` }}
                        />
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-3 whitespace-nowrap font-mono text-xs">
                      <div className="text-slate-200 font-medium">
                        R$ {item.unitCost.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Total: R$ {(item.unitCost * item.currentStock).toFixed(2)}
                      </div>
                    </td>

                    {/* Quick actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        
                        {/* Quick - Saída */}
                        {!isReadOnly && (
                          <button
                            id={`btn-saida-${item.sku}`}
                            onClick={() => onQuickMovement(item, 'SAIDA')}
                            disabled={item.currentStock <= 0}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                            title="Dar baixa / Saída imediata"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        )}

                        {/* Quick + Entrada */}
                        {!isReadOnly && (
                          <button
                            id={`btn-entrada-${item.sku}`}
                            onClick={() => onQuickMovement(item, 'ENTRADA')}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
                            title="Registrar entrada de material"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}

                        {/* History */}
                        <button
                          id={`btn-history-${item.sku}`}
                          onClick={() => onViewItemHistory(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                          title="Histórico de movimentações deste item"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {/* Edit Item */}
                        {!isReadOnly && (
                          <button
                            id={`btn-edit-${item.sku}`}
                            onClick={() => onEditItem(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                            title="Editar cadastro do item"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Item (Admin Only with Total Access) */}
                        {isAdmin && onDeleteItem && (
                          <button
                            id={`btn-delete-${item.sku}`}
                            onClick={() => onDeleteItem(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-all cursor-pointer"
                            title="Excluir item do catálogo (Acesso Total Administrador)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer info */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div>
          Mostrando <strong className="text-slate-200 font-semibold">{filteredItems.length}</strong> de <strong className="text-slate-200 font-semibold">{items.length}</strong> itens cadastrados
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> OK
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Baixo
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Crítico / Zerado
          </span>
        </div>
      </div>

    </div>
  );
};
