import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  X, 
  CheckCircle2, 
  Download, 
  Layers, 
  Package, 
  ArrowLeftRight, 
  AlertTriangle, 
  ClipboardList, 
  Users,
  Database,
  Printer
} from 'lucide-react';
import { InventoryItem, StockMovement, Requisition, Employee, DatabaseInfo } from '../types.ts';
import { exportInventoryToExcel, exportInventoryToPDF } from '../utils/reports.ts';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  movements: StockMovement[];
  requisitions: Requisition[];
  employees: Employee[];
  operatorName?: string;
  databaseInfo?: DatabaseInfo;
}

type ReportScope = 'tudo' | 'estoque' | 'movimentacoes' | 'criticos' | 'requisicoes' | 'funcionarios';

export const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  onClose,
  items,
  movements,
  requisitions,
  employees,
  operatorName = 'Carlos Eduardo (Almoxarife Chefe)',
  databaseInfo
}) => {
  const [selectedScope, setSelectedScope] = useState<ReportScope>('tudo');
  const [isExporting, setIsExporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalStockValuation = items.reduce((acc, it) => acc + it.currentStock * it.unitCost, 0);
  const criticalItemsCount = items.filter(it => it.status === 'critico' || it.status === 'zerado' || it.status === 'baixo').length;

  const handleExportExcel = () => {
    setIsExporting(true);
    setSuccessMsg(null);
    try {
      exportInventoryToExcel(items, movements, requisitions, employees, selectedScope);
      setSuccessMsg('Planilha Excel (.xlsx) gerada e baixada com sucesso!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar relatório Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    setSuccessMsg(null);
    try {
      exportInventoryToPDF(items, movements, requisitions, employees, selectedScope, operatorName);
      setSuccessMsg('Documento PDF (.pdf) oficial gerado e baixado com sucesso!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar relatório PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const reportOptions: { id: ReportScope; title: string; desc: string; icon: any; count: number; badge?: string }[] = [
    {
      id: 'tudo',
      title: 'Relatório Geral Completo (TUDO)',
      desc: 'Exporta todas as abas consolidadas: Estoque, Movimentações, Requisições e Funcionários',
      icon: Layers,
      count: items.length + movements.length + requisitions.length + employees.length,
      badge: 'Multi-Aba / Consolidado'
    },
    {
      id: 'estoque',
      title: 'Inventário Físico & Posição Financeira',
      desc: 'Catálogo de materiais, quantidades em prateleira, custos unitários e patrimônio total',
      icon: Package,
      count: items.length
    },
    {
      id: 'movimentacoes',
      title: 'Histórico de Movimentações & Cautelas',
      desc: 'Entradas de notas fiscais, saídas operacionais, baixas e termos de entrega',
      icon: ArrowLeftRight,
      count: movements.length
    },
    {
      id: 'criticos',
      title: 'Itens Críticos & Ponto de Reposição',
      desc: 'Materiais com estoque abaixo do mínimo ou zerados para compra imediata',
      icon: AlertTriangle,
      count: criticalItemsCount,
      badge: 'Urgente / Compras'
    },
    {
      id: 'requisicoes',
      title: 'Requisições & Atendimentos de Balcão',
      desc: 'Solicitações das frentes de trabalho, prioridades e status de atendimento',
      icon: ClipboardList,
      count: requisitions.length
    },
    {
      id: 'funcionarios',
      title: 'Quadro Geral de Funcionários',
      desc: 'Lista de colaboradores autorizados com matrícula, setor, cargo e contatos',
      icon: Users,
      count: employees.length
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Centro de Relatórios & Exportação
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Excel & PDF
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Gere documentos oficiais e planilhas formatadas de auditoria com dados em tempo real do banco de dados
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Database Banner */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 text-slate-300">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>
                <strong>Fonte dos Dados:</strong> SQLite Persistente (<code className="text-emerald-400">almoxarifado.db</code>)
              </span>
            </div>
            <div className="text-slate-400">
              Patrimônio auditado: <strong className="text-slate-200">{totalStockValuation.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
            </div>
          </div>

          {/* Report Scope Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              1. Selecione o Tipo de Relatório:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reportOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedScope === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedScope(opt.id)}
                    className={`p-3.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-blue-600/15 border-blue-500 text-slate-100 ring-1 ring-blue-500' 
                        : 'bg-slate-800/40 border-slate-700/70 text-slate-300 hover:bg-slate-800/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-sm">{opt.title}</span>
                      </div>
                      {opt.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                      {opt.desc}
                    </p>
                    <div className="text-[11px] font-medium text-slate-400">
                      Total de registros: <span className="text-blue-400 font-bold">{opt.count}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Success Message */}
          {successMsg && (
            <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center gap-3 text-emerald-300 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Formats and Actions */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              2. Escolha o Formato de Exportação:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Excel Button */}
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={isExporting}
                className="flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-950/50 disabled:opacity-50 cursor-pointer"
              >
                <FileSpreadsheet className="w-5 h-5" />
                <span>Gerar Planilha Excel (.xlsx)</span>
              </button>

              {/* PDF Button */}
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition shadow-lg shadow-rose-950/50 disabled:opacity-50 cursor-pointer"
              >
                <FileText className="w-5 h-5" />
                <span>Gerar Relatório Oficial (.pdf)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Relatórios emitidos em conformidade com normas de controle de patrimônio
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
