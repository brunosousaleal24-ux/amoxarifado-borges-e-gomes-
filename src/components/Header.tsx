import React, { useState } from 'react';
import { 
  Boxes, 
  Wifi, 
  WifiOff, 
  Users, 
  Plus, 
  QrCode, 
  FileText, 
  ArrowDownToLine, 
  UserCheck, 
  Sparkles,
  RefreshCw,
  Bell
} from 'lucide-react';
import { ConnectedOperator } from '../types.ts';

interface HeaderProps {
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  latencyMs: number;
  operators: ConnectedOperator[];
  currentProfile: { name: string; role: string; color: string };
  onOpenMovementModal: () => void;
  onOpenNewItemModal: () => void;
  onOpenRequisitionModal: () => void;
  onOpenScannerModal: () => void;
  onOpenProfileModal: () => void;
  unreadAlertsCount: number;
  onOpenAlertsTab: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  latencyMs,
  operators,
  currentProfile,
  onOpenMovementModal,
  onOpenNewItemModal,
  onOpenRequisitionModal,
  onOpenScannerModal,
  onOpenProfileModal,
  unreadAlertsCount,
  onOpenAlertsTab,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Left: Brand & Realtime status */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-600 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/30 shrink-0">
            <Boxes className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Almoxarifado
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                  Tempo Real
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              {/* WebSocket Indicator */}
              <div className="flex items-center gap-1.5 font-medium">
                {connectionStatus === 'connected' ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-emerald-400 flex items-center gap-1 font-mono">
                      <Wifi className="w-3.5 h-3.5" />
                      Ao Vivo ({latencyMs}ms)
                    </span>
                  </>
                ) : connectionStatus === 'connecting' ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Sincronizando...
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <WifiOff className="w-3.5 h-3.5" />
                    Desconectado (reconectando)
                  </span>
                )}
              </div>

              <span className="text-slate-700">•</span>

              {/* Online Operators Badge */}
              <div 
                onClick={onOpenProfileModal}
                className="cursor-pointer hover:text-slate-200 transition-colors flex items-center gap-1.5 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60"
                title="Clique para gerenciar seu perfil de operador"
              >
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>
                  <strong className="text-slate-200 font-semibold">{operators.length || 1}</strong> online
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions & Operator Profile */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Barcode scanner button */}
          <button
            id="btn-scan-barcode"
            onClick={onOpenScannerModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all shadow-sm active:scale-95"
            title="Abrir Leitor de Código de Barras / QR Code"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>Bipar Código</span>
          </button>

          {/* New Requisition button */}
          <button
            id="btn-new-requisition"
            onClick={onOpenRequisitionModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all shadow-sm active:scale-95"
          >
            <FileText className="w-4 h-4 text-sky-400" />
            <span>+ Requisição</span>
          </button>

          {/* New Item button */}
          <button
            id="btn-new-item"
            onClick={onOpenNewItemModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Novo Item</span>
          </button>

          {/* Quick Movement Button (Entrada / Saída) */}
          <button
            id="btn-quick-movement"
            onClick={onOpenMovementModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Movimentar Estoque</span>
          </button>

          {/* Stock Alerts button with badge */}
          {unreadAlertsCount > 0 && (
            <button
              id="btn-view-alerts"
              onClick={onOpenAlertsTab}
              className="relative p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all active:scale-95"
              title={`${unreadAlertsCount} itens em alerta de estoque`}
            >
              <Bell className="w-4 h-4 animate-bounce" />
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow">
                {unreadAlertsCount}
              </span>
            </button>
          )}

          {/* Operator Profile pill */}
          <div 
            onClick={onOpenProfileModal}
            className="cursor-pointer flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs transition-colors ml-1"
          >
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] text-white shadow"
              style={{ backgroundColor: currentProfile.color }}
            >
              {currentProfile.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <p className="font-semibold text-slate-200 max-w-[110px] truncate">{currentProfile.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentProfile.role}</p>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
