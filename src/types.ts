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

export interface Employee {
  id: string;
  name: string;
  registration: string; // Matrícula
  department: string;   // Setor / Depto
  role: string;         // Cargo / Função
  phone?: string;       // Ramal / Celular
  email?: string;
  status: 'ATIVO' | 'INATIVO';
  createdAt: string;
  notes?: string;
}

export interface DatabaseInfo {
  engine: string;
  filePath: string;
  status: string;
  sizeBytes: number;
  sizeFormatted: string;
  tables: {
    items: number;
    movements: number;
    requisitions: number;
    employees: number;
  };
}

export type UserRole = 'ADMIN' | 'OPERADOR' | 'ALMOXARIFE' | 'CONSULTA';

export interface SystemUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  department?: string;
  email?: string;
  status: 'ATIVO' | 'BLOQUEADO';
  createdAt: string;
  lastLogin?: string;
  avatarColor?: string;
}

export interface AuthSession {
  user: SystemUser;
  token: string;
}

export interface ConnectedOperator {
  id: string;
  name: string;
  role: string;
  color: string;
  connectedAt: string;
  activeTab?: string;
  username?: string;
  isAdmin?: boolean;
}

export interface RealtimeServerState {
  items: InventoryItem[];
  movements: StockMovement[];
  requisitions: Requisition[];
  employees: Employee[];
  operators: ConnectedOperator[];
  database?: DatabaseInfo;
  databaseInfo?: DatabaseInfo;
  stats: {
    totalItems: number;
    totalStockUnits: number;
    totalValuation: number;
    criticalAlertsCount: number;
    lowStockAlertsCount: number;
    movementsTodayCount: number;
    pendingRequisitionsCount: number;
    totalEmployeesCount: number;
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
  | { type: 'EMPLOYEE_CREATED'; payload: Employee }
  | { type: 'EMPLOYEE_UPDATED'; payload: Employee }
  | { type: 'EMPLOYEE_DELETED'; payload: string }
  | { type: 'OPERATORS_CHANGED'; payload: ConnectedOperator[] }
  | { type: 'ALERT_BROADCAST'; payload: { title: string; message: string; type: 'warning' | 'error' | 'info' | 'success' } };
