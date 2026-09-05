import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  CheckCircle2, 
  Cloud, 
  CloudUpload, 
  RefreshCw, 
  X, 
  Database, 
  BarChart2, 
  Layers, 
  ShieldCheck, 
  ExternalLink,
  Info
} from 'lucide-react';
import { testFirestoreConnection, analytics } from '../services/firebase.ts';
import { syncAllToFirebase } from '../services/firebaseSync.ts';
import { InventoryItem, StockMovement, Requisition, Employee } from '../types.ts';
import firebaseConfig from '../../firebase-applet-config.json';

interface FirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  movements: StockMovement[];
  requisitions: Requisition[];
  employees: Employee[];
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const FirebaseModal: React.FC<FirebaseModalProps> = ({
  isOpen,
  onClose,
  items,
  movements,
  requisitions,
  employees,
  onShowToast,
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      handleTestConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const ok = await testFirestoreConnection();
      setConnectionStatus(ok ? 'connected' : 'error');
    } catch {
      setConnectionStatus('error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const res = await syncAllToFirebase({ items, movements, requisitions, employees });
      setLastSyncResult(`Sincronizados ${res.syncedItems} itens e ${res.syncedMovements} movimentações.`);
      onShowToast(
        'Nuvem Firebase Atualizada',
        `Os dados do almoxarifado foram sincronizados com sucesso no projeto ${firebaseConfig.projectId}.`,
        'success'
      );
    } catch (err: any) {
      onShowToast('Falha na Sincronização', err.message || 'Erro ao comunicar com o Firestore.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/30 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Firebase Cloud & Analytics
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Online
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Integração ativa com o projeto <strong className="text-amber-400">{firebaseConfig.projectId}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          
          {/* Status Banner */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' :
                connectionStatus === 'error' ? 'bg-rose-500' : 'bg-amber-400 animate-ping'
              }`} />
              <div>
                <p className="font-semibold text-white">Status da Conexão Firestore</p>
                <p className="text-xs text-slate-400">
                  {isTesting ? 'Verificando conexão com o Google Cloud...' :
                   connectionStatus === 'connected' ? 'Serviços do Firestore respondendo normalmente.' :
                   'Falha de resposta. Verifique as regras e permissões de rede.'}
                </p>
              </div>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>Testar</span>
            </button>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Database className="w-4 h-4 text-amber-400" />
                <span className="font-medium">Project ID</span>
              </div>
              <p className="font-mono text-xs text-white font-semibold truncate">{firebaseConfig.projectId}</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                <span className="font-medium">Analytics Measurement ID</span>
              </div>
              <p className="font-mono text-xs text-white font-semibold truncate">{firebaseConfig.measurementId || 'G-VKC6X8T5X1'}</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Cloud className="w-4 h-4 text-sky-400" />
                <span className="font-medium">Storage Bucket</span>
              </div>
              <p className="font-mono text-xs text-slate-300 truncate">{firebaseConfig.storageBucket}</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span className="font-medium">Auth Domain</span>
              </div>
              <p className="font-mono text-xs text-slate-300 truncate">{firebaseConfig.authDomain}</p>
            </div>
          </div>

          {/* Sync Action Area */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <CloudUpload className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white text-sm">Sincronização em Nuvem (Cloud Backup)</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Envia o estado atual do catálogo ({items.length} itens), movimentações ({movements.length}), 
                  requisições ({requisitions.length}) e colaboradores ({employees.length}) para as coleções do Firestore no Firebase.
                </p>
              </div>
            </div>

            {lastSyncResult && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{lastSyncResult}</span>
              </div>
            )}

            <button
              id="btn-sync-firebase-now"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando com Firestore...' : 'Sincronizar Todo o Almoxarifado com Firebase'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-slate-500" />
              Regras do Firestore protegidas e implementadas
            </span>
            <a
              href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore`}
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Abrir Firebase Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
