import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RotateCcw, 
  SlidersHorizontal, 
  Package, 
  MapPin, 
  Check, 
  AlertCircle,
  Hash,
  Building2,
  User,
  QrCode
} from 'lucide-react';
import { InventoryItem, MovementType } from '../types.ts';

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  preSelectedItem?: InventoryItem | null;
  defaultType?: MovementType;
  currentOperator: string;
  onSubmit: (data: {
    itemId: string;
    type: MovementType;
    quantity: number;
    reason: string;
    recipient: string;
    operator: string;
    notes?: string;
    customUnitCost?: number;
  }) => Promise<void>;
  suggestedQuantity?: number;
}

export const MovementModal: React.FC<MovementModalProps> = ({
  isOpen,
  onClose,
  items,
  preSelectedItem,
  defaultType = 'SAIDA',
  currentOperator,
  onSubmit,
  suggestedQuantity,
}) => {
  const [type, setType] = useState<MovementType>(defaultType);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [recipient, setRecipient] = useState('');
  const [operator, setOperator] = useState(currentOperator);
  const [notes, setNotes] = useState('');
  const [customUnitCost, setCustomUnitCost] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preSelectedItem) {
      setSelectedItemId(preSelectedItem.id);
      setCustomUnitCost(preSelectedItem.unitCost);
    } else if (items.length > 0 && !selectedItemId) {
      setSelectedItemId(items[0].id);
      setCustomUnitCost(items[0].unitCost);
    }
    if (defaultType) {
      setType(defaultType);
    }
    if (suggestedQuantity && suggestedQuantity > 0) {
      setQuantity(suggestedQuantity);
    } else {
      setQuantity(1);
    }
    setOperator(currentOperator);
    setError(null);
  }, [isOpen, preSelectedItem, defaultType, suggestedQuantity, currentOperator, items]);

  if (!isOpen) return null;

  const currentItem = items.find((i) => i.id === selectedItemId);

  const handleItemChange = (id: string) => {
    setSelectedItemId(id);
    const it = items.find((i) => i.id === id);
    if (it) {
      setCustomUnitCost(it.unitCost);
    }
  };

  // Common reason presets
  const presets: Record<MovementType, string[]> = {
    SAIDA: ['OS Manutenção Preventiva', 'Consumo Obra Bloco B', 'Cautela de EPI Individual', 'Requisição Oficina Mecânica', 'Uso Geral Administrativo'],
    ENTRADA: ['Recebimento NF-e Fornecedor', 'Compra Emergencial Balcão', 'Transferência entre Unidades', 'Saldo de Ajuste'],
    DEVOLUCAO: ['Devolução de Ferramenta após OS', 'Sobra de Material de Obra', 'Item Não Utilizado', 'Devolução de Cautela'],
    AJUSTE: ['Inventário Cíclico de Estoque', 'Correção de Avaria', 'Ajuste de Balanço']
  };

  // Projected stock balance
  let projectedStock = currentItem ? currentItem.currentStock : 0;
  if (currentItem) {
    if (type === 'SAIDA') projectedStock = currentItem.currentStock - quantity;
    else if (type === 'ENTRADA' || type === 'DEVOLUCAO') projectedStock = currentItem.currentStock + quantity;
    else if (type === 'AJUSTE') projectedStock = quantity;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentItem) {
      setError('Selecione um item válido.');
      return;
    }

    if (quantity <= 0) {
      setError('A quantidade deve ser maior que zero.');
      return;
    }

    if (type === 'SAIDA' && quantity > currentItem.currentStock) {
      setError(`Saldo insuficiente em estoque! Saldo disponível: ${currentItem.currentStock} ${currentItem.unit}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        itemId: currentItem.id,
        type,
        quantity,
        reason: reason.trim() || (type === 'SAIDA' ? 'Saída de Almoxarifado' : 'Movimentação de Estoque'),
        recipient: recipient.trim() || 'Almoxarifado Central',
        operator: operator.trim() || currentOperator,
        notes: notes.trim() || undefined,
        customUnitCost: type === 'ENTRADA' ? customUnitCost : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao processar movimentação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
              type === 'ENTRADA' 
                ? 'bg-emerald-500/15 text-emerald-400' 
                : type === 'SAIDA' 
                ? 'bg-rose-500/15 text-rose-400' 
                : 'bg-amber-500/15 text-amber-400'
            }`}>
              {type === 'ENTRADA' ? <ArrowDownLeft className="w-5 h-5" /> : type === 'SAIDA' ? <ArrowUpRight className="w-5 h-5" /> : <RotateCcw className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Registrar Movimentação</h3>
              <p className="text-[11px] text-slate-400">Sincronização imediata no inventário</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Movement Type Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Tipo de Operação
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setType('SAIDA')}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                  type === 'SAIDA' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Saída
              </button>
              <button
                type="button"
                onClick={() => setType('ENTRADA')}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                  type === 'ENTRADA' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                Entrada
              </button>
              <button
                type="button"
                onClick={() => setType('DEVOLUCAO')}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                  type === 'DEVOLUCAO' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Devolução
              </button>
              <button
                type="button"
                onClick={() => setType('AJUSTE')}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                  type === 'AJUSTE' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Ajuste
              </button>
            </div>
          </div>

          {/* Item Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Material / SKU
            </label>
            <select
              aria-label="Selecionar material ou SKU"
              value={selectedItemId}
              onChange={(e) => handleItemChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
            >
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  [{it.sku}] {it.name} — Saldo: {it.currentStock} {it.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Item Context Banner */}
          {currentItem && (
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <span className="text-slate-400">Endereço físico: </span>
                  <strong className="text-slate-200 font-mono">
                    Corredor {currentItem.location.aisle} • Prateleira {currentItem.location.shelf} • {currentItem.location.bin}
                  </strong>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-slate-400">Saldo Atual: </span>
                <strong className="text-white text-sm">{currentItem.currentStock} {currentItem.unit}</strong>
              </div>
            </div>
          )}

          {/* Quantity & Projected Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Quantidade ({currentItem?.unit || 'un'})
              </label>
              <input
                id="input-movement-qty"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-base font-bold text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Novo Saldo Projetado
              </label>
              <div className={`px-3 py-2 bg-slate-950 rounded-lg border font-mono font-bold text-base flex items-center justify-between ${
                projectedStock < 0 
                  ? 'border-rose-600 text-rose-400' 
                  : 'border-slate-800 text-emerald-400'
              }`}>
                <span>{projectedStock} {currentItem?.unit}</span>
                <span className="text-xs font-normal text-slate-400">
                  {type === 'SAIDA' ? `(-${quantity})` : `(+${quantity})`}
                </span>
              </div>
            </div>
          </div>

          {/* Reason / Motive + Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Motivo / Documento de Referência
              </label>
            </div>
            <input
              type="text"
              placeholder="Ex: OS-402, NF-e 8812, Cautela EPI, Manutenção..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 mb-1.5"
            />
            {/* Presets chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-slate-400">
              <span className="text-slate-500 shrink-0">Sugestões:</span>
              {presets[type].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setReason(p)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient / Sector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {type === 'SAIDA' ? 'Solicitante / Setor' : 'Origem / Fornecedor'}
              </label>
              <input
                type="text"
                placeholder="Ex: Carlos (Manutenção), Obra 02..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Almoxarife Responsável
              </label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Observações (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Informações adicionais, número de série, lote, estado da devolução..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-confirm-movement"
              type="submit"
              disabled={isSubmitting || (type === 'SAIDA' && currentItem && quantity > currentItem.currentStock)}
              className={`px-5 py-2 rounded-lg font-bold text-xs text-slate-950 transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                type === 'ENTRADA'
                  ? 'bg-emerald-400 hover:bg-emerald-300'
                  : type === 'SAIDA'
                  ? 'bg-rose-400 hover:bg-rose-300'
                  : 'bg-amber-400 hover:bg-amber-300'
              }`}
            >
              {isSubmitting ? 'Processando...' : `Confirmar ${type === 'SAIDA' ? 'Saída' : type === 'ENTRADA' ? 'Entrada' : type === 'DEVOLUCAO' ? 'Devolução' : 'Ajuste'}`}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
