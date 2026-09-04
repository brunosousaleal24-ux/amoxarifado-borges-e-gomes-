import React, { useState } from 'react';
import { 
  X, 
  PackagePlus, 
  MapPin, 
  Barcode, 
  CircleDollarSign, 
  Sparkles,
  AlertCircle 
} from 'lucide-react';
import { InventoryItem, ItemCategory, StockUnit } from '../types.ts';

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemData: Partial<InventoryItem>) => Promise<void>;
  editItem?: InventoryItem | null;
}

export const NewItemModal: React.FC<NewItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editItem,
}) => {
  const [sku, setSku] = useState(editItem ? editItem.sku : '');
  const [name, setName] = useState(editItem ? editItem.name : '');
  const [category, setCategory] = useState<ItemCategory>(editItem ? editItem.category : 'EPI & Segurança');
  const [unit, setUnit] = useState<StockUnit>(editItem ? editItem.unit : 'un');
  const [currentStock, setCurrentStock] = useState<number>(editItem ? editItem.currentStock : 10);
  const [minStock, setMinStock] = useState<number>(editItem ? editItem.minStock : 10);
  const [maxStock, setMaxStock] = useState<number>(editItem ? editItem.maxStock : 50);
  const [reorderPoint, setReorderPoint] = useState<number>(editItem ? editItem.reorderPoint : 15);
  const [aisle, setAisle] = useState(editItem ? editItem.location.aisle : 'A');
  const [shelf, setShelf] = useState(editItem ? editItem.location.shelf : '01');
  const [bin, setBin] = useState(editItem ? editItem.location.bin : 'CX-01');
  const [unitCost, setUnitCost] = useState<number>(editItem ? editItem.unitCost : 25.0);
  const [barcode, setBarcode] = useState(editItem ? editItem.barcode : '');
  const [supplier, setSupplier] = useState(editItem ? editItem.supplier || '' : '');
  const [description, setDescription] = useState(editItem ? editItem.description || '' : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (editItem) {
      setSku(editItem.sku);
      setName(editItem.name);
      setCategory(editItem.category);
      setUnit(editItem.unit);
      setCurrentStock(editItem.currentStock);
      setMinStock(editItem.minStock);
      setMaxStock(editItem.maxStock);
      setReorderPoint(editItem.reorderPoint);
      setAisle(editItem.location.aisle);
      setShelf(editItem.location.shelf);
      setBin(editItem.location.bin);
      setUnitCost(editItem.unitCost);
      setBarcode(editItem.barcode);
      setSupplier(editItem.supplier || '');
      setDescription(editItem.description || '');
    } else {
      setSku(`MAT-${Math.floor(100 + Math.random() * 900)}`);
      setName('');
      setCategory('EPI & Segurança');
      setUnit('un');
      setCurrentStock(10);
      setMinStock(10);
      setMaxStock(50);
      setReorderPoint(15);
      setAisle('A');
      setShelf('01');
      setBin('CX-01');
      setUnitCost(25.0);
      setBarcode(`${Math.floor(7890000000000 + Math.random() * 900000000000)}`);
      setSupplier('');
      setDescription('');
    }
    setError(null);
  }, [editItem, isOpen]);

  if (!isOpen) return null;

  const handleGenerateBarcode = () => {
    setBarcode(`${Math.floor(7890000000000 + Math.random() * 900000000000)}`);
  };

  const handleCategoryChange = (cat: ItemCategory) => {
    setCategory(cat);
    // Suggest appropriate aisle and SKU prefix
    const prefixMap: Record<ItemCategory, { prefix: string; aisle: string }> = {
      'EPI & Segurança': { prefix: 'EPI', aisle: 'A' },
      'Ferramentas': { prefix: 'FER', aisle: 'B' },
      'Material Elétrico': { prefix: 'ELT', aisle: 'C' },
      'Hidráulica & Tubos': { prefix: 'HID', aisle: 'D' },
      'Fixação & Parafusos': { prefix: 'FIX', aisle: 'E' },
      'Químicos & Lubrificantes': { prefix: 'QUI', aisle: 'F' },
      'Peças & Rolamentos': { prefix: 'PEC', aisle: 'E' },
    };
    if (!editItem) {
      const info = prefixMap[cat];
      setSku(`${info.prefix}-${Math.floor(100 + Math.random() * 900)}`);
      setAisle(info.aisle);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sku.trim() || !name.trim()) {
      setError('Código SKU e Nome do produto são obrigatórios.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        category,
        unit,
        currentStock: Number(currentStock) || 0,
        minStock: Number(minStock) || 5,
        maxStock: Number(maxStock) || 50,
        reorderPoint: Number(reorderPoint) || 10,
        location: {
          aisle: aisle.toUpperCase(),
          shelf,
          bin,
        },
        unitCost: Number(unitCost) || 0,
        barcode: barcode || `${Math.floor(7890000000000 + Math.random() * 900000000000)}`,
        supplier: supplier.trim() || undefined,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {editItem ? 'Editar Item do Almoxarifado' : 'Cadastrar Novo Item'}
              </h3>
              <p className="text-[11px] text-slate-400">Identificação, endereço físico e parâmetros de estoque</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SKU & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Código SKU *
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="Ex: EPI-101, FER-201"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Categoria
              </label>
              <select
                aria-label="Selecionar categoria do item"
                value={category}
                onChange={(e: any) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="EPI & Segurança">EPI & Segurança</option>
                <option value="Ferramentas">Ferramentas</option>
                <option value="Material Elétrico">Material Elétrico</option>
                <option value="Hidráulica & Tubos">Hidráulica & Tubos</option>
                <option value="Fixação & Parafusos">Fixação & Parafusos</option>
                <option value="Químicos & Lubrificantes">Químicos & Lubrificantes</option>
                <option value="Peças & Rolamentos">Peças & Rolamentos</option>
              </select>
            </div>
          </div>

          {/* Name & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nome do Material / Equipamento *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Luva de Vaqueta Cano Curto Tam G"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Unidade de Medida
              </label>
              <select
                aria-label="Selecionar unidade de medida"
                value={unit}
                onChange={(e: any) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="un">un (Unidade)</option>
                <option value="par">par (Par)</option>
                <option value="m">m (Metro)</option>
                <option value="kg">kg (Quilo)</option>
                <option value="cx">cx (Caixa)</option>
                <option value="rolo">rolo (Rolo)</option>
                <option value="litro">litro (Litro)</option>
                <option value="conj">conj (Conjunto)</option>
              </select>
            </div>
          </div>

          {/* Physical Location in Warehouse */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <MapPin className="w-4 h-4" />
              <span>Endereçamento no Galpão / Almoxarifado</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Corredor / Rua</label>
                <select
                  aria-label="Selecionar corredor ou rua"
                  value={aisle}
                  onChange={(e) => setAisle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-xs text-white"
                >
                  <option value="A">Corredor A (EPI)</option>
                  <option value="B">Corredor B (Ferramentas)</option>
                  <option value="C">Corredor C (Elétrica)</option>
                  <option value="D">Corredor D (Hidráulica)</option>
                  <option value="E">Corredor E (Fixação/Peças)</option>
                  <option value="F">Corredor F (Químicos)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Prateleira</label>
                <input
                  type="text"
                  value={shelf}
                  onChange={(e) => setShelf(e.target.value)}
                  placeholder="01, 02, 03..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Box / Gaveta</label>
                <input
                  type="text"
                  value={bin}
                  onChange={(e) => setBin(e.target.value)}
                  placeholder="CX-04, GV-12..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Stock Levels (Initial, Min, Max, Reorder Point) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {!editItem && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Estoque Inicial
                </label>
                <input
                  type="number"
                  min="0"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Estoque Mínimo
              </label>
              <input
                type="number"
                min="1"
                value={minStock}
                onChange={(e) => setMinStock(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Ponto de Pedido
              </label>
              <input
                type="number"
                min="1"
                value={reorderPoint}
                onChange={(e) => setReorderPoint(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Estoque Máximo
              </label>
              <input
                type="number"
                min="1"
                value={maxStock}
                onChange={(e) => setMaxStock(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Pricing & Barcode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Custo Unitário Médio (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-emerald-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Código de Barras EAN
                </label>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Gerar
                </button>
              </div>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="789..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-slate-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Fornecedor Principal (Opcional)
            </label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Ex: 3M do Brasil, Tigre Tubos, Bosch Ferramentas..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Descrição Técnica / Aplicação
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Especificações técnicas, dimensões, voltagem, normas atendidas..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-save-item"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-40"
            >
              {isSubmitting ? 'Salvando...' : editItem ? 'Atualizar Item' : 'Cadastrar Material'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
