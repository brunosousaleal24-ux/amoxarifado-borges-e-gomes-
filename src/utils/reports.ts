import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InventoryItem, StockMovement, Requisition, Employee } from '../types.ts';

// Helper to format currency
function formatBRL(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Helper to format date
function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('pt-BR');
  } catch {
    return dateStr;
  }
}

// ==========================================
// 1. EXCEL EXPORT (XLSX)
// ==========================================

export function exportInventoryToExcel(
  items: InventoryItem[],
  movements: StockMovement[],
  requisitions: Requisition[],
  employees: Employee[],
  reportScope: 'tudo' | 'estoque' | 'movimentacoes' | 'criticos' | 'requisicoes' | 'funcionarios' = 'tudo'
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Posição de Estoque
  if (reportScope === 'tudo' || reportScope === 'estoque' || reportScope === 'criticos') {
    const filteredItems = reportScope === 'criticos' 
      ? items.filter(i => i.status === 'critico' || i.status === 'zerado' || i.status === 'baixo')
      : items;

    const itemsData = filteredItems.map((it) => ({
      'Código SKU': it.sku,
      'Descrição do Material': it.name,
      'Categoria': it.category,
      'Unidade': it.unit,
      'Saldo Atual': it.currentStock,
      'Estoque Mínimo': it.minStock,
      'Ponto de Reposição': it.reorderPoint,
      'Estoque Máximo': it.maxStock,
      'Endereço Físico': `Corredor ${it.location.aisle} - Prat ${it.location.shelf} - Box ${it.location.bin}`,
      'Custo Unitário (R$)': it.unitCost,
      'Valor Total em Estoque (R$)': Math.round(it.currentStock * it.unitCost * 100) / 100,
      'Status': it.status.toUpperCase(),
      'Código de Barras': it.barcode,
      'Fornecedor Homologado': it.supplier || 'N/D',
      'Última Atualização': formatDate(it.lastUpdated)
    }));

    const wsItems = XLSX.utils.json_to_sheet(itemsData);
    wsItems['!cols'] = [
      { wch: 12 }, // SKU
      { wch: 42 }, // Nome
      { wch: 22 }, // Categoria
      { wch: 8 },  // Un
      { wch: 12 }, // Saldo
      { wch: 14 }, // Min
      { wch: 16 }, // Reorder
      { wch: 14 }, // Max
      { wch: 30 }, // Endereço
      { wch: 16 }, // Custo
      { wch: 22 }, // Valor Total
      { wch: 12 }, // Status
      { wch: 16 }, // Barcode
      { wch: 26 }, // Fornecedor
      { wch: 20 }  // Data
    ];
    XLSX.utils.book_append_sheet(wb, wsItems, reportScope === 'criticos' ? 'Itens Críticos' : 'Estoque Físico');
  }

  // Sheet 2: Movimentações & Cautelas
  if (reportScope === 'tudo' || reportScope === 'movimentacoes') {
    const movData = movements.map((m) => ({
      'ID Registro': m.id,
      'Data e Hora': formatDate(m.timestamp),
      'Tipo': m.type,
      'Código SKU': m.itemSku,
      'Descrição do Material': m.itemName,
      'Categoria': m.category,
      'Quantidade': m.quantity,
      'Unidade': m.unit,
      'Estoque Anterior': m.previousStock,
      'Novo Saldo': m.newStock,
      'Motivo / Justificativa': m.reason,
      'Solicitante / Destino': m.recipient,
      'Almoxarife / Operador': m.operator,
      'Custo Unit. (R$)': m.unitCost,
      'Custo Total (R$)': m.totalCost,
      'Observações': m.notes || ''
    }));

    const wsMov = XLSX.utils.json_to_sheet(movData);
    wsMov['!cols'] = [
      { wch: 14 },
      { wch: 20 },
      { wch: 12 },
      { wch: 12 },
      { wch: 40 },
      { wch: 20 },
      { wch: 12 },
      { wch: 8 },
      { wch: 14 },
      { wch: 12 },
      { wch: 32 },
      { wch: 28 },
      { wch: 22 },
      { wch: 14 },
      { wch: 16 },
      { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, wsMov, 'Movimentações');
  }

  // Sheet 3: Requisições
  if (reportScope === 'tudo' || reportScope === 'requisicoes') {
    const reqData = requisitions.map((r) => ({
      'Código Requisição': r.code,
      'Solicitante': r.requesterName,
      'Departamento / Obra': r.department,
      'Ordem de Serviço (OS)': r.workOrder || 'N/A',
      'Prioridade': r.priority,
      'Status': r.status,
      'Qtd de Itens': r.items.length,
      'Materiais Solicitados': r.items.map(i => `${i.name} (${i.quantity} ${i.unit})`).join('; '),
      'Data de Abertura': formatDate(r.createdAt),
      'Data Atualização': formatDate(r.updatedAt),
      'Atendido Por': r.attendedBy || 'Aguardando',
      'Observações': r.notes || ''
    }));

    const wsReq = XLSX.utils.json_to_sheet(reqData);
    wsReq['!cols'] = [
      { wch: 16 },
      { wch: 24 },
      { wch: 24 },
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 50 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, wsReq, 'Requisições');
  }

  // Sheet 4: Funcionários Cadastrados
  if (reportScope === 'tudo' || reportScope === 'funcionarios') {
    const empData = employees.map((e) => ({
      'Matrícula': e.registration,
      'Nome Completo': e.name,
      'Departamento / Setor': e.department,
      'Cargo / Função': e.role,
      'Telefone / Ramal': e.phone || 'N/D',
      'E-mail': e.email || 'N/D',
      'Status': e.status,
      'Data Cadastro': formatDate(e.createdAt),
      'Observações': e.notes || ''
    }));

    const wsEmp = XLSX.utils.json_to_sheet(empData);
    wsEmp['!cols'] = [
      { wch: 14 },
      { wch: 30 },
      { wch: 24 },
      { wch: 24 },
      { wch: 18 },
      { wch: 28 },
      { wch: 12 },
      { wch: 18 },
      { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, wsEmp, 'Funcionários');
  }

  const dateSlug = new Date().toISOString().slice(0, 10);
  const fileName = `Relatorio_Almoxarifado_${reportScope.toUpperCase()}_${dateSlug}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// ==========================================
// 2. PDF EXPORT (PDF)
// ==========================================

export function exportInventoryToPDF(
  items: InventoryItem[],
  movements: StockMovement[],
  requisitions: Requisition[],
  employees: Employee[],
  reportScope: 'tudo' | 'estoque' | 'movimentacoes' | 'criticos' | 'requisicoes' | 'funcionarios' = 'tudo',
  operatorName: string = 'Carlos Eduardo (Almoxarife Chefe)'
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date().toLocaleString('pt-BR');

  // Header banner
  const drawHeader = (title: string, subtitle: string) => {
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 24, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(248, 250, 252); // white
    doc.text('ALMOXARIFADO CENTRAL • SISTEMA DE GESTÃO & CONTROLE INTEGRADO', 14, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text(`${title} | Emissão: ${now} | Operador: ${operatorName}`, 14, 18);

    doc.setTextColor(245, 158, 11); // amber-500
    doc.setFont('helvetica', 'bold');
    doc.text('BANCO DE DADOS: SQLITE PERSISTENTE', pageWidth - 14, 10, { align: 'right' });
  };

  const drawFooter = () => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
      doc.text(
        `Almoxarifado em Tempo Real • Documento Oficial para fins de Auditoria e Controle Patrimonial`,
        14,
        pageHeight - 7
      );
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
    }
  };

  // Scope: ESTOQUE ou TUDO ou CRITICOS
  if (reportScope === 'tudo' || reportScope === 'estoque' || reportScope === 'criticos') {
    drawHeader(
      reportScope === 'criticos' ? 'RELATÓRIO DE ITENS CRÍTICOS & PONTO DE PEDIDO' : 'POSIÇÃO GERAL DE ESTOQUE FÍSICO-FINANCEIRO',
      'Inventário completo com localização e saldos'
    );

    const filteredItems = reportScope === 'criticos'
      ? items.filter(i => i.status === 'critico' || i.status === 'zerado' || i.status === 'baixo')
      : items;

    const totalValuation = filteredItems.reduce((acc, it) => acc + it.currentStock * it.unitCost, 0);
    const totalUnits = filteredItems.reduce((acc, it) => acc + it.currentStock, 0);

    // Summary Metric Box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 28, pageWidth - 28, 14, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Total de SKUs: ${filteredItems.length}`, 18, 37);
    doc.text(`Volume Físico em Estoque: ${totalUnits} unidades`, 75, 37);
    doc.text(`Patrimônio Alocado: ${formatBRL(totalValuation)}`, 160, 37);
    doc.text(`Itens em Alerta Crítico: ${filteredItems.filter(i => i.status === 'critico' || i.status === 'zerado').length}`, 235, 37);

    const tableBody = filteredItems.map((it) => [
      it.sku,
      it.name,
      it.category,
      `${it.currentStock} ${it.unit}`,
      `${it.minStock} ${it.unit}`,
      `${it.reorderPoint} ${it.unit}`,
      `C-${it.location.aisle} P-${it.location.shelf} B-${it.location.bin}`,
      formatBRL(it.unitCost),
      formatBRL(it.currentStock * it.unitCost),
      it.status.toUpperCase()
    ]);

    autoTable(doc, {
      startY: 46,
      head: [[
        'SKU', 
        'Descrição do Material', 
        'Categoria', 
        'Saldo', 
        'Mín', 
        'Ponto Ped.', 
        'Localização', 
        'Custo Unit.', 
        'Subtotal', 
        'Status'
      ]],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [15, 23, 42]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 18, fontStyle: 'bold' },
        1: { cellWidth: 65 },
        2: { cellWidth: 32 },
        3: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: 15, halign: 'right' },
        5: { cellWidth: 18, halign: 'right' },
        6: { cellWidth: 26 },
        7: { cellWidth: 22, halign: 'right' },
        8: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
        9: { cellWidth: 20, halign: 'center' }
      }
    });
  }

  // Scope: MOVIMENTAÇÕES
  if (reportScope === 'movimentacoes') {
    drawHeader('RELATÓRIO DE MOVIMENTAÇÕES, CAUTELAS E RECEBIMENTOS', 'Histórico completo de entradas e saídas');

    const totalSaidas = movements.filter(m => m.type === 'SAIDA').reduce((acc, m) => acc + m.totalCost, 0);
    const totalEntradas = movements.filter(m => m.type === 'ENTRADA').reduce((acc, m) => acc + m.totalCost, 0);

    // Summary Metric Box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 28, pageWidth - 28, 14, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Total de Operações: ${movements.length}`, 18, 37);
    doc.text(`Total em Saídas / Baixas: ${formatBRL(totalSaidas)}`, 75, 37);
    doc.text(`Total em Entradas / NF: ${formatBRL(totalEntradas)}`, 160, 37);

    const tableBody = movements.map((m) => [
      formatDate(m.timestamp),
      m.type,
      m.itemSku,
      m.itemName,
      `${m.quantity} ${m.unit}`,
      m.recipient,
      m.reason,
      m.operator,
      formatBRL(m.totalCost)
    ]);

    autoTable(doc, {
      startY: 46,
      head: [[
        'Data/Hora', 
        'Tipo', 
        'SKU', 
        'Item', 
        'Qtd', 
        'Destino / Solicitante', 
        'Motivo / Justificativa', 
        'Almoxarife', 
        'Total'
      ]],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 26 },
        1: { cellWidth: 18, fontStyle: 'bold' },
        2: { cellWidth: 16 },
        3: { cellWidth: 60 },
        4: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
        5: { cellWidth: 42 },
        6: { cellWidth: 40 },
        7: { cellWidth: 28 },
        8: { cellWidth: 22, halign: 'right' }
      }
    });
  }

  // Scope: FUNCIONÁRIOS
  if (reportScope === 'funcionarios') {
    drawHeader('QUADRO GERAL DE FUNCIONÁRIOS & BENEFICIÁRIOS CADASTRADOS', 'Listagem completa de colaboradores com acesso ao almoxarifado');

    const totalAtivos = employees.filter(e => e.status === 'ATIVO').length;

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 28, pageWidth - 28, 14, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Colaboradores Cadastrados: ${employees.length}`, 18, 37);
    doc.text(`Funcionários Ativos: ${totalAtivos}`, 95, 37);
    doc.text(`Funcionários Inativos: ${employees.length - totalAtivos}`, 160, 37);

    const tableBody = employees.map((e) => [
      e.registration,
      e.name,
      e.department,
      e.role,
      e.phone || 'N/D',
      e.email || 'N/D',
      e.status,
      formatDate(e.createdAt)
    ]);

    autoTable(doc, {
      startY: 46,
      head: [[
        'Matrícula', 
        'Nome Completo', 
        'Departamento / Setor', 
        'Cargo / Função', 
        'Contato', 
        'E-mail', 
        'Status', 
        'Data Cadastro'
      ]],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 22, fontStyle: 'bold' },
        1: { cellWidth: 55 },
        2: { cellWidth: 45 },
        3: { cellWidth: 42 },
        4: { cellWidth: 28 },
        5: { cellWidth: 45 },
        6: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
        7: { cellWidth: 25 }
      }
    });
  }

  // Scope: REQUISIÇÕES
  if (reportScope === 'requisicoes') {
    drawHeader('RELATÓRIO DE REQUISIÇÕES E ATENDIMENTOS DE BALCÃO', 'Controle de demandas operacionais');

    const tableBody = requisitions.map((r) => [
      r.code,
      r.requesterName,
      r.department,
      r.workOrder || 'N/A',
      r.priority,
      r.status,
      r.items.map(i => `${i.name} (${i.quantity} ${i.unit})`).join('; '),
      r.attendedBy || 'Pendente',
      formatDate(r.createdAt)
    ]);

    autoTable(doc, {
      startY: 32,
      head: [[
        'Código', 
        'Solicitante', 
        'Departamento', 
        'OS', 
        'Prioridade', 
        'Status', 
        'Itens Solicitados', 
        'Atendido Por', 
        'Abertura'
      ]],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });
  }

  // Add signature lines at the end of the document
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 18 : 120;
  if (finalY + 25 < pageHeight - 15) {
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    doc.line(20, finalY, 110, finalY);
    doc.text('Responsável Almoxarifado / Conferência', 30, finalY + 5);

    doc.line(pageWidth - 110, finalY, pageWidth - 20, finalY);
    doc.text('Gerência de Operações / Visto de Auditoria', pageWidth - 100, finalY + 5);
  }

  drawFooter();

  const dateSlug = new Date().toISOString().slice(0, 10);
  const fileName = `Relatorio_Almoxarifado_${reportScope.toUpperCase()}_${dateSlug}.pdf`;
  doc.save(fileName);
}
