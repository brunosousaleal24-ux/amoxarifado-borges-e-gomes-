import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Flame, 
  Check, 
  Building2, 
  User, 
  Hash 
} from 'lucide-react';
import { InventoryItem, RequisitionPriority } from '../types.ts';

interface NewRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onSubmit: (data: {
    requesterName: string;
    department: string;
    workOrder?: string;
    priority: RequisitionPriority;
    items: { itemId: string; quantity: number }[];
    notes?: string;
  }) => Promise<void>;
}

export const NewRequisitionModal: React.FC<NewRequisitionModalProps> = ({
  isOpen,
  onClose,
  items,
  onSubmit,
}) => {
  const [requesterName, setRequesterName] = useState('');
  const [department, setDepartment] = useState('Manutenção');
  const [workOrder, setWorkOrder] = useState('');
  const [priority, setPriority] = useState<RequisitionPriority>('NORMAL');
  const [notes, setNotes] = useState('');
  
  // Selected items in cart
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || '');
  const [itemQty, setItemQty] = useState<number>(1);
  const [cart, setCart] = useState<{ itemId: string; quantity: number }[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddItemToCart = () => {
    if (!selectedItemId) return;
    const existing = cart.find(c => c.itemId === selectedItemId);
    if (existing) {
      setCart(cart.map(c => c.itemId === selectedItemId ? { ...c, quantity: c.quantity + itemQty } : c));
    } else {
      setCart([...cart, { itemId: selectedItemId, quantity: itemQty }]);
    }
    setItemQty(1);
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(cart.filter(c => c.itemId !== itemId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!requesterName.trim() || !department.trim()) {
      setError('Nome do solicitante e setor são obrigatórios.');
      return;
    }

    if (cart.length === 0) {
      setError('Adicione pelo menos 1 material à requisição.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        requesterName: requesterName.trim(),
        department: department.trim(),
        workOrder: workOrder.trim() || undefined,
        priority,
        items: cart,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao emitir requisição.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Nova Requisição de Material</h3>
              <p className="text-[11px] text-slate-400">Solicitação direta para o balcão do almoxarifado</p>
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

          {/* Requester & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nome do Solicitante *
              </label>
              <input
                type="text"
                required
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                placeholder="Ex: Roberto Silva"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Setor / Equipe *
              </label>
              <select
                aria-label="Selecionar setor ou equipe"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="Manutenção Mecânica">Manutenção Mecânica</option>
                <option value="Manutenção Elétrica">Manutenção Elétrica</option>
                <option value="Produção & Operação">Produção & Operação</option>
                <option value="Obras & Infraestrutura">Obras & Infraestrutura</option>
                <option value="Segurança SESMT">Segurança SESMT</option>
                <option value="Logística & Frotas">Logística & Frotas</option>
              </select>
            </div>
          </div>

          {/* Work Order & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nº Ordem de Serviço (OS)
              </label>
              <input
                type="text"
                value={workOrder}
                onChange={(e) => setWorkOrder(e.target.value)}
                placeholder="Ex: OS-2026-904"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nível de Urgência
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPriority('BAIXA')}
                  className={`py-1.5 rounded transition-all ${priority === 'BAIXA' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                >
                  Baixa
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('NORMAL')}
                  className={`py-1.5 rounded transition-all ${priority === 'NORMAL' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('URGENTE')}
                  className={`py-1.5 rounded transition-all flex items-center justify-center gap-1 ${priority === 'URGENTE' ? 'bg-rose-600 text-white' : 'text-rose-400'}`}
                >
                  <Flame className="w-3 h-3" />
                  Urgente
                </button>
              </div>
            </div>
          </div>

          {/* Item Adder */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Selecionar Materiais para o Pedido
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <select
                  aria-label="Selecionar item para o pedido"
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                >
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      [{it.sku}] {it.name} (Disp: {it.currentStock} {it.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-24">
                <input
                  type="number"
                  min="1"
                  value={itemQty}
                  onChange={(e) => setItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-center text-white"
                />
              </div>

              <button
                type="button"
                onClick={handleAddItemToCart}
                className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>

            {/* Cart Preview Table */}
            <div className="mt-3">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Itens na Requisição ({cart.length})
              </p>
              {cart.length === 0 ? (
                <div className="py-4 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
                  Nenhum material adicionado ainda. Escolha os itens acima.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {cart.map((c) => {
                    const found = items.find(i => i.id === c.itemId);
                    return (
                      <div key={c.itemId} className="flex items-center justify-between p-2 bg-slate-900 rounded-lg text-xs border border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-400 font-bold">{found?.sku}</span>
                          <span className="text-slate-200">{found?.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white">
                            {c.quantity} {found?.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(c.itemId)}
                            className="text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Justificativa / Observações
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descreva a finalidade ou local específico de aplicação..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none resize-none"
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
              id="btn-submit-requisition"
              type="submit"
              disabled={isSubmitting || cart.length === 0}
              className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-40"
            >
              {isSubmitting ? 'Enviando...' : 'Transmitir Requisição'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
