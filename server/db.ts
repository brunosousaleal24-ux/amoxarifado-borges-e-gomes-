import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { 
  InventoryItem, 
  StockMovement, 
  Requisition, 
  Employee,
  StockStatus,
  ItemCategory,
  StockUnit,
  SystemUser,
  UserRole
} from '../src/types.ts';

// Ensure data directory or db file exists
const dbPath = path.join(process.cwd(), 'almoxarifado.db');
export const db = new Database(dbPath);

// Enable WAL mode for high concurrency and performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      currentStock REAL NOT NULL,
      minStock REAL NOT NULL,
      maxStock REAL NOT NULL,
      reorderPoint REAL NOT NULL,
      aisle TEXT NOT NULL,
      shelf TEXT NOT NULL,
      bin TEXT NOT NULL,
      unitCost REAL NOT NULL,
      barcode TEXT NOT NULL,
      lastUpdated TEXT NOT NULL,
      status TEXT NOT NULL,
      supplier TEXT,
      description TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_items_barcode ON items (barcode);
    CREATE INDEX IF NOT EXISTS idx_items_sku ON items (sku);
    CREATE INDEX IF NOT EXISTS idx_items_category ON items (category);

    CREATE TABLE IF NOT EXISTS movements (
      id TEXT PRIMARY KEY,
      itemId TEXT NOT NULL,
      itemSku TEXT NOT NULL,
      itemName TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      previousStock REAL NOT NULL,
      newStock REAL NOT NULL,
      reason TEXT NOT NULL,
      recipient TEXT NOT NULL,
      operator TEXT NOT NULL,
      operatorRole TEXT,
      timestamp TEXT NOT NULL,
      unitCost REAL NOT NULL,
      totalCost REAL NOT NULL,
      notes TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_movements_item ON movements (itemId);
    CREATE INDEX IF NOT EXISTS idx_movements_timestamp ON movements (timestamp DESC);

    CREATE TABLE IF NOT EXISTS requisitions (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      requesterName TEXT NOT NULL,
      department TEXT NOT NULL,
      workOrder TEXT,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      itemsJson TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      attendedBy TEXT,
      notes TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_requisitions_status ON requisitions (status);
    CREATE INDEX IF NOT EXISTS idx_requisitions_created ON requisitions (createdAt DESC);

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      registration TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      status TEXT NOT NULL DEFAULT 'ATIVO',
      createdAt TEXT NOT NULL,
      notes TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_employees_reg ON employees (registration);
    CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees (department);

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'OPERADOR',
      department TEXT,
      email TEXT,
      status TEXT NOT NULL DEFAULT 'ATIVO',
      createdAt TEXT NOT NULL,
      lastLogin TEXT,
      avatarColor TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
  `);

  // Seed default data if empty
  seedIfEmpty();
}

function calculateStatus(current: number, min: number): StockStatus {
  if (current <= 0) return 'zerado';
  if (current <= min * 0.6) return 'critico';
  if (current <= min) return 'baixo';
  return 'ok';
}

function seedIfEmpty() {
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM items');
  const countRow = countStmt.get() as { count: number };

  if (countRow.count === 0) {
    console.log('[SQLite] Populando catálogo de itens inicial no banco de dados...');
    const initialItems: InventoryItem[] = [
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
        name: 'Cabo Flexível Antichama 2,5mm² 750V Preto',
        category: 'Material Elétrico',
        unit: 'm',
        currentStock: 340,
        minStock: 100,
        maxStock: 1000,
        reorderPoint: 200,
        location: { aisle: 'C', shelf: '01', bin: 'RL-02' },
        unitCost: 2.15,
        barcode: '7893000301006',
        lastUpdated: new Date(Date.now() - 3600000 * 3).toISOString(),
        status: 'ok',
        supplier: 'Prysmian Cabos',
        description: 'Cabo isolado em PVC 70°C conforme norma NBR NM 247-3'
      },
      {
        id: 'itm-07',
        sku: 'ELT-309',
        name: 'Disjuntor Termomagnético Bipolar Din 32A Curva C',
        category: 'Material Elétrico',
        unit: 'un',
        currentStock: 38,
        minStock: 15,
        maxStock: 60,
        reorderPoint: 20,
        location: { aisle: 'C', shelf: '02', bin: 'CX-19' },
        unitCost: 45.90,
        barcode: '7893000309007',
        lastUpdated: new Date(Date.now() - 3600000 * 6).toISOString(),
        status: 'ok',
        supplier: 'Schneider Electric',
        description: 'Mini disjuntor padrão DIN para proteção de circuitos industriais'
      },
      {
        id: 'itm-08',
        sku: 'HID-402',
        name: 'Válvula de Esfera Tripartida Passagem Plena 1" BSP',
        category: 'Hidráulica & Tubos',
        unit: 'un',
        currentStock: 14,
        minStock: 10,
        maxStock: 35,
        reorderPoint: 12,
        location: { aisle: 'D', shelf: '01', bin: 'GV-03' },
        unitCost: 112.00,
        barcode: '7894000402008',
        lastUpdated: new Date(Date.now() - 3600000 * 30).toISOString(),
        status: 'ok',
        supplier: 'Mipel Válvulas',
        description: 'Corpo em aço inox 316, vedações em PTFE para vapor e fluidos'
      },
      {
        id: 'itm-09',
        sku: 'FIX-501',
        name: 'Parafuso Sextavado Aço Zincado Grau 5 1/2" x 2" c/ Porca',
        category: 'Fixação & Parafusos',
        unit: 'cx',
        currentStock: 80,
        minStock: 25,
        maxStock: 150,
        reorderPoint: 40,
        location: { aisle: 'E', shelf: '01', bin: 'PR-10' },
        unitCost: 1.85,
        barcode: '7895000501009',
        lastUpdated: new Date(Date.now() - 3600000 * 18).toISOString(),
        status: 'ok',
        supplier: 'Ciser Parafusos',
        description: 'Caixa com 100 conjuntos de parafusos sextavados e porcas autotravantes'
      },
      {
        id: 'itm-10',
        sku: 'QUI-601',
        name: 'Desengripante Lubrificante Spray Multiuso 300ml',
        category: 'Químicos & Lubrificantes',
        unit: 'un',
        currentStock: 8,
        minStock: 12,
        maxStock: 48,
        reorderPoint: 15,
        location: { aisle: 'F', shelf: '01', bin: 'AM-01' },
        unitCost: 19.90,
        barcode: '7896000601010',
        lastUpdated: new Date(Date.now() - 3600000 * 4).toISOString(),
        status: 'baixo',
        supplier: 'WD-40 Company',
        description: 'Lata aerossol com bico prolongador para soltar partes oxidadas'
      },
      {
        id: 'itm-11',
        sku: 'QUI-605',
        name: 'Graxa Azul para Rolamentos de Alta Rotação Balde 1kg',
        category: 'Químicos & Lubrificantes',
        unit: 'un',
        currentStock: 9,
        minStock: 5,
        maxStock: 20,
        reorderPoint: 6,
        location: { aisle: 'F', shelf: '02', bin: 'AM-04' },
        unitCost: 68.00,
        barcode: '7896000605011',
        lastUpdated: new Date(Date.now() - 3600000 * 40).toISOString(),
        status: 'ok',
        supplier: 'Mobil Lubrificantes',
        description: 'Graxa complexa de lítio com aditivos extrema pressão'
      },
      {
        id: 'itm-12',
        sku: 'PEC-701',
        name: 'Rolamento Rígido de Esferas 6205-2RS C3',
        category: 'Peças & Rolamentos',
        unit: 'un',
        currentStock: 14,
        minStock: 8,
        maxStock: 30,
        reorderPoint: 10,
        location: { aisle: 'G', shelf: '01', bin: 'CX-02' },
        unitCost: 42.00,
        barcode: '7897000701012',
        lastUpdated: new Date(Date.now() - 3600000 * 15).toISOString(),
        status: 'ok',
        supplier: 'SKF do Brasil',
        description: 'Rolamento blindado com vedação de borracha nitrílica em ambos os lados'
      }
    ];

    const insertItem = db.prepare(`
      INSERT INTO items (
        id, sku, name, category, unit, currentStock, minStock, maxStock, reorderPoint,
        aisle, shelf, bin, unitCost, barcode, lastUpdated, status, supplier, description
      ) VALUES (
        @id, @sku, @name, @category, @unit, @currentStock, @minStock, @maxStock, @reorderPoint,
        @aisle, @shelf, @bin, @unitCost, @barcode, @lastUpdated, @status, @supplier, @description
      )
    `);

    const insertMany = db.transaction((itemsList: InventoryItem[]) => {
      for (const it of itemsList) {
        insertItem.run({
          ...it,
          aisle: it.location.aisle,
          shelf: it.location.shelf,
          bin: it.location.bin
        });
      }
    });

    insertMany(initialItems);
  }

  // Seed Movements if empty
  const movCountStmt = db.prepare('SELECT COUNT(*) as count FROM movements');
  const movCount = (movCountStmt.get() as { count: number }).count;

  if (movCount === 0) {
    console.log('[SQLite] Populando histórico de movimentações no banco de dados...');
    const initialMovements: StockMovement[] = [
      {
        id: 'mov-1001',
        itemId: 'itm-01',
        itemSku: 'EPI-101',
        itemName: 'Capacete de Segurança com Jugular e Carneira',
        category: 'EPI & Segurança',
        type: 'SAIDA',
        quantity: 4,
        unit: 'un',
        previousStock: 52,
        newStock: 48,
        reason: 'Cautela de EPIs - Equipe de Manutenção Elétrica',
        recipient: 'Carlos Andrade (Manutenção)',
        operator: 'Carlos Eduardo',
        operatorRole: 'Almoxarife Chefe',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        unitCost: 38.50,
        totalCost: 154.00,
        notes: 'Entregue com termo de cautela assinado'
      },
      {
        id: 'mov-1002',
        itemId: 'itm-06',
        itemSku: 'ELT-301',
        itemName: 'Cabo Flexível Antichama 2,5mm² 750V Preto',
        category: 'Material Elétrico',
        type: 'ENTRADA',
        quantity: 100,
        unit: 'm',
        previousStock: 240,
        newStock: 340,
        reason: 'Recebimento NF-e 44921 - Fornecedor Prysmian',
        recipient: 'Almoxarifado Central',
        operator: 'Fernanda Lima',
        operatorRole: 'Operadora de Almoxarifado',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        unitCost: 2.15,
        totalCost: 215.00,
        notes: 'Mercadoria inspecionada e aceita no recebimento'
      },
      {
        id: 'mov-1003',
        itemId: 'itm-10',
        itemSku: 'QUI-601',
        itemName: 'Desengripante Lubrificante Spray Multiuso 300ml',
        category: 'Químicos & Lubrificantes',
        type: 'SAIDA',
        quantity: 2,
        unit: 'un',
        previousStock: 10,
        newStock: 8,
        reason: 'OS-1049 - Manutenção Preventiva Ponte Rolante',
        recipient: 'Lucas Silveira (Mecânica)',
        operator: 'Carlos Eduardo',
        operatorRole: 'Almoxarife Chefe',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        unitCost: 19.90,
        totalCost: 39.80
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
        reason: 'Devolução de Cautela Diária - Turno Manhã',
        recipient: 'Almoxarifado Central',
        operator: 'Fernanda Lima',
        operatorRole: 'Operadora de Almoxarifado',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
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
      }
    ];

    const insertMov = db.prepare(`
      INSERT INTO movements (
        id, itemId, itemSku, itemName, category, type, quantity, unit,
        previousStock, newStock, reason, recipient, operator, operatorRole,
        timestamp, unitCost, totalCost, notes
      ) VALUES (
        @id, @itemId, @itemSku, @itemName, @category, @type, @quantity, @unit,
        @previousStock, @newStock, @reason, @recipient, @operator, @operatorRole,
        @timestamp, @unitCost, @totalCost, @notes
      )
    `);

    const insertManyMovs = db.transaction((movList: StockMovement[]) => {
      for (const m of movList) {
        insertMov.run({
          ...m,
          notes: m.notes || null,
          operatorRole: m.operatorRole || null
        });
      }
    });

    insertManyMovs(initialMovements);
  }

  // Seed Requisitions if empty
  const reqCountStmt = db.prepare('SELECT COUNT(*) as count FROM requisitions');
  const reqCount = (reqCountStmt.get() as { count: number }).count;

  if (reqCount === 0) {
    console.log('[SQLite] Populando fila de requisições no banco de dados...');
    const initialRequisitions: Requisition[] = [
      {
        id: 'req-01',
        code: 'REQ-2026-081',
        requesterName: 'Marcos Vinicius',
        department: 'Manutenção Elétrica',
        workOrder: 'OS-2026-441',
        priority: 'URGENTE',
        status: 'PENDENTE',
        items: [
          {
            itemId: 'itm-06',
            sku: 'ELT-301',
            name: 'Cabo Flexível Antichama 2,5mm² 750V Preto',
            quantity: 50,
            unit: 'm',
            availableStock: 340
          },
          {
            itemId: 'itm-07',
            sku: 'ELT-309',
            name: 'Disjuntor Termomagnético Bipolar Din 32A Curva C',
            quantity: 2,
            unit: 'un',
            availableStock: 38
          }
        ],
        createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        notes: 'Troca de fiação no quadro de distribuição QDG-03 - Parada programada'
      },
      {
        id: 'req-02',
        code: 'REQ-2026-082',
        requesterName: 'Ana Beatriz Souza',
        department: 'Engenharia Civil / Obras',
        workOrder: 'OBRA-BLOCO-4',
        priority: 'NORMAL',
        status: 'PENDENTE',
        items: [
          {
            itemId: 'itm-01',
            sku: 'EPI-101',
            name: 'Capacete de Segurança com Jugular e Carneira',
            quantity: 5,
            unit: 'un',
            availableStock: 48
          },
          {
            itemId: 'itm-03',
            sku: 'EPI-108',
            name: 'Luva de Vaqueta Mista Cano Curto Tam G',
            quantity: 5,
            unit: 'par',
            availableStock: 18
          }
        ],
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        notes: 'EPIs para novos estagiários e técnicos de campo'
      }
    ];

    const insertReq = db.prepare(`
      INSERT INTO requisitions (
        id, code, requesterName, department, workOrder, priority, status,
        itemsJson, createdAt, updatedAt, attendedBy, notes
      ) VALUES (
        @id, @code, @requesterName, @department, @workOrder, @priority, @status,
        @itemsJson, @createdAt, @updatedAt, @attendedBy, @notes
      )
    `);

    const insertManyReqs = db.transaction((reqList: Requisition[]) => {
      for (const r of reqList) {
        insertReq.run({
          ...r,
          itemsJson: JSON.stringify(r.items),
          workOrder: r.workOrder || null,
          attendedBy: r.attendedBy || null,
          notes: r.notes || null
        });
      }
    });

    insertManyReqs(initialRequisitions);
  }

  // Seed Employees if empty
  const empCountStmt = db.prepare('SELECT COUNT(*) as count FROM employees');
  const empCount = (empCountStmt.get() as { count: number }).count;

  if (empCount === 0) {
    console.log('[SQLite] Populando funcionários cadastrados no banco de dados...');
    const initialEmployees: Employee[] = [
      {
        id: 'emp-01',
        name: 'Carlos Eduardo Meireles',
        registration: 'MAT-1004',
        department: 'Almoxarifado Central',
        role: 'Almoxarife Chefe',
        phone: '(11) 98765-4321',
        email: 'carlos.almoxarife@empresa.com.br',
        status: 'ATIVO',
        createdAt: new Date(Date.now() - 86400000 * 180).toISOString(),
        notes: 'Responsável pelo recebimento e controle patrimonial'
      },
      {
        id: 'emp-02',
        name: 'Fernanda Lima Silva',
        registration: 'MAT-1009',
        department: 'Almoxarifado Central',
        role: 'Operadora de Almoxarifado',
        phone: '(11) 98765-4322',
        email: 'fernanda.lima@empresa.com.br',
        status: 'ATIVO',
        createdAt: new Date(Date.now() - 86400000 * 120).toISOString(),
        notes: 'Operadora de balcão e conferente de NF'
      },
      {
        id: 'emp-03',
        name: 'Carlos Andrade',
        registration: 'MAT-2033',
        department: 'Manutenção Elétrica',
        role: 'Eletricista de Manutenção',
        phone: '(11) 97722-1100',
        email: 'carlos.andrade@empresa.com.br',
        status: 'ATIVO',
        createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
        notes: 'Certificação NR-10 e SEP'
      },
      {
        id: 'emp-04',
        name: 'Lucas Silveira',
        registration: 'MAT-2045',
        department: 'Mecânica Industrial',
        role: 'Mecânico Ajustador',
        phone: '(11) 97722-1145',
        email: 'lucas.silveira@empresa.com.br',
        status: 'ATIVO',
        createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
        notes: 'Especialista em pontes rolantes e tornos'
      },
      {
        id: 'emp-05',
        name: 'Beatriz Castro',
        registration: 'MAT-3012',
        department: 'SESMT & Segurança',
        role: 'Técnica de Segurança do Trabalho',
        phone: '(11) 96655-8899',
        email: 'beatriz.castro@empresa.com.br',
        status: 'ATIVO',
        createdAt: new Date(Date.now() - 86400000 * 100).toISOString(),
        notes: 'Emissão de cautelas de EPI e treinamentos de segurança'
      },
      {
        id: 'emp-06',
        name: 'Eduardo Martins',
        registration: 'MAT-4020',
        department: 'Obras & Engenharia Civil',
        role: 'Encarregado de Obras',
        phone: '(11) 96655-4422',
        email: 'eduardo.obras@empresa.com.br',
        status: 'ATIVO',
        createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
        notes: 'Frente de obra Bloco 4'
      },
      {
        id: 'emp-07',
        name: 'Marcos Vinicius',
        registration: 'MAT-2078',
        department: 'Manutenção Elétrica',
        role: 'Técnico em Eletrotécnica',
        phone: '(11) 97722-3388',
        email: 'marcos.vinicius@empresa.com.br',
        status: 'ATIVO',
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        notes: 'Responsável pelos quadros elétricos e automação'
      }
    ];

    const insertEmp = db.prepare(`
      INSERT INTO employees (
        id, name, registration, department, role, phone, email, status, createdAt, notes
      ) VALUES (
        @id, @name, @registration, @department, @role, @phone, @email, @status, @createdAt, @notes
      )
    `);

    const insertManyEmps = db.transaction((empList: Employee[]) => {
      for (const e of empList) {
        insertEmp.run({
          ...e,
          phone: e.phone || null,
          email: e.email || null,
          notes: e.notes || null
        });
      }
    });

    insertManyEmps(initialEmployees);
  }

  // Seed default users if users table is empty
  const userCountRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCountRow.count === 0) {
    console.log('[SQLite] Criando usuários de acesso padrão...');
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, passwordHash, name, role, department, email, status, createdAt, avatarColor)
      VALUES (@id, @username, @passwordHash, @name, @role, @department, @email, @status, @createdAt, @avatarColor)
    `);

    const now = new Date().toISOString();
    const defaultUsers = [
      {
        id: 'usr-admin',
        username: 'admin',
        passwordHash: hashPassword('admin123'),
        name: 'Administrador do Sistema',
        role: 'ADMIN' as UserRole,
        department: 'Diretoria & TI',
        email: 'admin@almoxarifado.com',
        status: 'ATIVO',
        createdAt: now,
        avatarColor: '#f59e0b'
      },
      {
        id: 'usr-marcos',
        username: 'marcos',
        passwordHash: hashPassword('123'),
        name: 'Marcos Almeida',
        role: 'OPERADOR' as UserRole,
        department: 'Almoxarifado Central',
        email: 'marcos@almoxarifado.com',
        status: 'ATIVO',
        createdAt: now,
        avatarColor: '#3b82f6'
      },
      {
        id: 'usr-carla',
        username: 'carla',
        passwordHash: hashPassword('123'),
        name: 'Carla Dias',
        role: 'OPERADOR' as UserRole,
        department: 'Controle de Materiais',
        email: 'carla@almoxarifado.com',
        status: 'ATIVO',
        createdAt: now,
        avatarColor: '#10b981'
      },
      {
        id: 'usr-lucas',
        username: 'lucas',
        passwordHash: hashPassword('123'),
        name: 'Lucas Ferreira',
        role: 'OPERADOR' as UserRole,
        department: 'Recebimento & Balcão',
        email: 'lucas@almoxarifado.com',
        status: 'ATIVO',
        createdAt: now,
        avatarColor: '#8b5cf6'
      },
      {
        id: 'usr-visitante',
        username: 'visitante',
        passwordHash: hashPassword('123'),
        name: 'Auditoria & Diretoria',
        role: 'CONSULTA' as UserRole,
        department: 'Supervisão Geral',
        email: 'auditoria@almoxarifado.com',
        status: 'ATIVO',
        createdAt: now,
        avatarColor: '#64748b'
      }
    ];

    for (const u of defaultUsers) {
      insertUser.run(u);
    }
  }
}

// Data Access Layer

// ITEMS
export function getAllItems(): InventoryItem[] {
  const rows = db.prepare('SELECT * FROM items ORDER BY sku ASC').all() as any[];
  return rows.map(r => ({
    id: r.id,
    sku: r.sku,
    name: r.name,
    category: r.category as ItemCategory,
    unit: r.unit as StockUnit,
    currentStock: Number(r.currentStock),
    minStock: Number(r.minStock),
    maxStock: Number(r.maxStock),
    reorderPoint: Number(r.reorderPoint),
    location: {
      aisle: r.aisle,
      shelf: r.shelf,
      bin: r.bin
    },
    unitCost: Number(r.unitCost),
    barcode: r.barcode,
    lastUpdated: r.lastUpdated,
    status: r.status as StockStatus,
    supplier: r.supplier || undefined,
    description: r.description || undefined
  }));
}

export function getItemById(id: string): InventoryItem | null {
  const r = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as any;
  if (!r) return null;
  return {
    id: r.id,
    sku: r.sku,
    name: r.name,
    category: r.category,
    unit: r.unit,
    currentStock: Number(r.currentStock),
    minStock: Number(r.minStock),
    maxStock: Number(r.maxStock),
    reorderPoint: Number(r.reorderPoint),
    location: { aisle: r.aisle, shelf: r.shelf, bin: r.bin },
    unitCost: Number(r.unitCost),
    barcode: r.barcode,
    lastUpdated: r.lastUpdated,
    status: r.status,
    supplier: r.supplier || undefined,
    description: r.description || undefined
  };
}

export function getItemByBarcodeOrSku(code: string): InventoryItem | null {
  const clean = code.trim().toLowerCase();
  const r = db.prepare('SELECT * FROM items WHERE LOWER(barcode) = ? OR LOWER(sku) = ?').get(clean, clean) as any;
  if (!r) return null;
  return getItemById(r.id);
}

export function createItem(item: InventoryItem): InventoryItem {
  const stmt = db.prepare(`
    INSERT INTO items (
      id, sku, name, category, unit, currentStock, minStock, maxStock, reorderPoint,
      aisle, shelf, bin, unitCost, barcode, lastUpdated, status, supplier, description
    ) VALUES (
      @id, @sku, @name, @category, @unit, @currentStock, @minStock, @maxStock, @reorderPoint,
      @aisle, @shelf, @bin, @unitCost, @barcode, @lastUpdated, @status, @supplier, @description
    )
  `);

  stmt.run({
    ...item,
    aisle: item.location.aisle,
    shelf: item.location.shelf,
    bin: item.location.bin,
    supplier: item.supplier || null,
    description: item.description || null
  });

  return item;
}

export function updateItem(item: InventoryItem): InventoryItem {
  const stmt = db.prepare(`
    UPDATE items SET
      sku = @sku,
      name = @name,
      category = @category,
      unit = @unit,
      currentStock = @currentStock,
      minStock = @minStock,
      maxStock = @maxStock,
      reorderPoint = @reorderPoint,
      aisle = @aisle,
      shelf = @shelf,
      bin = @bin,
      unitCost = @unitCost,
      barcode = @barcode,
      lastUpdated = @lastUpdated,
      status = @status,
      supplier = @supplier,
      description = @description
    WHERE id = @id
  `);

  stmt.run({
    ...item,
    aisle: item.location.aisle,
    shelf: item.location.shelf,
    bin: item.location.bin,
    supplier: item.supplier || null,
    description: item.description || null
  });

  return item;
}

export function updateStockQuantity(id: string, newStock: number): InventoryItem | null {
  const item = getItemById(id);
  if (!item) return null;
  
  const status = calculateStatus(newStock, item.minStock);
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE items SET 
      currentStock = ?, 
      status = ?, 
      lastUpdated = ? 
    WHERE id = ?
  `).run(newStock, status, now, id);

  return getItemById(id);
}

// MOVEMENTS
export function getAllMovements(limit = 200): StockMovement[] {
  const rows = db.prepare('SELECT * FROM movements ORDER BY timestamp DESC LIMIT ?').all(limit) as any[];
  return rows.map(r => ({
    id: r.id,
    itemId: r.itemId,
    itemSku: r.itemSku,
    itemName: r.itemName,
    category: r.category as ItemCategory,
    type: r.type,
    quantity: Number(r.quantity),
    unit: r.unit as StockUnit,
    previousStock: Number(r.previousStock),
    newStock: Number(r.newStock),
    reason: r.reason,
    recipient: r.recipient,
    operator: r.operator,
    operatorRole: r.operatorRole || undefined,
    timestamp: r.timestamp,
    unitCost: Number(r.unitCost),
    totalCost: Number(r.totalCost),
    notes: r.notes || undefined
  }));
}

export function addMovement(mov: StockMovement): StockMovement {
  const stmt = db.prepare(`
    INSERT INTO movements (
      id, itemId, itemSku, itemName, category, type, quantity, unit,
      previousStock, newStock, reason, recipient, operator, operatorRole,
      timestamp, unitCost, totalCost, notes
    ) VALUES (
      @id, @itemId, @itemSku, @itemName, @category, @type, @quantity, @unit,
      @previousStock, @newStock, @reason, @recipient, @operator, @operatorRole,
      @timestamp, @unitCost, @totalCost, @notes
    )
  `);

  stmt.run({
    ...mov,
    operatorRole: mov.operatorRole || null,
    notes: mov.notes || null
  });

  return mov;
}

// REQUISITIONS
export function getAllRequisitions(): Requisition[] {
  const rows = db.prepare('SELECT * FROM requisitions ORDER BY createdAt DESC').all() as any[];
  return rows.map(r => ({
    id: r.id,
    code: r.code,
    requesterName: r.requesterName,
    department: r.department,
    workOrder: r.workOrder || undefined,
    priority: r.priority,
    status: r.status,
    items: JSON.parse(r.itemsJson || '[]'),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    attendedBy: r.attendedBy || undefined,
    notes: r.notes || undefined
  }));
}

export function getRequisitionById(id: string): Requisition | null {
  const r = db.prepare('SELECT * FROM requisitions WHERE id = ?').get(id) as any;
  if (!r) return null;
  return {
    id: r.id,
    code: r.code,
    requesterName: r.requesterName,
    department: r.department,
    workOrder: r.workOrder || undefined,
    priority: r.priority,
    status: r.status,
    items: JSON.parse(r.itemsJson || '[]'),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    attendedBy: r.attendedBy || undefined,
    notes: r.notes || undefined
  };
}

export function addRequisition(req: Requisition): Requisition {
  const stmt = db.prepare(`
    INSERT INTO requisitions (
      id, code, requesterName, department, workOrder, priority, status,
      itemsJson, createdAt, updatedAt, attendedBy, notes
    ) VALUES (
      @id, @code, @requesterName, @department, @workOrder, @priority, @status,
      @itemsJson, @createdAt, @updatedAt, @attendedBy, @notes
    )
  `);

  stmt.run({
    ...req,
    itemsJson: JSON.stringify(req.items),
    workOrder: req.workOrder || null,
    attendedBy: req.attendedBy || null,
    notes: req.notes || null
  });

  return req;
}

export function updateRequisition(req: Requisition): Requisition {
  const stmt = db.prepare(`
    UPDATE requisitions SET
      code = @code,
      requesterName = @requesterName,
      department = @department,
      workOrder = @workOrder,
      priority = @priority,
      status = @status,
      itemsJson = @itemsJson,
      updatedAt = @updatedAt,
      attendedBy = @attendedBy,
      notes = @notes
    WHERE id = @id
  `);

  stmt.run({
    ...req,
    itemsJson: JSON.stringify(req.items),
    workOrder: req.workOrder || null,
    attendedBy: req.attendedBy || null,
    notes: req.notes || null
  });

  return req;
}

// EMPLOYEES (FUNCIONÁRIOS)
export function getAllEmployees(): Employee[] {
  const rows = db.prepare('SELECT * FROM employees ORDER BY name ASC').all() as any[];
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    registration: r.registration,
    department: r.department,
    role: r.role,
    phone: r.phone || undefined,
    email: r.email || undefined,
    status: r.status,
    createdAt: r.createdAt,
    notes: r.notes || undefined
  }));
}

export function getEmployeeById(id: string): Employee | null {
  const r = db.prepare('SELECT * FROM employees WHERE id = ?').get(id) as any;
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    registration: r.registration,
    department: r.department,
    role: r.role,
    phone: r.phone || undefined,
    email: r.email || undefined,
    status: r.status,
    createdAt: r.createdAt,
    notes: r.notes || undefined
  };
}

export function addEmployee(emp: Employee): Employee {
  const stmt = db.prepare(`
    INSERT INTO employees (
      id, name, registration, department, role, phone, email, status, createdAt, notes
    ) VALUES (
      @id, @name, @registration, @department, @role, @phone, @email, @status, @createdAt, @notes
    )
  `);

  stmt.run({
    ...emp,
    phone: emp.phone || null,
    email: emp.email || null,
    notes: emp.notes || null
  });

  return emp;
}

export function updateEmployee(emp: Employee): Employee {
  const stmt = db.prepare(`
    UPDATE employees SET
      name = @name,
      registration = @registration,
      department = @department,
      role = @role,
      phone = @phone,
      email = @email,
      status = @status,
      notes = @notes
    WHERE id = @id
  `);

  stmt.run({
    ...emp,
    phone: emp.phone || null,
    email: emp.email || null,
    notes: emp.notes || null
  });

  return emp;
}

export function deleteEmployee(id: string): boolean {
  const info = db.prepare('DELETE FROM employees WHERE id = ?').run(id);
  return info.changes > 0;
}

export function deleteItem(id: string): boolean {
  const info = db.prepare('DELETE FROM items WHERE id = ?').run(id);
  return info.changes > 0;
}

// ==========================================
// USERS & AUTHENTICATION (SQLite)
// ==========================================

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_salt_almoxarifado_2026').digest('hex');
}

export function getAllUsers(): SystemUser[] {
  const rows = db.prepare('SELECT id, username, name, role, department, email, status, createdAt, lastLogin, avatarColor FROM users ORDER BY name ASC').all() as any[];
  return rows.map(r => ({
    id: r.id,
    username: r.username,
    name: r.name,
    role: r.role as UserRole,
    department: r.department || undefined,
    email: r.email || undefined,
    status: r.status,
    createdAt: r.createdAt,
    lastLogin: r.lastLogin || undefined,
    avatarColor: r.avatarColor || '#f59e0b'
  }));
}

export function getUserById(id: string): SystemUser | null {
  const r = db.prepare('SELECT id, username, name, role, department, email, status, createdAt, lastLogin, avatarColor FROM users WHERE id = ?').get(id) as any;
  if (!r) return null;
  return {
    id: r.id,
    username: r.username,
    name: r.name,
    role: r.role as UserRole,
    department: r.department || undefined,
    email: r.email || undefined,
    status: r.status,
    createdAt: r.createdAt,
    lastLogin: r.lastLogin || undefined,
    avatarColor: r.avatarColor || '#f59e0b'
  };
}

export function getUserByUsername(username: string): (SystemUser & { passwordHash: string }) | null {
  const clean = username.trim().toLowerCase();
  const r = db.prepare('SELECT * FROM users WHERE LOWER(username) = ?').get(clean) as any;
  if (!r) return null;
  return {
    id: r.id,
    username: r.username,
    name: r.name,
    role: r.role as UserRole,
    department: r.department || undefined,
    email: r.email || undefined,
    status: r.status,
    createdAt: r.createdAt,
    lastLogin: r.lastLogin || undefined,
    avatarColor: r.avatarColor || '#f59e0b',
    passwordHash: r.passwordHash
  };
}

export function verifyUserPassword(username: string, plainPassword: string): SystemUser | null {
  const user = getUserByUsername(username);
  if (!user) return null;
  if (user.status !== 'ATIVO') return null;

  const inputHash = hashPassword(plainPassword);
  if (inputHash !== user.passwordHash) {
    return null;
  }

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export function updateUserLastLogin(id: string): void {
  const now = new Date().toISOString();
  db.prepare('UPDATE users SET lastLogin = ? WHERE id = ?').run(now, id);
}

export function createUser(data: {
  username: string;
  password: string;
  name: string;
  role: UserRole;
  department?: string;
  email?: string;
  avatarColor?: string;
}): SystemUser {
  const id = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const passwordHash = hashPassword(data.password);
  const createdAt = new Date().toISOString();
  const avatarColor = data.avatarColor || (data.role === 'ADMIN' ? '#f59e0b' : data.role === 'OPERADOR' ? '#3b82f6' : '#10b981');

  const stmt = db.prepare(`
    INSERT INTO users (id, username, passwordHash, name, role, department, email, status, createdAt, avatarColor)
    VALUES (@id, @username, @passwordHash, @name, @role, @department, @email, 'ATIVO', @createdAt, @avatarColor)
  `);

  stmt.run({
    id,
    username: data.username.trim().toLowerCase(),
    passwordHash,
    name: data.name.trim(),
    role: data.role,
    department: data.department || null,
    email: data.email || null,
    createdAt,
    avatarColor
  });

  return {
    id,
    username: data.username.trim().toLowerCase(),
    name: data.name.trim(),
    role: data.role,
    department: data.department,
    email: data.email,
    status: 'ATIVO',
    createdAt,
    avatarColor
  };
}

export function updateUser(
  id: string,
  data: Partial<{
    name: string;
    role: UserRole;
    department: string;
    email: string;
    status: 'ATIVO' | 'BLOQUEADO';
    password?: string;
    avatarColor?: string;
  }>
): SystemUser | null {
  const existing = getUserById(id);
  if (!existing) return null;

  let query = 'UPDATE users SET name = @name, role = @role, department = @department, email = @email, status = @status';
  const params: any = {
    id,
    name: data.name !== undefined ? data.name : existing.name,
    role: data.role !== undefined ? data.role : existing.role,
    department: data.department !== undefined ? (data.department || null) : (existing.department || null),
    email: data.email !== undefined ? (data.email || null) : (existing.email || null),
    status: data.status !== undefined ? data.status : existing.status
  };

  if (data.password && data.password.trim().length > 0) {
    query += ', passwordHash = @passwordHash';
    params.passwordHash = hashPassword(data.password);
  }

  if (data.avatarColor) {
    query += ', avatarColor = @avatarColor';
    params.avatarColor = data.avatarColor;
  }

  query += ' WHERE id = @id';

  db.prepare(query).run(params);
  return getUserById(id);
}

export function deleteUser(id: string): boolean {
  const info = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return info.changes > 0;
}

// Database Diagnostics / Info
export function getDatabaseInfo() {
  const fileSize = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;
  const itemsCount = (db.prepare('SELECT COUNT(*) as c FROM items').get() as any).c;
  const movementsCount = (db.prepare('SELECT COUNT(*) as c FROM movements').get() as any).c;
  const requisitionsCount = (db.prepare('SELECT COUNT(*) as c FROM requisitions').get() as any).c;
  const employeesCount = (db.prepare('SELECT COUNT(*) as c FROM employees').get() as any).c;
  const usersCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;

  return {
    engine: 'SQLite 3 (better-sqlite3)',
    filePath: 'almoxarifado.db',
    status: 'Conectado & Operacional (WAL)',
    sizeBytes: fileSize,
    sizeFormatted: `${(fileSize / 1024).toFixed(1)} KB`,
    tables: {
      items: itemsCount,
      movements: movementsCount,
      requisitions: requisitionsCount,
      employees: employeesCount,
      users: usersCount
    }
  };
}
