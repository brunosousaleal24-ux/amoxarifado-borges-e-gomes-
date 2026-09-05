import { 
  InventoryItem, 
  StockMovement, 
  Requisition, 
  RealtimeServerState,
  SystemUser,
  Employee
} from '../types.ts';

const TOKEN_KEY = 'almoxarifado_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// AUTH API
export async function login(username: string, password: string): Promise<{ token: string; user: SystemUser }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || 'Falha ao autenticar.');
  }

  setStoredToken(body.token);
  return body;
}

export async function fetchCurrentUser(): Promise<SystemUser | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/auth/me', {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) {
      removeStoredToken();
      return null;
    }
    const body = await res.json();
    return body.user;
  } catch {
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
  } finally {
    removeStoredToken();
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || 'Erro ao alterar senha.');
  }
  return body;
}

// USERS MANAGEMENT API (Admin Access)
export async function fetchUsers(): Promise<SystemUser[]> {
  const res = await fetch('/api/users', {
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error('Falha ao carregar lista de usuários.');
  return res.json();
}

export async function createSystemUser(data: {
  username: string;
  password: string;
  name: string;
  role: string;
  department?: string;
  email?: string;
}): Promise<SystemUser> {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || 'Erro ao criar usuário.');
  }
  return body;
}

export async function updateSystemUser(id: string, data: any): Promise<SystemUser> {
  const res = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || 'Erro ao atualizar usuário.');
  }
  return body;
}

export async function deleteSystemUser(id: string): Promise<void> {
  const res = await fetch(`/api/users/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() }
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || 'Erro ao excluir usuário.');
  }
}

// INVENTORY & MOVEMENTS API
export async function fetchInventoryState(): Promise<RealtimeServerState> {
  const res = await fetch('/api/inventory');
  if (!res.ok) throw new Error('Falha ao carregar inventário');
  return res.json();
}

export async function submitMovement(data: {
  itemId: string;
  type: 'ENTRADA' | 'SAIDA' | 'DEVOLUCAO' | 'AJUSTE';
  quantity: number;
  reason: string;
  recipient: string;
  operator: string;
  notes?: string;
  customUnitCost?: number;
}): Promise<{ success: boolean; movement: StockMovement; updatedItem: InventoryItem }> {
  const res = await fetch('/api/inventory/movement', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || 'Erro ao registrar movimentação.');
  }
  return body;
}

export async function createItem(data: Partial<InventoryItem>): Promise<InventoryItem> {
  const res = await fetch('/api/inventory/items', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || 'Erro ao cadastrar novo item.');
  }
  return body;
}

export async function updateItem(id: string, data: Partial<InventoryItem>): Promise<InventoryItem> {
  const res = await fetch(`/api/inventory/items/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || 'Erro ao atualizar dados do item.');
  }
  return body;
}

export async function deleteItem(id: string): Promise<void> {
  const res = await fetch(`/api/inventory/items/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() }
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || 'Erro ao excluir item do estoque.');
  }
}

export async function createRequisition(data: {
  requesterName: string;
  department: string;
  workOrder?: string;
  priority: 'BAIXA' | 'NORMAL' | 'URGENTE';
  items: { itemId: string; quantity: number }[];
  notes?: string;
}): Promise<Requisition> {
  const res = await fetch('/api/requisitions', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || 'Erro ao criar requisição.');
  }
  return body;
}

export async function fulfillRequisition(id: string, operator: string): Promise<{ success: boolean; requisition: Requisition; updatedItems: InventoryItem[] }> {
  const res = await fetch(`/api/requisitions/${id}/fulfill`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ operator }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || 'Erro ao atender requisição.');
  }
  return body;
}

export async function fetchEmployees(): Promise<Employee[]> {
  const res = await fetch('/api/employees');
  if (!res.ok) throw new Error('Falha ao carregar funcionários.');
  return res.json();
}

export async function createEmployee(data: any): Promise<Employee> {
  const res = await fetch('/api/employees', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Erro ao cadastrar funcionário.');
  return body;
}

export async function updateEmployee(id: string, data: any): Promise<Employee> {
  const res = await fetch(`/api/employees/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Erro ao atualizar funcionário.');
  return body;
}

export async function deleteEmployee(id: string): Promise<void> {
  const res = await fetch(`/api/employees/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() }
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Erro ao excluir funcionário.');
}

export async function fetchDatabaseInfo() {
  const res = await fetch('/api/database/info');
  if (!res.ok) throw new Error('Falha ao obter status do banco de dados.');
  return res.json();
}

