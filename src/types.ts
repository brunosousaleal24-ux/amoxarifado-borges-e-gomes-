export type ItemCategory = 
  | 'EPI & Segurança'
  | 'Ferramentas'
  | 'Material Elétrico'
  | 'Hidráulica & Tubos'
  | 'Fixação & Parafusos'
  | 'Químicos & Lubrificantes'
  | 'Peças & Rolamentos';

export type StockUnit = 'un' | 'm' | 'kg' | 'par' | 'cx' | 'rolo' | 'litro' | 'conj';

export type StockStatus = 'ok' | 'baixo' | 'critico' | 'zerado';

export interface WarehouseLocation {
  aisle: string;   // Corredor (ex: A, B, C)
  shelf: string;   // Prateleira (ex: 01, 02, 03)
  bin: string;     // Box / Gaveta (ex: B-12)
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: ItemCategory;
  unit: StockUnit;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  location: WarehouseLocation;
  unitCost: number; // in BRL
  barcode: string;
  lastUpdated: string;
  status: StockStatus;
  description?: string;
  supplier?: string;
}

export type MovementType = 'ENTRADA' | 'SAIDA' | 'DEVOLUCAO' | 'AJUSTE';

export interface StockMovement {
  id: string;
  itemId: string;
  itemSku: string;
  itemName: string;
  category: ItemCategory;
  type: MovementType;
  quantity: number;
  unit: StockUnit;
  previousStock: number;
  newStock: number;
  reason: string; // Ex: OS-402, NF-e 1829, Cautela de EPI
  recipient: string; // Solicitante / Obra / Setor
  operator: string; // Nome do almoxarife
  operatorRole?: string;
  timestamp: string;
  unitCost: number;
  totalCost: number;
  notes?: string;
}

export type RequisitionPriority = 'BAIXA' | 'NORMAL' | 'URGENTE';
export type RequisitionStatus = 'PENDENTE' | 'APROVADA' | 'ATENDIDA' | 'CANCELADA';

export interface RequisitionItem {
  itemId: string;
  sku: string;
  name: string;
  quantity: number;
  unit: StockUnit;
  availableStock: number;
}

export interface Requisition {
  id: string;
  code: string; // e.g. REQ-2026-084
  requesterName: string;
  department: string;
  workOrder?: string; // Ordem de Serviço
  priority: RequisitionPriority;
  status: RequisitionStatus;
  items: RequisitionItem[];
  createdAt: string;
  updatedAt: string;
  attendedBy?: string;
  notes?: string;
}

export interface ConnectedOperator {
  id: string;
  name: string;
  role: string;
  color: string;
  connectedAt: string;
  activeTab?: string;
}

export interface RealtimeServerState {
  items: InventoryItem[];
  movements: StockMovement[];
  requisitions: Requisition[];
  operators: ConnectedOperator[];
  stats: {
    totalItems: number;
    totalStockUnits: number;
    totalValuation: number;
    criticalAlertsCount: number;
    lowStockAlertsCount: number;
    movementsTodayCount: number;
    pendingRequisitionsCount: number;
  };
}

export type WSClientMessage = 
  | { type: 'IDENTIFY'; payload: { name: string; role: string; color: string } }
  | { type: 'PING' };

export type WSServerMessage = 
  | { type: 'INIT_STATE'; payload: RealtimeServerState }
  | { type: 'ITEM_UPDATED'; payload: InventoryItem }
  | { type: 'ITEM_CREATED'; payload: InventoryItem }
  | { type: 'MOVEMENT_CREATED'; payload: { movement: StockMovement; updatedItem: InventoryItem } }
  | { type: 'REQUISITION_CREATED'; payload: Requisition }
  | { type: 'REQUISITION_UPDATED'; payload: { requisition: Requisition; updatedItems?: InventoryItem[] } }
  | { type: 'OPERATORS_CHANGED'; payload: ConnectedOperator[] }
  | { type: 'ALERT_BROADCAST'; payload: { title: string; message: string; type: 'warning' | 'error' | 'info' | 'success' } };
