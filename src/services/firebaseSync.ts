import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase.ts';
import { InventoryItem, StockMovement, Requisition, Employee } from '../types.ts';

export async function syncItemToFirebase(item: InventoryItem): Promise<void> {
  const path = `items/${item.id}`;
  try {
    await setDoc(doc(db, 'items', item.id), {
      id: item.id,
      sku: item.sku,
      name: item.name,
      category: item.category,
      unit: item.unit,
      currentStock: Number(item.currentStock),
      minStock: Number(item.minStock),
      maxStock: Number(item.maxStock),
      reorderPoint: Number(item.reorderPoint),
      unitCost: Number(item.unitCost),
      barcode: item.barcode || '',
      status: item.status,
      supplier: item.supplier || '',
      description: item.description || '',
      lastUpdated: item.lastUpdated || new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error(`Erro ao sincronizar item ${item.id} no Firestore:`, err);
    // Don't crash local flow if offline
  }
}

export async function syncMovementToFirebase(mov: StockMovement): Promise<void> {
  const path = `movements/${mov.id}`;
  try {
    await setDoc(doc(db, 'movements', mov.id), {
      id: mov.id,
      itemId: mov.itemId,
      itemSku: mov.itemSku,
      itemName: mov.itemName,
      category: mov.category || 'Geral',
      type: mov.type,
      quantity: Number(mov.quantity),
      unit: mov.unit || 'un',
      previousStock: Number(mov.previousStock),
      newStock: Number(mov.newStock),
      reason: mov.reason,
      recipient: mov.recipient,
      operator: mov.operator,
      operatorRole: mov.operatorRole || 'Operador',
      timestamp: mov.timestamp || new Date().toISOString(),
      unitCost: Number(mov.unitCost || 0),
      totalCost: Number(mov.totalCost || 0),
      notes: mov.notes || ''
    }, { merge: true });
  } catch (err) {
    console.error(`Erro ao sincronizar movimentação ${mov.id} no Firestore:`, err);
  }
}

export async function syncRequisitionToFirebase(req: Requisition): Promise<void> {
  const path = `requisitions/${req.id}`;
  try {
    await setDoc(doc(db, 'requisitions', req.id), {
      id: req.id,
      code: req.code,
      requesterName: req.requesterName,
      department: req.department,
      workOrder: req.workOrder || '',
      priority: req.priority,
      status: req.status,
      createdAt: req.createdAt || new Date().toISOString(),
      updatedAt: req.updatedAt || new Date().toISOString(),
      notes: req.notes || '',
      itemsCount: req.items?.length || 0
    }, { merge: true });
  } catch (err) {
    console.error(`Erro ao sincronizar requisição ${req.id} no Firestore:`, err);
  }
}

export async function syncEmployeeToFirebase(emp: Employee): Promise<void> {
  const path = `employees/${emp.id}`;
  try {
    await setDoc(doc(db, 'employees', emp.id), {
      id: emp.id,
      name: emp.name,
      registration: emp.registration,
      department: emp.department,
      role: emp.role,
      phone: emp.phone || '',
      email: emp.email || '',
      status: emp.status,
      createdAt: emp.createdAt || new Date().toISOString(),
      notes: emp.notes || ''
    }, { merge: true });
  } catch (err) {
    console.error(`Erro ao sincronizar funcionário ${emp.id} no Firestore:`, err);
  }
}

/**
 * Realiza a sincronização completa inicial dos dados do Almoxarifado para a nuvem Firebase
 */
export async function syncAllToFirebase(data: {
  items: InventoryItem[];
  movements: StockMovement[];
  requisitions: Requisition[];
  employees: Employee[];
}): Promise<{ syncedItems: number; syncedMovements: number }> {
  let countItems = 0;
  let countMovs = 0;

  for (const item of data.items) {
    try {
      await syncItemToFirebase(item);
      countItems++;
    } catch (e) {
      console.warn('Erro ao enviar item:', e);
    }
  }

  for (const mov of data.movements) {
    try {
      await syncMovementToFirebase(mov);
      countMovs++;
    } catch (e) {
      console.warn('Erro ao enviar movimentação:', e);
    }
  }

  for (const req of data.requisitions) {
    try {
      await syncRequisitionToFirebase(req);
    } catch (e) {
      console.warn('Erro ao enviar requisição:', e);
    }
  }

  for (const emp of data.employees) {
    try {
      await syncEmployeeToFirebase(emp);
    } catch (e) {
      console.warn('Erro ao enviar colaborador:', e);
    }
  }

  return { syncedItems: countItems, syncedMovements: countMovs };
}
