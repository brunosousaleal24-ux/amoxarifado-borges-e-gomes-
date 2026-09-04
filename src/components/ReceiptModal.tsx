import React from 'react';
import { X, Printer, CheckCircle2, Shield, QrCode, FileText } from 'lucide-react';
import { StockMovement } from '../types.ts';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  movement: StockMovement | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  movement,
}) => {
  if (!isOpen || !movement) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(movement.timestamp).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Comprovante de Movimentação & Cautela</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document Printable Body */}
        <div className="p-6 overflow-y-auto space-y-5 bg-white text-slate-900 rounded-b-2xl font-sans">
          
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                Almoxarifado Central
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Comprovante Oficial de Movimentação e Cautela de Materiais
              </p>
            </div>
            <div className="text-right font-mono text-xs">
              <p className="font-bold text-slate-900">DOC: #{movement.id.toUpperCase()}</p>
              <p className="text-slate-600">{formattedDate}</p>
            </div>
          </div>

          {/* Operation Details Banner */}
          <div className="bg-slate-100 p-3 rounded-lg border border-slate-300 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 uppercase font-semibold text-[10px] block">Tipo de Registro</span>
              <strong className="text-sm font-black text-slate-900">
                {movement.type === 'SAIDA' ? 'SAÍDA DE MATERIAL / CAUTELA' : movement.type === 'ENTRADA' ? 'ENTRADA DE MATERIAL' : movement.type === 'DEVOLUCAO' ? 'DEVOLUÇÃO DE MATERIAL' : 'AJUSTE DE INVENTÁRIO'}
              </strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500 uppercase font-semibold text-[10px] block">Referência / OS</span>
              <strong className="text-xs font-mono text-slate-800">{movement.reason}</strong>
            </div>
          </div>

          {/* Parties involved */}
          <div className="grid grid-cols-2 gap-4 text-xs border border-slate-200 rounded-lg p-3 bg-slate-50">
            <div>
              <span className="text-slate-500 block font-semibold text-[10px] uppercase">Destinatário / Solicitante:</span>
              <p className="font-bold text-slate-900 text-sm">{movement.recipient}</p>
            </div>
            <div>
              <span className="text-slate-500 block font-semibold text-[10px] uppercase">Almoxarife Responsável:</span>
              <p className="font-bold text-slate-900 text-sm">{movement.operator}</p>
            </div>
          </div>

          {/* Item Specification Table */}
          <div>
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-200 text-slate-800 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-2 border-r border-slate-300">Código SKU</th>
                  <th className="p-2 border-r border-slate-300">Descrição do Material</th>
                  <th className="p-2 border-r border-slate-300 text-center">Quantidade</th>
                  <th className="p-2 border-r border-slate-300 text-right">Unitário</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-300">
                  <td className="p-2 font-mono font-bold border-r border-slate-300">{movement.itemSku}</td>
                  <td className="p-2 border-r border-slate-300 font-semibold">{movement.itemName}</td>
                  <td className="p-2 border-r border-slate-300 text-center font-bold">{movement.quantity} {movement.unit}</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono">R$ {movement.unitCost.toFixed(2)}</td>
                  <td className="p-2 text-right font-mono font-bold">R$ {movement.totalCost.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Stock Balances */}
          <div className="flex items-center justify-between text-xs text-slate-600 border-t border-b border-slate-200 py-2">
            <span>Saldo Anterior: <strong className="text-slate-900">{movement.previousStock} {movement.unit}</strong></span>
            <span>Movimentado: <strong className="text-slate-900">{movement.quantity} {movement.unit}</strong></span>
            <span>Saldo Atualizado: <strong className="text-slate-900">{movement.newStock} {movement.unit}</strong></span>
          </div>

          {movement.notes && (
            <div className="text-xs bg-amber-50 p-2.5 rounded border border-amber-200 text-amber-900">
              <strong>Observações:</strong> {movement.notes}
            </div>
          )}

          {/* Legal statement */}
          <p className="text-[10px] text-slate-500 text-justify leading-tight">
            Declaro ter recebido/entregue os itens discriminados neste comprovante em perfeitas condições de uso, assumindo a responsabilidade pela guarda, conservação e devolução quando aplicável, conforme as normas internas de segurança patrimonial e gestão de almoxarifado.
          </p>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
            <div>
              <div className="border-t border-slate-800 pt-1.5 font-bold text-slate-900">
                {movement.recipient}
              </div>
              <span className="text-[10px] text-slate-500">Assinatura do Recebedor</span>
            </div>
            <div>
              <div className="border-t border-slate-800 pt-1.5 font-bold text-slate-900">
                {movement.operator}
              </div>
              <span className="text-[10px] text-slate-500">Assinatura do Almoxarife</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
