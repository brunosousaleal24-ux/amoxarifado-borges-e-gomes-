import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { 
  InventoryItem, 
  StockMovement, 
  Requisition, 
  ConnectedOperator, 
  RealtimeServerState,
  WSServerMessage,
  StockStatus
} from './src/types.ts';

const app = express();
const PORT = 3000;
const server = http.createServer(app);

app.use(express.json());

// Helper function to calculate stock status
function calculateStatus(current: number, min: number): StockStatus {
  if (current <= 0) return 'zerado';
  if (current <= min * 0.6) return 'critico';
  if (current <= min) return 'baixo';
  return 'ok';
}

// Initial realistic warehouse stock items
let items: InventoryItem[] = [
  {
    id: 'itm-01',
    sku: 'EPI-101',
    name: 'Capacete de Segurança com Jugular e Carneira',
    category: 'EPI & Segurança',
    unit: 'un',
    currentStock: 48,
    minStock: 20,
    maxStock: 100,
    reorderPoint: 25,
    location: { aisle: 'A', shelf: '01', bin: 'CX-04' },
    unitCost: 38.50,
    barcode: '7891000101001',
    lastUpdated: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'ok',
    supplier: 'MSA do Brasil Ltda',
    description: 'Capacete aba frontal classe B com suspensão catraca regulável e fita jugular'
  },
  {
    id: 'itm-02',
    sku: 'EPI-104',
    name: 'Óculos de Proteção Antirrisco e Anti-embaçante',
    category: 'EPI & Segurança',
    unit: 'un',
    currentStock: 12,
    minStock: 25,
    maxStock: 80,
    reorderPoint: 30,
    location: { aisle: 'A', shelf: '01', bin: 'CX-08' },
    unitCost: 14.20,
    barcode: '7891000104002',
    lastUpdated: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: 'critico',
    supplier: '3M Segurança Industrial',
    description: 'Óculos com lente de policarbonato incolor com proteção UVA/UVB'
  },
  {
    id: 'itm-03',
    sku: 'EPI-108',
    name: 'Luva de Vaqueta Mista Cano Curto Tam G',
    category: 'EPI & Segurança',
    unit: 'par',
    currentStock: 18,
    minStock: 20,
    maxStock: 60,
    reorderPoint: 25,
    location: { aisle: 'A', shelf: '02', bin: 'CX-12' },
    unitCost: 22.90,
    barcode: '7891000108003',
    lastUpdated: new Date(Date.now() - 3600000 * 8).toISOString(),
    status: 'baixo',
    supplier: 'Danny EPIs',
    description: 'Luva de couro vaqueta na palma e raspa no dorso com reforço interno'
  },
  {
    id: 'itm-04',
    sku: 'FER-201',
    name: 'Furadeira e Parafusadeira de Impacto 18V Bateria',
    category: 'Ferramentas',
    unit: 'un',
    currentStock: 6,
    minStock: 4,
    maxStock: 12,
    reorderPoint: 5,
    location: { aisle: 'B', shelf: '01', bin: 'BX-01' },
    unitCost: 650.00,
    barcode: '7892000201004',
    lastUpdated: new Date(Date.now() - 3600000 * 12).toISOString(),
    status: 'ok',
    supplier: 'DeWalt Brasil',
    description: 'Kit completo com 2 baterias de 2.0Ah, carregador rápido bivolt e maleta'
  },
  {
    id: 'itm-05',
    sku: 'FER-208',
    name: 'Jogo de Chaves Combinadas 6 a 22mm (12 Peças)',
    category: 'Ferramentas',
    unit: 'conj',
    currentStock: 5,
    minStock: 6,
    maxStock: 15,
    reorderPoint: 8,
    location: { aisle: 'B', shelf: '02', bin: 'BX-05' },
    unitCost: 185.00,
    barcode: '7892000208005',
    lastUpdated: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'baixo',
    supplier: 'Gedore Brasil',
    description: 'Aço cromo vanádio com acabamento niquelado e cromado fosco'
  },
  {
    id: 'itm-06',
    sku: 'ELT-301',
    name: 'Cabo Flexível 2,5mm² 750V Antichama Rolo 100m Azul',
    category: 'Material Elétrico',
    unit: 'rolo',
    currentStock: 22,
    minStock: 10,
    maxStock: 50,
    reorderPoint: 15,
    location: { aisle: 'C', shelf: '01', bin: 'RL-02' },
    unitCost: 195.00,
    barcode: '7893000301006',
    lastUpdated: new Date(Date.now() - 3600000 * 3).toISOString(),
    status: 'ok',
    supplier: 'Prysmian Cabos',
    description: 'Cabo unipolar de cobre eletrolítico têmpera mole para instalações elétricas'
  },
  {
    id: 'itm-07',
    sku: 'ELT-309',
    name: 'Disjuntor Bipolar Din 32A Curva C 3kA',
    category: 'Material Elétrico',
    unit: 'un',
    currentStock: 34,
    minStock: 15,
    maxStock: 70,
    reorderPoint: 20,
    location: { aisle: 'C', shelf: '02', bin: 'CX-19' },
    unitCost: 28.90,
    barcode: '7893000309007',
    lastUpdated: new Date(Date.now() - 3600000 * 18).toISOString(),
    status: 'ok',
    supplier: 'Schneider Electric',
    description: 'Mini disjuntor termomagnético trilho DIN padrão IEC'
  },
  {
    id: 'itm-08',
    sku: 'HID-401',
    name: 'Tubo Soldável PVC 25mm 3/4" Barra 6m Marrom',
    category: 'Hidráulica & Tubos',
    unit: 'un',
    currentStock: 4,
    minStock: 12,
    maxStock: 40,
    reorderPoint: 15,
    location: { aisle: 'D', shelf: '01', bin: 'TB-01' },
    unitCost: 26.50,
    barcode: '7894000401008',
    lastUpdated: new Date(Date.now() - 3600000 * 1).toISOString(),
    status: 'critico',
    supplier: 'Tigre Tubos e Conexões',
    description: 'Tubo de PVC para condução de água fria predial'
  },
  {
    id: 'itm-09',
    sku: 'FIX-502',
    name: 'Parafuso Autoatarraxante Inox Cabeça Panela 4,2 x 25mm',
    category: 'Fixação & Parafusos',
    unit: 'cx',
    currentStock: 15,
    minStock: 8,
    maxStock: 30,
    reorderPoint: 10,
    location: { aisle: 'E', shelf: '01', bin: 'GV-03' },
    unitCost: 45.00,
    barcode: '7895000502009',
    lastUpdated: new Date(Date.now() - 3600000 * 30).toISOString(),
    status: 'ok',
    supplier: 'Ciser Parafusos',
    description: 'Caixa com 200 unidades em aço inoxidável 304 fenda Philips'
  },
  {
    id: 'itm-10',
    sku: 'QUI-601',
    name: 'Desengripante e Lubrificante Spray WD-40 300ml',
    category: 'Químicos & Lubrificantes',
    unit: 'un',
    currentStock: 0,
    minStock: 10,
    maxStock: 36,
    reorderPoint: 12,
    location: { aisle: 'F', shelf: '01', bin: 'PR-02' },
    unitCost: 32.00,
    barcode: '7896000601010',
    lastUpdated: new Date(Date.now() - 3600000 * 6).toISOString(),
    status: 'zerado',
    supplier: 'WD-40 Company',
    description: 'Spray multiuso para proteção contra umidade, ferrugem e corrosão'
  },
  {
    id: 'itm-11',
    sku: 'QUI-605',
    name: 'Graxa Azul para Rolamentos de Alta Rotação Balde 1kg',
    category: 'Químicos & Lubrificantes',
    unit: 'un',
    currentStock: 9,
    minStock: 6,
    maxStock: 20,
    reorderPoint: 8,
    location: { aisle: 'F', shelf: '02', bin: 'PR-06' },
    unitCost: 68.00,
    barcode: '7896000605011',
    lastUpdated: new Date(Date.now() - 3600000 * 15).toISOString(),
    status: 'ok',
    supplier: 'Ipiranga Lubrificantes',
    description: 'Graxa à base de sabão de lítio aditivada para rolamentos industriais'
  },
  {
    id: 'itm-12',
    sku: 'PEC-701',
    name: 'Rolamento Rígido de Esferas 6205-2RS C3',
    category: 'Peças & Rolamentos',
    unit: 'un',
    currentStock: 14,
    minStock: 10,
    maxStock: 40,
    reorderPoint: 15,
    location: { aisle: 'E', shelf: '02', bin: 'GV-11' },
    unitCost: 42.00,
    barcode: '7897000701012',
    lastUpdated: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'ok',
    supplier: 'SKF do Brasil',
    description: 'Rolamento com blindagem dupla de borracha 25x52x15mm folga radial C3'
  }
];

// Initial stock movements history
let movements: StockMovement[] = [
  {
    id: 'mov-1001',
    itemId: 'itm-10',
    itemSku: 'QUI-601',
    itemName: 'Desengripante e Lubrificante Spray WD-40 300ml',
    category: 'Químicos & Lubrificantes',
    type: 'SAIDA',
    quantity: 4,
    unit: 'un',
    previousStock: 4,
    newStock: 0,
    reason: 'Manutenção Geral - Torno Mecânico 03',
    recipient: 'Marcos Souza (Oficina Mecânica)',
    operator: 'Carlos Eduardo',
    operatorRole: 'Almoxarife Chefe',
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    unitCost: 32.00,
    totalCost: 128.00,
    notes: 'Zerou estoque físico. Solicitada compra emergencial.'
  },
  {
    id: 'mov-1002',
    itemId: 'itm-08',
    itemSku: 'HID-401',
    itemName: 'Tubo Soldável PVC 25mm 3/4" Barra 6m Marrom',
    category: 'Hidráulica & Tubos',
    type: 'SAIDA',
    quantity: 8,
    unit: 'un',
    previousStock: 12,
    newStock: 4,
    reason: 'Reparo na Rede de Alimentação Bloco Administrativo',
    recipient: 'José Antônio (Equipe Predial)',
    operator: 'Carlos Eduardo',
    operatorRole: 'Almoxarife Chefe',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    unitCost: 26.50,
    totalCost: 212.00
  },
  {
    id: 'mov-1003',
    itemId: 'itm-06',
    itemSku: 'ELT-301',
    itemName: 'Cabo Flexível 2,5mm² 750V Antichama Rolo 100m Azul',
    category: 'Material Elétrico',
    type: 'ENTRADA',
    quantity: 10,
    unit: 'rolo',
    previousStock: 12,
    newStock: 22,
    reason: 'Recebimento de Fornecedor - NF-e 448192',
    recipient: 'Almoxarifado Central',
    operator: 'Fernanda Lima',
    operatorRole: 'Operadora de Almoxarifado',
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    unitCost: 195.00,
    totalCost: 1950.00,
    notes: 'Conferido e etiquetado no corredor C'
  },
  {
    id: 'mov-1004',
    itemId: 'itm-04',
    itemSku: 'FER-201',
    itemName: 'Furadeira e Parafusadeira de Impacto 18V Bateria',
    category: 'Ferramentas',
    type: 'DEVOLUCAO',
    quantity: 1,
    unit: 'un',
    previousStock: 5,
    newStock: 6,
    reason: 'Devolução de Cautela de Ferramenta #771',
    recipient: 'Almoxarifado Central',
    operator: 'Carlos Eduardo',
    operatorRole: 'Almoxarife Chefe',
    timestamp: new Date(Date.now() - 3600000 * 0.8).toISOString(),
    unitCost: 650.00,
    totalCost: 650.00,
    notes: 'Equipamento conferido em perfeito estado de funcionamento com 2 baterias'
  },
  {
    id: 'mov-1005',
    itemId: 'itm-01',
    itemSku: 'EPI-101',
    itemName: 'Capacete de Segurança com Jugular e Carneira',
    category: 'EPI & Segurança',
    type: 'SAIDA',
    quantity: 12,
    unit: 'un',
    previousStock: 60,
    newStock: 48,
    reason: 'Entrega de EPIs - Equipe de Obra Civil Bloco 4',
    recipient: 'Eduardo Martins (Construção)',
    operator: 'Fernanda Lima',
    operatorRole: 'Operadora de Almoxarifado',
    timestamp: new Date(Date.now() - 86400000 * 1 - 3600000 * 4).toISOString(),
    unitCost: 38.50,
    totalCost: 462.00
  },
  {
    id: 'mov-1006',
    itemId: 'itm-02',
    itemSku: 'EPI-104',
    itemName: 'Óculos de Proteção Antirrisco e Anti-embaçante',
    category: 'EPI & Segurança',
    type: 'SAIDA',
    quantity: 15,
    unit: 'un',
    previousStock: 27,
    newStock: 12,
    reason: 'Substituição periódica SESMT',
    recipient: 'Beatriz Castro (SESMT)',
    operator: 'Carlos Eduardo',
    operatorRole: 'Almoxarife Chefe',
    timestamp: new Date(Date.now() - 86400000 * 1 - 3600000 * 7).toISOString(),
    unitCost: 14.20,
    totalCost: 213.00
  },
  {
    id: 'mov-1007',
    itemId: 'itm-07',
    itemSku: 'ELT-309',
    itemName: 'Disjuntor Termomagnético Bipolar Din 32A Curva C',
    category: 'Material Elétrico',
    type: 'ENTRADA',
    quantity: 20,
    unit: 'un',
    previousStock: 18,
    newStock: 38,
    reason: 'Recebimento Fornecedor Schneider - NF 39182',
    recipient: 'Almoxarifado Central',
    operator: 'Fernanda Lima',
    operatorRole: 'Operadora de Almoxarifado',
    timestamp: new Date(Date.now() - 86400000 * 2 - 3600000 * 2).toISOString(),
    unitCost: 45.90,
    totalCost: 918.00
  },
  {
    id: 'mov-1008',
    itemId: 'itm-09',
    itemSku: 'FIX-501',
    itemName: 'Parafuso Sextavado Aço Zincado Grau 5 1/2" x 2" c/ Porca',
    category: 'Fixação & Parafusos',
    type: 'SAIDA',
    quantity: 80,
    unit: 'cx',
    previousStock: 160,
    newStock: 80,
    reason: 'Montagem de Estruturas Metálicas Galpão 3',
    recipient: 'Sandro Moreira (Caldeiraria)',
    operator: 'Carlos Eduardo',
    operatorRole: 'Almoxarife Chefe',
    timestamp: new Date(Date.now() - 86400000 * 3 - 3600000 * 5).toISOString(),
    unitCost: 1.85,
    totalCost: 148.00
  },
  {
    id: 'mov-1009',
    itemId: 'itm-05',
    itemSku: 'FER-208',
    itemName: 'Chave Grifo Heavy Duty 18" para Tubos',
    category: 'Ferramentas',
    type: 'ENTRADA',
    quantity: 4,
    unit: 'un',
    previousStock: 4,
    newStock: 8,
    reason: 'Compra de Ferramental para Equipe Hidráulica',
    recipient: 'Almoxarifado Central',
    operator: 'Fernanda Lima',
    operatorRole: 'Operadora de Almoxarifado',
    timestamp: new Date(Date.now() - 86400000 * 4 - 3600000 * 3).toISOString(),
    unitCost: 148.00,
    totalCost: 592.00
  },
  {
    id: 'mov-1010',
    itemId: 'itm-12',
    itemSku: 'PEC-701',
    itemName: 'Rolamento Rígido de Esferas 6205-2RS C3',
    category: 'Peças & Rolamentos',
    type: 'SAIDA',
    quantity: 6,
    unit: 'un',
    previousStock: 20,
    newStock: 14,
    reason: 'Reforma de Motores Elétricos Linha 2',
    recipient: 'Marcos Souza (Oficina Mecânica)',
    operator: 'Carlos Eduardo',
    operatorRole: 'Almoxarife Chefe',
    timestamp: new Date(Date.now() - 86400000 * 5 - 3600000 * 6).toISOString(),
    unitCost: 42.00,
    totalCost: 252.00
  },
  {
    id: 'mov-1011',
    itemId: 'itm-11',
    itemSku: 'QUI-605',
    itemName: 'Graxa Azul para Rolamentos de Alta Rotação Balde 1kg',
    category: 'Químicos & Lubrificantes',
    type: 'ENTRADA',
    quantity: 5,
    unit: 'un',
    previousStock: 4,
    newStock: 9,
    reason: 'Reposição Preventiva de Lubrificantes',
    recipient: 'Almoxarifado Central',
    operator: 'Fernanda Lima',
    operatorRole: 'Operadora de Almoxarifado',
    timestamp: new Date(Date.now() - 86400000 * 6 - 3600000 * 4).toISOString(),
    unitCost: 68.00,
    totalCost: 340.00
  }
];

// Initial requisitions (balcão de atendimento e pedidos das equipes)
let requisitions: Requisition[] = [
  {
    id: 'req-01',
    code: 'REQ-2026-041',
    requesterName: 'Roberto Mendes',
    department: 'Manutenção Elétrica',
    workOrder: 'OS-8821',
    priority: 'URGENTE',
    status: 'PENDENTE',
    items: [
      { itemId: 'itm-06', sku: 'ELT-301', name: 'Cabo Flexível 2,5mm² 750V Rolo 100m', quantity: 2, unit: 'rolo', availableStock: 22 },
      { itemId: 'itm-07', sku: 'ELT-309', name: 'Disjuntor Bipolar Din 32A Curva C', quantity: 4, unit: 'un', availableStock: 34 }
    ],
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    notes: 'Troca urgente do painel do compressor auxiliar 02'
  },
  {
    id: 'req-02',
    code: 'REQ-2026-042',
    requesterName: 'Beatriz Castro',
    department: 'Segurança do Trabalho (SESMT)',
    workOrder: 'INTEGRACAO-NOVOS-COLAB',
    priority: 'NORMAL',
    status: 'PENDENTE',
    items: [
      { itemId: 'itm-01', sku: 'EPI-101', name: 'Capacete de Segurança com Jugular', quantity: 5, unit: 'un', availableStock: 48 },
      { itemId: 'itm-02', sku: 'EPI-104', name: 'Óculos de Proteção Antirrisco', quantity: 5, unit: 'un', availableStock: 12 },
      { itemId: 'itm-03', sku: 'EPI-108', name: 'Luva de Vaqueta Mista Tam G', quantity: 5, unit: 'par', availableStock: 18 }
    ],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    notes: 'Kit de integração para nova turma de montagem predial'
  }
];

// Active operators presence tracker
const activeClients = new Map<WebSocket, ConnectedOperator>();

function getStats() {
  const totalItems = items.length;
  const totalStockUnits = items.reduce((acc, it) => acc + it.currentStock, 0);
  const totalValuation = items.reduce((acc, it) => acc + (it.currentStock * it.unitCost), 0);
  const criticalAlertsCount = items.filter(it => it.status === 'critico' || it.status === 'zerado').length;
  const lowStockAlertsCount = items.filter(it => it.status === 'baixo').length;
  
  const today = new Date().toISOString().split('T')[0];
  const movementsTodayCount = movements.filter(m => m.timestamp.startsWith(today)).length;
  const pendingRequisitionsCount = requisitions.filter(r => r.status === 'PENDENTE').length;

  return {
    totalItems,
    totalStockUnits,
    totalValuation,
    criticalAlertsCount,
    lowStockAlertsCount,
    movementsTodayCount,
    pendingRequisitionsCount
  };
}

function getServerState(): RealtimeServerState {
  return {
    items,
    movements,
    requisitions,
    operators: Array.from(activeClients.values()),
    stats: getStats()
  };
}

// WebSocket setup attached to HTTP server
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(msg: WSServerMessage) {
  const data = JSON.stringify(msg);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

const DEFAULT_OPERATOR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

wss.on('connection', (ws, req) => {
  const clientIndex = activeClients.size + 1;
  const initialOp: ConnectedOperator = {
    id: `op-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: `Operador Almoxarifado #${clientIndex}`,
    role: 'Almoxarife',
    color: DEFAULT_OPERATOR_COLORS[clientIndex % DEFAULT_OPERATOR_COLORS.length],
    connectedAt: new Date().toISOString()
  };

  activeClients.set(ws, initialOp);

  // Send initial state to newly connected client
  const initState: WSServerMessage = {
    type: 'INIT_STATE',
    payload: getServerState()
  };
  ws.send(JSON.stringify(initState));

  // Broadcast updated operators list
  broadcast({
    type: 'OPERATORS_CHANGED',
    payload: Array.from(activeClients.values())
  });

  ws.on('message', (messageRaw) => {
    try {
      const data = JSON.parse(messageRaw.toString());
      if (data.type === 'IDENTIFY') {
        const current = activeClients.get(ws);
        if (current) {
          current.name = data.payload.name || current.name;
          current.role = data.payload.role || current.role;
          current.color = data.payload.color || current.color;
          broadcast({
            type: 'OPERATORS_CHANGED',
            payload: Array.from(activeClients.values())
          });
        }
      }
    } catch {
      // Ignored malformed JSON
    }
  });

  ws.on('close', () => {
    activeClients.delete(ws);
    broadcast({
      type: 'OPERATORS_CHANGED',
      payload: Array.from(activeClients.values())
    });
  });
});

// REST API ROUTES
app.get('/api/inventory', (req, res) => {
  res.json(getServerState());
});

app.get('/api/movements', (req, res) => {
  res.json(movements);
});

app.get('/api/requisitions', (req, res) => {
  res.json(requisitions);
});

// POST a new inventory movement (ENTRADA, SAIDA, DEVOLUCAO, AJUSTE)
app.post('/api/inventory/movement', (req, res) => {
  try {
    const { itemId, type, quantity, reason, recipient, operator, notes, customUnitCost } = req.body;

    if (!itemId || !type || quantity === undefined) {
      return res.status(400).json({ error: 'Parâmetros inválidos. itemId, type e quantity são obrigatórios.' });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'A quantidade deve ser um número positivo maior que zero.' });
    }

    const item = items.find(i => i.id === itemId || i.sku === itemId || i.barcode === itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado no almoxarifado.' });
    }

    const previousStock = item.currentStock;
    let newStock = previousStock;

    if (type === 'SAIDA') {
      if (qty > previousStock) {
        return res.status(400).json({ 
          error: `Saldo insuficiente em estoque! Disponível: ${previousStock} ${item.unit}. Solicitado: ${qty} ${item.unit}.` 
        });
      }
      newStock = previousStock - qty;
    } else if (type === 'ENTRADA' || type === 'DEVOLUCAO') {
      newStock = previousStock + qty;
    } else if (type === 'AJUSTE') {
      newStock = qty;
    } else {
      return res.status(400).json({ error: 'Tipo de movimentação inválido.' });
    }

    // Update item in database
    item.currentStock = newStock;
    item.lastUpdated = new Date().toISOString();
    item.status = calculateStatus(item.currentStock, item.minStock);
    if (customUnitCost && Number(customUnitCost) > 0) {
      item.unitCost = Number(customUnitCost);
    }

    const unitCost = item.unitCost;
    const totalCost = unitCost * qty;

    const newMovement: StockMovement = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemId: item.id,
      itemSku: item.sku,
      itemName: item.name,
      category: item.category,
      type,
      quantity: qty,
      unit: item.unit,
      previousStock,
      newStock,
      reason: reason || (type === 'SAIDA' ? 'Saída avulsa' : type === 'ENTRADA' ? 'Entrada manual' : type === 'DEVOLUCAO' ? 'Devolução de material' : 'Ajuste de inventário'),
      recipient: recipient || 'Não especificado',
      operator: operator || 'Almoxarife',
      timestamp: new Date().toISOString(),
      unitCost,
      totalCost,
      notes
    };

    movements.unshift(newMovement);

    // Real-time broadcast to all clients
    broadcast({
      type: 'MOVEMENT_CREATED',
      payload: {
        movement: newMovement,
        updatedItem: item
      }
    });

    // If item reached critical or zero, broadcast alert
    if (item.status === 'zerado') {
      broadcast({
        type: 'ALERT_BROADCAST',
        payload: {
          title: 'Estoque Zerado!',
          message: `O item "${item.name}" (${item.sku}) está totalmente ESGOTADO no almoxarifado!`,
          type: 'error'
        }
      });
    } else if (item.status === 'critico') {
      broadcast({
        type: 'ALERT_BROADCAST',
        payload: {
          title: 'Alerta Crítico de Estoque',
          message: `Item "${item.sku}" atingiu estoque crítico: ${item.currentStock} ${item.unit} (Mín: ${item.minStock}).`,
          type: 'warning'
        }
      });
    }

    res.json({ success: true, movement: newMovement, updatedItem: item });
  } catch (err: any) {
    console.error('Erro ao processar movimentação:', err);
    res.status(500).json({ error: 'Falha interna ao registrar movimentação.' });
  }
});

// POST a new inventory item
app.post('/api/inventory/items', (req, res) => {
  try {
    const { sku, name, category, unit, currentStock, minStock, maxStock, reorderPoint, location, unitCost, barcode, supplier, description } = req.body;

    if (!sku || !name || !category || !unit) {
      return res.status(400).json({ error: 'SKU, Nome, Categoria e Unidade são obrigatórios.' });
    }

    const existing = items.find(i => i.sku.toUpperCase() === sku.toUpperCase().trim());
    if (existing) {
      return res.status(400).json({ error: `Já existe um item cadastrado com o SKU "${sku}".` });
    }

    const stock = Number(currentStock) || 0;
    const min = Number(minStock) || 10;
    const max = Number(maxStock) || Math.max(min * 3, stock * 2, 50);
    const reorder = Number(reorderPoint) || Math.round(min * 1.2);
    const cost = Number(unitCost) || 0;

    const newItem: InventoryItem = {
      id: `itm-${Date.now()}`,
      sku: sku.toUpperCase().trim(),
      name: name.trim(),
      category,
      unit,
      currentStock: stock,
      minStock: min,
      maxStock: max,
      reorderPoint: reorder,
      location: {
        aisle: location?.aisle?.toUpperCase() || 'A',
        shelf: location?.shelf || '01',
        bin: location?.bin || 'CX-01'
      },
      unitCost: cost,
      barcode: barcode || `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
      lastUpdated: new Date().toISOString(),
      status: calculateStatus(stock, min),
      supplier: supplier || '',
      description: description || ''
    };

    items.unshift(newItem);

    // Record an initial entrance movement if stock > 0
    if (stock > 0) {
      const initMov: StockMovement = {
        id: `mov-${Date.now()}`,
        itemId: newItem.id,
        itemSku: newItem.sku,
        itemName: newItem.name,
        category: newItem.category,
        type: 'ENTRADA',
        quantity: stock,
        unit: newItem.unit,
        previousStock: 0,
        newStock: stock,
        reason: 'Cadastro Inicial / Saldo de Abertura',
        recipient: 'Almoxarifado',
        operator: 'Sistema de Cadastro',
        timestamp: new Date().toISOString(),
        unitCost: cost,
        totalCost: cost * stock,
        notes: 'Cadastro inicial do produto no sistema'
      };
      movements.unshift(initMov);
    }

    broadcast({
      type: 'ITEM_CREATED',
      payload: newItem
    });

    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cadastrar novo item.' });
  }
});

// PUT update an existing item
app.put('/api/inventory/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    const item = items.find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado.' });
    }

    const { name, category, unit, minStock, maxStock, reorderPoint, location, unitCost, supplier, description } = req.body;

    if (name) item.name = name.trim();
    if (category) item.category = category;
    if (unit) item.unit = unit;
    if (minStock !== undefined) item.minStock = Number(minStock);
    if (maxStock !== undefined) item.maxStock = Number(maxStock);
    if (reorderPoint !== undefined) item.reorderPoint = Number(reorderPoint);
    if (location) item.location = { ...item.location, ...location };
    if (unitCost !== undefined) item.unitCost = Number(unitCost);
    if (supplier !== undefined) item.supplier = supplier;
    if (description !== undefined) item.description = description;

    item.status = calculateStatus(item.currentStock, item.minStock);
    item.lastUpdated = new Date().toISOString();

    broadcast({
      type: 'ITEM_UPDATED',
      payload: item
    });

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar dados do item.' });
  }
});

// POST new requisition
app.post('/api/requisitions', (req, res) => {
  try {
    const { requesterName, department, workOrder, priority, items: reqItems, notes } = req.body;

    if (!requesterName || !department || !Array.isArray(reqItems) || reqItems.length === 0) {
      return res.status(400).json({ error: 'Dados incompletos. Solicitante, setor e itens são obrigatórios.' });
    }

    const preparedItems = reqItems.map((item: any) => {
      const found = items.find(i => i.id === item.itemId || i.sku === item.itemId);
      return {
        itemId: found ? found.id : item.itemId,
        sku: found ? found.sku : item.sku || 'N/A',
        name: found ? found.name : item.name || 'Material',
        quantity: Number(item.quantity) || 1,
        unit: found ? found.unit : (item.unit || 'un'),
        availableStock: found ? found.currentStock : 0
      };
    });

    const newReq: Requisition = {
      id: `req-${Date.now()}`,
      code: `REQ-${new Date().getFullYear()}-${String(requisitions.length + 43).padStart(3, '0')}`,
      requesterName: requesterName.trim(),
      department: department.trim(),
      workOrder: workOrder?.trim() || undefined,
      priority: priority || 'NORMAL',
      status: 'PENDENTE',
      items: preparedItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: notes || undefined
    };

    requisitions.unshift(newReq);

    broadcast({
      type: 'REQUISITION_CREATED',
      payload: newReq
    });

    if (newReq.priority === 'URGENTE') {
      broadcast({
        type: 'ALERT_BROADCAST',
        payload: {
          title: 'Nova Requisição URGENTE!',
          message: `${newReq.requesterName} (${newReq.department}) abriu a requisição ${newReq.code} com prioridade máxima.`,
          type: 'warning'
        }
      });
    }

    res.status(201).json(newReq);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar requisição.' });
  }
});

// PATCH fulfill requisition (Atender requisição no balcão)
app.patch('/api/requisitions/:id/fulfill', (req, res) => {
  try {
    const { id } = req.params;
    const { operator } = req.body;

    const requisition = requisitions.find(r => r.id === id);
    if (!requisition) {
      return res.status(404).json({ error: 'Requisição não encontrada.' });
    }

    if (requisition.status === 'ATENDIDA') {
      return res.status(400).json({ error: 'Esta requisição já foi atendida anteriormente.' });
    }

    // Check if all items have enough stock
    for (const reqItem of requisition.items) {
      const inventoryItem = items.find(i => i.id === reqItem.itemId);
      if (!inventoryItem) {
        return res.status(400).json({ error: `Item ${reqItem.name} não localizado no inventário.` });
      }
      if (inventoryItem.currentStock < reqItem.quantity) {
        return res.status(400).json({ 
          error: `Saldo insuficiente para atender ${reqItem.name}. Necessário: ${reqItem.quantity} ${reqItem.unit}, Disponível: ${inventoryItem.currentStock} ${reqItem.unit}.` 
        });
      }
    }

    // Deduct items and create movements
    const updatedItemsList: InventoryItem[] = [];
    const createdMovements: StockMovement[] = [];

    for (const reqItem of requisition.items) {
      const inventoryItem = items.find(i => i.id === reqItem.itemId)!;
      const prev = inventoryItem.currentStock;
      inventoryItem.currentStock -= reqItem.quantity;
      inventoryItem.status = calculateStatus(inventoryItem.currentStock, inventoryItem.minStock);
      inventoryItem.lastUpdated = new Date().toISOString();
      updatedItemsList.push(inventoryItem);

      const mov: StockMovement = {
        id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        itemId: inventoryItem.id,
        itemSku: inventoryItem.sku,
        itemName: inventoryItem.name,
        category: inventoryItem.category,
        type: 'SAIDA',
        quantity: reqItem.quantity,
        unit: inventoryItem.unit,
        previousStock: prev,
        newStock: inventoryItem.currentStock,
        reason: `Atendimento ${requisition.code} (${requisition.workOrder || 'Sem OS'})`,
        recipient: `${requisition.requesterName} (${requisition.department})`,
        operator: operator || 'Almoxarife de Plantão',
        timestamp: new Date().toISOString(),
        unitCost: inventoryItem.unitCost,
        totalCost: inventoryItem.unitCost * reqItem.quantity,
        notes: `Requisição aprovada e entregue no balcão`
      };
      movements.unshift(mov);
      createdMovements.push(mov);
    }

    requisition.status = 'ATENDIDA';
    requisition.attendedBy = operator || 'Almoxarife';
    requisition.updatedAt = new Date().toISOString();

    // Broadcast update
    broadcast({
      type: 'REQUISITION_UPDATED',
      payload: {
        requisition,
        updatedItems: updatedItemsList
      }
    });

    // Also broadcast each movement
    for (let i = 0; i < createdMovements.length; i++) {
      broadcast({
        type: 'MOVEMENT_CREATED',
        payload: {
          movement: createdMovements[i],
          updatedItem: updatedItemsList[i]
        }
      });
    }

    res.json({ success: true, requisition, updatedItems: updatedItemsList });
  } catch (err) {
    console.error('Erro ao atender requisição:', err);
    res.status(500).json({ error: 'Falha ao processar atendimento da requisição.' });
  }
});

// Vite middleware and static serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Almoxarifado em Tempo Real] Servidor ativo em http://0.0.0.0:${PORT}`);
  });
}

start();
