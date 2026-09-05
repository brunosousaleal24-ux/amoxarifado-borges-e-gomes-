import express from 'express';
import http from 'http';
import path from 'path';
import crypto from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { 
  InventoryItem, 
  StockMovement, 
  Requisition, 
  ConnectedOperator, 
  RealtimeServerState,
  WSServerMessage,
  StockStatus,
  Employee,
  SystemUser,
  UserRole
} from './src/types.ts';
import {
  initDatabase,
  getAllItems,
  getItemById,
  getItemByBarcodeOrSku,
  createItem,
  updateItem,
  updateStockQuantity,
  deleteItem,
  getAllMovements,
  addMovement,
  getAllRequisitions,
  getRequisitionById,
  addRequisition,
  updateRequisition,
  getAllEmployees,
  getEmployeeById,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  getDatabaseInfo,
  getAllUsers,
  getUserById,
  getUserByUsername,
  verifyUserPassword,
  updateUserLastLogin,
  createUser,
  updateUser,
  deleteUser
} from './server/db.ts';

// Initialize SQLite database and tables
initDatabase();

const app = express();
const PORT = 3000;
const server = http.createServer(app);

app.use(express.json());

// In-memory active session tokens: token -> { user: SystemUser; expiresAt: number }
const activeSessions = new Map<string, { user: SystemUser; expiresAt: number }>();

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Autenticação necessária. Faça login para continuar.' });
  }

  const token = authHeader.substring(7);
  const session = activeSessions.get(token);

  if (!session) {
    return res.status(401).json({ error: 'Sessão expirada ou inválida. Faça login novamente.' });
  }

  const freshUser = getUserById(session.user.id);
  if (!freshUser || freshUser.status !== 'ATIVO') {
    activeSessions.delete(token);
    return res.status(401).json({ error: 'Conta de usuário desativada ou não encontrada.' });
  }

  session.user = freshUser;
  (req as any).user = freshUser;
  (req as any).authToken = token;
  next();
}

function adminOnlyMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user as SystemUser;
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado. Apenas o Administrador possui acesso total a esta área.' });
  }
  next();
}

// Helper function to calculate stock status
function calculateStatus(current: number, min: number): StockStatus {
  if (current <= 0) return 'zerado';
  if (current <= min * 0.6) return 'critico';
  if (current <= min) return 'baixo';
  return 'ok';
}

// Active operators presence tracker
const activeClients = new Map<WebSocket, ConnectedOperator>();

function getStats() {
  const items = getAllItems();
  const movements = getAllMovements(500);
  const requisitions = getAllRequisitions();
  const employees = getAllEmployees();

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
    pendingRequisitionsCount,
    totalEmployeesCount: employees.length
  };
}

function getServerState(): RealtimeServerState {
  return {
    items: getAllItems(),
    movements: getAllMovements(200),
    requisitions: getAllRequisitions(),
    employees: getAllEmployees(),
    operators: Array.from(activeClients.values()),
    databaseInfo: getDatabaseInfo(),
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

wss.on('connection', (ws) => {
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
          current.username = data.payload.username || current.username;
          current.isAdmin = data.payload.isAdmin !== undefined ? data.payload.isAdmin : (data.payload.role === 'ADMIN' || data.payload.role === 'Administrador');
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

// ==========================================
// AUTHENTICATION & USERS ENDPOINTS
// ==========================================

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Informe usuário e senha para acessar o almoxarifado.' });
    }

    const user = verifyUserPassword(username, password);
    if (!user) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos, ou usuário bloqueado pelo administrador.' });
    }

    const token = generateToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    activeSessions.set(token, { user, expiresAt });
    updateUserLastLogin(user.id);

    res.json({
      success: true,
      token,
      user
    });
  } catch (err: any) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno ao realizar autenticação.' });
  }
});

// Current user profile
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: (req as any).user });
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    activeSessions.delete(token);
  }
  res.json({ success: true });
});

// Change own password
app.post('/api/auth/change-password', authMiddleware, (req, res) => {
  try {
    const user = (req as any).user as SystemUser;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Informe a senha atual e a nova senha.' });
    }

    if (newPassword.length < 3) {
      return res.status(400).json({ error: 'A nova senha deve possuir pelo menos 3 caracteres.' });
    }

    const verified = verifyUserPassword(user.username, currentPassword);
    if (!verified) {
      return res.status(400).json({ error: 'Senha atual incorreta.' });
    }

    updateUser(user.id, { password: newPassword });
    res.json({ success: true, message: 'Senha atualizada com sucesso!' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao alterar senha.' });
  }
});

// USER MANAGEMENT (Full Admin Access)
app.get('/api/users', authMiddleware, (req, res) => {
  res.json(getAllUsers());
});

app.post('/api/users', authMiddleware, adminOnlyMiddleware, (req, res) => {
  try {
    const { username, password, name, role, department, email } = req.body;

    if (!username || !password || !name || !role) {
      return res.status(400).json({ error: 'Usuário, senha, nome completo e função/perfil são obrigatórios.' });
    }

    if (password.length < 3) {
      return res.status(400).json({ error: 'A senha do usuário deve ter no mínimo 3 caracteres.' });
    }

    const existing = getUserByUsername(username);
    if (existing) {
      return res.status(400).json({ error: `O nome de usuário "${username}" já existe. Escolha outro.` });
    }

    const created = createUser({
      username,
      password,
      name,
      role: role as UserRole,
      department,
      email
    });

    res.status(201).json(created);
  } catch (err: any) {
    console.error('Erro ao cadastrar usuário:', err);
    res.status(500).json({ error: 'Erro ao criar usuário no banco de dados.' });
  }
});

app.put('/api/users/:id', authMiddleware, adminOnlyMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const existing = getUserById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const { name, role, department, email, status, password } = req.body;
    const updated = updateUser(id, {
      name,
      role,
      department,
      email,
      status,
      password: password && password.trim() ? password.trim() : undefined
    });

    res.json(updated);
  } catch (err: any) {
    console.error('Erro ao atualizar usuário:', err);
    res.status(500).json({ error: 'Erro ao atualizar dados do usuário.' });
  }
});

app.delete('/api/users/:id', authMiddleware, adminOnlyMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user as SystemUser;

    if (id === currentUser.id) {
      return res.status(400).json({ error: 'O administrador não pode excluir a própria conta em uso.' });
    }

    const target = getUserById(id);
    if (!target) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    deleteUser(id);
    res.json({ success: true, message: `Usuário ${target.name} removido com sucesso.` });
  } catch (err: any) {
    console.error('Erro ao excluir usuário:', err);
    res.status(500).json({ error: 'Erro ao excluir usuário do banco de dados.' });
  }
});

// Admin item deletion endpoint (Total Access)
app.delete('/api/inventory/items/:id', authMiddleware, adminOnlyMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const item = getItemById(id);
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado no almoxarifado.' });
    }

    deleteItem(id);

    broadcast({
      type: 'ALERT_BROADCAST',
      payload: {
        title: 'Item Removido',
        message: `O item "${item.name}" (${item.sku}) foi excluído do catálogo pelo administrador.`,
        type: 'warning'
      }
    });

    res.json({ success: true, message: `Item "${item.name}" excluído pelo administrador.` });
  } catch (err: any) {
    console.error('Erro ao excluir item:', err);
    res.status(500).json({ error: 'Erro ao excluir item do estoque.' });
  }
});

// REST API ROUTES
app.get('/api/inventory', (req, res) => {
  res.json(getServerState());
});

app.get('/api/movements', (req, res) => {
  res.json(getAllMovements());
});

app.get('/api/requisitions', (req, res) => {
  res.json(getAllRequisitions());
});

app.get('/api/employees', (req, res) => {
  res.json(getAllEmployees());
});

app.get('/api/database/info', (req, res) => {
  res.json(getDatabaseInfo());
});

// Barcode fast lookup endpoint
app.get('/api/barcode/lookup', (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(400).json({ error: 'Parâmetro code é obrigatório.' });
  }
  const item = getItemByBarcodeOrSku(code);
  if (!item) {
    return res.status(404).json({ error: 'Item não localizado pelo código informado.' });
  }
  res.json(item);
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

    const item = getItemById(itemId) || getItemByBarcodeOrSku(itemId);
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
    if (customUnitCost && Number(customUnitCost) > 0) {
      item.unitCost = Number(customUnitCost);
      updateItem(item);
    }
    
    const updatedItem = updateStockQuantity(item.id, newStock);
    if (!updatedItem) {
      return res.status(500).json({ error: 'Falha ao atualizar saldo no banco de dados.' });
    }

    const unitCost = updatedItem.unitCost;
    const totalCost = unitCost * qty;

    const newMovement: StockMovement = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemId: updatedItem.id,
      itemSku: updatedItem.sku,
      itemName: updatedItem.name,
      category: updatedItem.category,
      type,
      quantity: qty,
      unit: updatedItem.unit,
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

    addMovement(newMovement);

    // Real-time broadcast to all clients
    broadcast({
      type: 'MOVEMENT_CREATED',
      payload: {
        movement: newMovement,
        updatedItem
      }
    });

    // Broadcast alerts if needed
    if (updatedItem.status === 'zerado') {
      broadcast({
        type: 'ALERT_BROADCAST',
        payload: {
          title: 'Estoque Zerado!',
          message: `O item "${updatedItem.name}" (${updatedItem.sku}) está totalmente ESGOTADO no almoxarifado!`,
          type: 'error'
        }
      });
    } else if (updatedItem.status === 'critico') {
      broadcast({
        type: 'ALERT_BROADCAST',
        payload: {
          title: 'Alerta Crítico de Estoque',
          message: `Item "${updatedItem.sku}" atingiu estoque crítico: ${updatedItem.currentStock} ${updatedItem.unit} (Mín: ${updatedItem.minStock}).`,
          type: 'warning'
        }
      });
    }

    res.json({ success: true, movement: newMovement, updatedItem });
  } catch (err: any) {
    console.error('Erro ao processar movimentação:', err);
    res.status(500).json({ error: 'Falha interna ao registrar movimentação no banco de dados.' });
  }
});

// POST a new inventory item
app.post('/api/inventory/items', (req, res) => {
  try {
    const { sku, name, category, unit, currentStock, minStock, maxStock, reorderPoint, location, unitCost, barcode, supplier, description } = req.body;

    if (!sku || !name || !category || !unit) {
      return res.status(400).json({ error: 'SKU, Nome, Categoria e Unidade são obrigatórios.' });
    }

    const existing = getItemByBarcodeOrSku(sku);
    if (existing) {
      return res.status(400).json({ error: `Já existe um item cadastrado com o SKU/Código "${sku}".` });
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

    createItem(newItem);

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
      addMovement(initMov);
    }

    broadcast({
      type: 'ITEM_CREATED',
      payload: newItem
    });

    res.status(201).json(newItem);
  } catch (err) {
    console.error('Erro ao cadastrar item:', err);
    res.status(500).json({ error: 'Erro ao cadastrar novo item no banco de dados.' });
  }
});

// PUT update an existing item
app.put('/api/inventory/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    const item = getItemById(id);
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado.' });
    }

    const { name, category, unit, minStock, maxStock, reorderPoint, location, unitCost, supplier, description, barcode } = req.body;

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
    if (barcode) item.barcode = barcode.trim();

    item.status = calculateStatus(item.currentStock, item.minStock);
    item.lastUpdated = new Date().toISOString();

    const saved = updateItem(item);

    broadcast({
      type: 'ITEM_UPDATED',
      payload: saved
    });

    res.json(saved);
  } catch (err) {
    console.error('Erro ao atualizar item:', err);
    res.status(500).json({ error: 'Erro ao atualizar dados do item no banco de dados.' });
  }
});

// POST new requisition
app.post('/api/requisitions', (req, res) => {
  try {
    const { requesterName, department, workOrder, priority, items: reqItems, notes } = req.body;

    if (!requesterName || !department || !Array.isArray(reqItems) || reqItems.length === 0) {
      return res.status(400).json({ error: 'Dados incompletos. Solicitante, setor e itens são obrigatórios.' });
    }

    const allItems = getAllItems();
    const preparedItems = reqItems.map((item: any) => {
      const found = allItems.find(i => i.id === item.itemId || i.sku === item.itemId);
      return {
        itemId: found ? found.id : item.itemId,
        sku: found ? found.sku : item.sku || 'N/A',
        name: found ? found.name : item.name || 'Material',
        quantity: Number(item.quantity) || 1,
        unit: found ? found.unit : (item.unit || 'un'),
        availableStock: found ? found.currentStock : 0
      };
    });

    const existingReqs = getAllRequisitions();
    const newReq: Requisition = {
      id: `req-${Date.now()}`,
      code: `REQ-${new Date().getFullYear()}-${String(existingReqs.length + 85).padStart(3, '0')}`,
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

    addRequisition(newReq);

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
    console.error('Erro ao criar requisição:', err);
    res.status(500).json({ error: 'Erro ao criar requisição no banco de dados.' });
  }
});

// PATCH fulfill requisition (Atender requisição no balcão)
app.patch('/api/requisitions/:id/fulfill', (req, res) => {
  try {
    const { id } = req.params;
    const { operator } = req.body;

    const requisition = getRequisitionById(id);
    if (!requisition) {
      return res.status(404).json({ error: 'Requisição não encontrada.' });
    }

    if (requisition.status === 'ATENDIDA') {
      return res.status(400).json({ error: 'Esta requisição já foi atendida anteriormente.' });
    }

    // Check if all items have enough stock
    for (const reqItem of requisition.items) {
      const inventoryItem = getItemById(reqItem.itemId);
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
      const inventoryItem = getItemById(reqItem.itemId)!;
      const prev = inventoryItem.currentStock;
      const newStock = prev - reqItem.quantity;
      const updatedItem = updateStockQuantity(inventoryItem.id, newStock)!;
      updatedItemsList.push(updatedItem);

      const mov: StockMovement = {
        id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        itemId: updatedItem.id,
        itemSku: updatedItem.sku,
        itemName: updatedItem.name,
        category: updatedItem.category,
        type: 'SAIDA',
        quantity: reqItem.quantity,
        unit: updatedItem.unit,
        previousStock: prev,
        newStock: updatedItem.currentStock,
        reason: `Atendimento ${requisition.code} (${requisition.workOrder || 'Sem OS'})`,
        recipient: `${requisition.requesterName} (${requisition.department})`,
        operator: operator || 'Almoxarife de Plantão',
        timestamp: new Date().toISOString(),
        unitCost: updatedItem.unitCost,
        totalCost: updatedItem.unitCost * reqItem.quantity,
        notes: `Requisição aprovada e entregue no balcão`
      };
      addMovement(mov);
      createdMovements.push(mov);
    }

    requisition.status = 'ATENDIDA';
    requisition.attendedBy = operator || 'Almoxarife';
    requisition.updatedAt = new Date().toISOString();
    updateRequisition(requisition);

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
    res.status(500).json({ error: 'Falha ao processar atendimento da requisição no banco de dados.' });
  }
});

// EMPLOYEES CRUD API
app.post('/api/employees', (req, res) => {
  try {
    const { name, registration, department, role, phone, email, status, notes } = req.body;

    if (!name || !registration || !department || !role) {
      return res.status(400).json({ error: 'Nome, Matrícula, Setor/Departamento e Cargo são obrigatórios.' });
    }

    const all = getAllEmployees();
    const existing = all.find(e => e.registration.trim().toUpperCase() === registration.trim().toUpperCase());
    if (existing) {
      return res.status(400).json({ error: `Já existe um funcionário cadastrado com a matrícula "${registration}".` });
    }

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      name: name.trim(),
      registration: registration.trim().toUpperCase(),
      department: department.trim(),
      role: role.trim(),
      phone: phone?.trim() || undefined,
      email: email?.trim() || undefined,
      status: status || 'ATIVO',
      createdAt: new Date().toISOString(),
      notes: notes?.trim() || undefined
    };

    addEmployee(newEmp);

    broadcast({
      type: 'EMPLOYEE_CREATED',
      payload: newEmp
    });

    res.status(201).json(newEmp);
  } catch (err) {
    console.error('Erro ao cadastrar funcionário:', err);
    res.status(500).json({ error: 'Erro ao registrar funcionário no banco de dados.' });
  }
});

app.put('/api/employees/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = getEmployeeById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Funcionário não encontrado.' });
    }

    const { name, registration, department, role, phone, email, status, notes } = req.body;
    if (name) existing.name = name.trim();
    if (registration) existing.registration = registration.trim().toUpperCase();
    if (department) existing.department = department.trim();
    if (role) existing.role = role.trim();
    if (phone !== undefined) existing.phone = phone?.trim() || undefined;
    if (email !== undefined) existing.email = email?.trim() || undefined;
    if (status) existing.status = status;
    if (notes !== undefined) existing.notes = notes?.trim() || undefined;

    const saved = updateEmployee(existing);

    broadcast({
      type: 'EMPLOYEE_UPDATED',
      payload: saved
    });

    res.json(saved);
  } catch (err) {
    console.error('Erro ao atualizar funcionário:', err);
    res.status(500).json({ error: 'Erro ao atualizar dados do funcionário no banco de dados.' });
  }
});

app.delete('/api/employees/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = getEmployeeById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Funcionário não encontrado.' });
    }

    deleteEmployee(id);

    broadcast({
      type: 'EMPLOYEE_DELETED',
      payload: id
    });

    res.json({ success: true, id });
  } catch (err) {
    console.error('Erro ao excluir funcionário:', err);
    res.status(500).json({ error: 'Erro ao remover funcionário do banco de dados.' });
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
    console.log(`[SQLite] Banco de dados persistente almoxarifado.db carregado com sucesso.`);
  });
}

start();
