import { InventoryItem, StockMovement, Requisition, RealtimeServerState } from '../types.ts';

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
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || 'Erro ao atualizar dados do item.');
  }
  return body;
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
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operator }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || 'Erro ao atender requisição.');
  }
  return body;
}
