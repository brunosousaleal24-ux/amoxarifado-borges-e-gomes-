import React, { useState, useEffect, useCallback } from 'react';
import { 
  Boxes, 
  Activity, 
  Clock, 
  Warehouse, 
  AlertTriangle, 
  Bell, 
  CheckCircle2, 
  X, 
  Layers, 
  Flame,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Package
} from 'lucide-react';
import { 
  InventoryItem, 
  StockMovement, 
  Requisition, 
  ConnectedOperator, 
  RealtimeServerState, 
  MovementType,
  WSServerMessage 
} from './types.ts';
import { socketManager } from './services/socket.ts';
import * as api from './services/api.ts';

// Components
import { Header } from './components/Header.tsx';
import { MetricCards } from './components/MetricCards.tsx';
import { InventoryAnalytics } from './components/InventoryAnalytics.tsx';
import { InventoryTable } from './components/InventoryTable.tsx';
import { MovementsFeed } from './components/MovementsFeed.tsx';
import { RequisitionsQueue } from './components/RequisitionsQueue.tsx';
import { WarehouseMap } from './components/WarehouseMap.tsx';
import { RestockAlerts } from './components/RestockAlerts.tsx';

// Modals
import { MovementModal } from './components/MovementModal.tsx';
import { NewItemModal } from './components/NewItemModal.tsx';
import { NewRequisitionModal } from './components/NewRequisitionModal.tsx';
import { BarcodeScannerModal } from './components/BarcodeScannerModal.tsx';
import { OperatorProfileModal } from './components/OperatorProfileModal.tsx';
import { ReceiptModal } from './components/ReceiptModal.tsx';

interface LiveToast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'ESTOQUE' | 'FEED' | 'REQUISICOES' | 'MAPA' | 'ALERTAS'>('ESTOQUE');

  // Real-time server state
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [operators, setOperators] = useState<ConnectedOperator[]>([]);
  const [stats, setStats] = useState<RealtimeServerState['stats']>({
    totalItems: 0,
    totalStockUnits: 0,
    totalValuation: 0,
    criticalAlertsCount: 0,
    lowStockAlertsCount: 0,
    movementsTodayCount: 0,
    pendingRequisitionsCount: 0,
  });

  // Connection info
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [latencyMs, setLatencyMs] = useState<number>(24);
  const [currentProfile, setCurrentProfile] = useState(socketManager.getProfile());

  // Toast notifications
  const [toasts, setToasts] = useState<LiveToast[]>([]);

  // Modals state
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementModalItem, setMovementModalItem] = useState<InventoryItem | null>(null);
  const [movementDefaultType, setMovementDefaultType] = useState<MovementType>('SAIDA');
  const [movementSuggestedQty, setMovementSuggestedQty] = useState<number | undefined>(undefined);

  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [receiptMovement, setReceiptMovement] = useState<StockMovement | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isFulfillingReqId, setIsFulfillingReqId] = useState<string | null>(null);

  const addToast = useCallback((toast: Omit<LiveToast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // Recalculate stats helper
  const recomputeStats = useCallback((currentItems: InventoryItem[], currentMovs: StockMovement[], currentReqs: Requisition[]) => {
    const totalItems = currentItems.length;
    const totalStockUnits = currentItems.reduce((acc, it) => acc + it.currentStock, 0);
    const totalValuation = currentItems.reduce((acc, it) => acc + (it.currentStock * it.unitCost), 0);
    const criticalAlertsCount = currentItems.filter(it => it.status === 'critico' || it.status === 'zerado').length;
    const lowStockAlertsCount = currentItems.filter(it => it.status === 'baixo').length;
    
    const today = new Date().toISOString().split('T')[0];
    const movementsTodayCount = currentMovs.filter(m => m.timestamp.startsWith(today)).length;
    const pendingRequisitionsCount = currentReqs.filter(r => r.status === 'PENDENTE').length;

    setStats({
      totalItems,
      totalStockUnits,
      totalValuation,
      criticalAlertsCount,
      lowStockAlertsCount,
      movementsTodayCount,
      pendingRequisitionsCount,
    });
  }, []);

  // WebSocket lifecycle
  useEffect(() => {
    socketManager.connect();

    const unsubStatus = socketManager.subscribeStatus((status, latency) => {
      setConnectionStatus(status);
      setLatencyMs(latency);
    });

    const unsubMessages = socketManager.subscribe((msg: WSServerMessage) => {
      switch (msg.type) {
        case 'INIT_STATE': {
          setItems(msg.payload.items);
          setMovements(msg.payload.movements);
          setRequisitions(msg.payload.requisitions);
          setOperators(msg.payload.operators);
          setStats(msg.payload.stats);
          break;
        }

        case 'ITEM_CREATED': {
          setItems((prev) => {
            const exists = prev.some(i => i.id === msg.payload.id);
            if (exists) return prev;
            const updated = [msg.payload, ...prev];
            recomputeStats(updated, movements, requisitions);
            return updated;
          });
          addToast({
            title: 'Novo Item Cadastrado',
            message: `"${msg.payload.name}" (${msg.payload.sku}) adicionado ao almoxarifado.`,
            type: 'info'
          });
          break;
        }

        case 'ITEM_UPDATED': {
          setItems((prev) => {
            const updated = prev.map(i => i.id === msg.payload.id ? msg.payload : i);
            recomputeStats(updated, movements, requisitions);
            return updated;
          });
          break;
        }

        case 'MOVEMENT_CREATED': {
          const { movement, updatedItem } = msg.payload;
          setMovements((prev) => {
            const exists = prev.some(m => m.id === movement.id);
            if (exists) return prev;
            return [movement, ...prev];
          });
          setItems((prev) => {
            const updated = prev.map(i => i.id === updatedItem.id ? updatedItem : i);
            recomputeStats(updated, [movement, ...movements], requisitions);
            return updated;
          });

          addToast({
            title: `${movement.type === 'SAIDA' ? 'Saída de Material' : movement.type === 'ENTRADA' ? 'Entrada de Material' : 'Movimentação'}`,
            message: `${movement.type === 'SAIDA' ? '-' : '+'}${movement.quantity} ${movement.unit} de "${movement.itemSku}" (${movement.recipient})`,
            type: movement.type === 'SAIDA' ? 'warning' : 'success'
          });
          break;
        }

        case 'REQUISITION_CREATED': {
          setRequisitions((prev) => {
            const exists = prev.some(r => r.id === msg.payload.id);
            if (exists) return prev;
            const updated = [msg.payload, ...prev];
            recomputeStats(items, movements, updated);
            return updated;
          });
          addToast({
            title: `Nova Requisição ${msg.payload.code}`,
            message: `${msg.payload.requesterName} solicitou materiais (${msg.payload.department}).`,
            type: msg.payload.priority === 'URGENTE' ? 'error' : 'info'
          });
          break;
        }

        case 'REQUISITION_UPDATED': {
          const { requisition, updatedItems } = msg.payload;
          setRequisitions((prev) => {
            const updated = prev.map(r => r.id === requisition.id ? requisition : r);
            recomputeStats(items, movements, updated);
            return updated;
          });
          if (updatedItems && updatedItems.length > 0) {
            setItems((prev) => {
              const map = new Map(updatedItems.map(i => [i.id, i]));
              return prev.map(i => map.get(i.id) || i);
            });
          }
          addToast({
            title: `Requisição ${requisition.code} Atendida`,
            message: `Materiais entregues e debitados do estoque com sucesso.`,
            type: 'success'
          });
          break;
        }

        case 'OPERATORS_CHANGED': {
          setOperators(msg.payload);
          break;
        }

        case 'ALERT_BROADCAST': {
          addToast({
            title: msg.payload.title,
            message: msg.payload.message,
            type: msg.payload.type
          });
          break;
        }
      }
    });

    // Initial fallback fetch
    api.fetchInventoryState()
      .then((data) => {
        setItems(data.items);
        setMovements(data.movements);
        setRequisitions(data.requisitions);
        setOperators(data.operators);
        setStats(data.stats);
      })
      .catch(() => {});

    return () => {
      unsubStatus();
      unsubMessages();
    };
  }, [recomputeStats, addToast]);

  // Handlers
  const handleOpenQuickMovement = (item: InventoryItem, defaultType: MovementType, suggestedQty?: number) => {
    setMovementModalItem(item);
    setMovementDefaultType(defaultType);
    setMovementSuggestedQty(suggestedQty);
    setIsMovementModalOpen(true);
  };

  const handleOpenBlankMovement = () => {
    setMovementModalItem(items[0] || null);
    setMovementDefaultType('SAIDA');
    setMovementSuggestedQty(undefined);
    setIsMovementModalOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsNewItemModalOpen(true);
  };

  const handleOpenNewItem = () => {
    setEditingItem(null);
    setIsNewItemModalOpen(true);
  };

  const handleViewItemHistory = (item: InventoryItem) => {
    setActiveTab('FEED');
  };

  const handleFulfillRequisition = async (reqId: string) => {
    try {
      setIsFulfillingReqId(reqId);
      await api.fulfillRequisition(reqId, currentProfile.name);
    } catch (err: any) {
      addToast({
        title: 'Erro no Atendimento',
        message: err.message || 'Falha ao atender requisição.',
        type: 'error'
      });
    } finally {
      setIsFulfillingReqId(null);
    }
  };

  const handleSaveProfile = (profile: typeof currentProfile) => {
    socketManager.setProfile(profile);
    setCurrentProfile(profile);
    addToast({
      title: 'Perfil Atualizado',
      message: `Identificado como ${profile.name} (${profile.role}).`,
      type: 'info'
    });
  };

  const handlePrintReceipt = (mov: StockMovement) => {
    setReceiptMovement(mov);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      
      {/* Real-time Header */}
      <Header
        connectionStatus={connectionStatus}
        latencyMs={latencyMs}
        operators={operators}
        currentProfile={currentProfile}
        onOpenMovementModal={handleOpenBlankMovement}
        onOpenNewItemModal={handleOpenNewItem}
        onOpenRequisitionModal={() => setIsRequisitionModalOpen(true)}
        onOpenScannerModal={() => setIsScannerModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        unreadAlertsCount={stats.criticalAlertsCount + stats.lowStockAlertsCount}
        onOpenAlertsTab={() => setActiveTab('ALERTAS')}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        
        {/* Metric Cards Top Section */}
        <MetricCards
          stats={stats}
          onSelectAlerts={() => setActiveTab('ALERTAS')}
          onSelectRequisitions={() => setActiveTab('REQUISICOES')}
          onSelectMovements={() => setActiveTab('FEED')}
        />

        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 mb-6 overflow-x-auto pb-0.5 no-scrollbar">
          <div className="flex items-center gap-1 sm:gap-2">
            
            {/* Tab 1: Estoque & Catálogo */}
            <button
              id="tab-inventory"
              onClick={() => setActiveTab('ESTOQUE')}
              className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                activeTab === 'ESTOQUE'
                  ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Estoque & Catálogo</span>
              <span className="ml-1 text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {items.length}
              </span>
            </button>

            {/* Tab 2: Feed ao Vivo */}
            <button
              id="tab-feed"
              onClick={() => setActiveTab('FEED')}
              className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                activeTab === 'FEED'
                  ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Feed em Tempo Real</span>
              <span className="relative flex h-2 w-2 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </button>

            {/* Tab 3: Balcão de Requisições */}
            <button
              id="tab-requisitions"
              onClick={() => setActiveTab('REQUISICOES')}
              className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                activeTab === 'REQUISICOES'
                  ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Balcão de Requisições</span>
              {stats.pendingRequisitionsCount > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {stats.pendingRequisitionsCount}
                </span>
              )}
            </button>

            {/* Tab 4: Mapa do Galpão */}
            <button
              id="tab-map"
              onClick={() => setActiveTab('MAPA')}
              className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                activeTab === 'MAPA'
                  ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Warehouse className="w-4 h-4" />
              <span>Mapa do Galpão</span>
            </button>

            {/* Tab 5: Alertas & Reposição */}
            <button
              id="tab-alerts"
              onClick={() => setActiveTab('ALERTAS')}
              className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                activeTab === 'ALERTAS'
                  ? 'border-rose-500 text-rose-400 bg-rose-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Reposição & Compras</span>
              {stats.criticalAlertsCount + stats.lowStockAlertsCount > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {stats.criticalAlertsCount + stats.lowStockAlertsCount}
                </span>
              )}
            </button>

          </div>
        </div>

        {/* Tab Views */}
        <div>
          {activeTab === 'ESTOQUE' && (
            <div>
              <InventoryAnalytics items={items} movements={movements} />
              <InventoryTable
                items={items}
                onQuickMovement={handleOpenQuickMovement}
                onEditItem={handleEditItem}
                onViewItemHistory={handleViewItemHistory}
              />
            </div>
          )}

          {activeTab === 'FEED' && (
            <MovementsFeed
              movements={movements}
              onPrintReceipt={handlePrintReceipt}
            />
          )}

          {activeTab === 'REQUISICOES' && (
            <RequisitionsQueue
              requisitions={requisitions}
              inventoryItems={items}
              currentOperator={currentProfile.name}
              onFulfillRequisition={handleFulfillRequisition}
              onOpenNewRequisition={() => setIsRequisitionModalOpen(true)}
              isFulfillingId={isFulfillingReqId}
            />
          )}

          {activeTab === 'MAPA' && (
            <WarehouseMap
              items={items}
              onSelectItem={(item) => handleOpenQuickMovement(item, 'SAIDA')}
              onQuickMovement={handleOpenQuickMovement}
            />
          )}

          {activeTab === 'ALERTAS' && (
            <RestockAlerts
              items={items}
              onRestockItem={(item, suggestedQty) => {
                handleOpenQuickMovement(item, 'ENTRADA', suggestedQty);
              }}
            />
          )}
        </div>

      </main>

      {/* Floating Real-time Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl shadow-2xl border backdrop-blur-md flex items-start gap-3 transition-all transform animate-in slide-in-from-bottom-2 ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-700 text-rose-100'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-700 text-amber-100'
                : toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-700 text-emerald-100'
                : 'bg-slate-900/90 border-slate-700 text-slate-100'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              ) : toast.type === 'warning' ? (
                <ArrowUpRight className="w-4 h-4 text-amber-400" />
              ) : toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Bell className="w-4 h-4 text-sky-400" />
              )}
            </div>
            <div className="flex-1 text-xs">
              <p className="font-bold text-white leading-snug">{toast.title}</p>
              <p className="text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-white shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Modals */}
      <MovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        items={items}
        preSelectedItem={movementModalItem}
        defaultType={movementDefaultType}
        currentOperator={currentProfile.name}
        suggestedQuantity={movementSuggestedQty}
        onSubmit={async (data) => {
          await api.submitMovement(data);
        }}
      />

      <NewItemModal
        isOpen={isNewItemModalOpen}
        onClose={() => {
          setIsNewItemModalOpen(false);
          setEditingItem(null);
        }}
        editItem={editingItem}
        onSubmit={async (data) => {
          if (editingItem) {
            await api.updateItem(editingItem.id, data);
          } else {
            await api.createItem(data);
          }
        }}
      />

      <NewRequisitionModal
        isOpen={isRequisitionModalOpen}
        onClose={() => setIsRequisitionModalOpen(false)}
        items={items}
        onSubmit={async (data) => {
          await api.createRequisition(data);
        }}
      />

      <BarcodeScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        items={items}
        onSelectAction={(item, action) => {
          handleOpenQuickMovement(item, action);
        }}
      />

      <OperatorProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentProfile={currentProfile}
        onlineOperators={operators}
        onSaveProfile={handleSaveProfile}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setReceiptMovement(null);
        }}
        movement={receiptMovement}
      />

    </div>
  );
}
