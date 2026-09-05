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
  Bell,
  FileSpreadsheet,
  Database,
  Crown,
  LogOut,
  KeyRound,
  ShieldCheck,
  Flame,
  Cloud
} from 'lucide-react';
import { ConnectedOperator, SystemUser } from '../types.ts';

interface HeaderProps {
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  latencyMs: number;
  operators: ConnectedOperator[];
  currentProfile: { name: string; role: string; color: string };
  currentUser: SystemUser;
  onLogout: () => void;
  onChangePassword: () => void;
  onOpenMovementModal: () => void;
  onOpenNewItemModal: () => void;
  onOpenRequisitionModal: () => void;
  onOpenScannerModal: () => void;
  onOpenReportsModal: () => void;
  onOpenProfileModal: () => void;
  onOpenFirebaseModal: () => void;
  unreadAlertsCount: number;
  onOpenAlertsTab: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  latencyMs,
  operators,
  currentProfile,
  currentUser,
  onLogout,
  onChangePassword,
  onOpenMovementModal,
  onOpenNewItemModal,
  onOpenRequisitionModal,
  onOpenScannerModal,
  onOpenReportsModal,
  onOpenProfileModal,
  onOpenFirebaseModal,
  unreadAlertsCount,
  onOpenAlertsTab,
}) => {
  const isAdmin = currentUser.role === 'ADMIN';
  const isReadOnly = currentUser.role === 'CONSULTA';

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

              {isAdmin && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Crown className="w-3 h-3 text-amber-400" />
                  Acesso Total
                </span>
              )}
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
                title="Visualizar operadores ativos"
              >
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>
                  <strong className="text-slate-200 font-semibold">{operators.length || 1}</strong> online
                </span>
              </div>

              <span className="text-slate-700">•</span>

              {/* Database persistence badge */}
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-md" title="Banco de dados SQLite WAL ativo e persistente">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>SQLite DB</span>
              </div>

              <span className="text-slate-700">•</span>

              {/* Firebase Cloud badge */}
              <button
                id="badge-firebase-cloud"
                onClick={onOpenFirebaseModal}
                className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-500/30 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                title="Configurações e Sincronização Firebase Firestore (almoxarido-borges-e-gomes)"
              >
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Firebase Cloud</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions & Operator Profile */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Firebase Cloud Sync button */}
          <button
            id="btn-open-firebase"
            onClick={onOpenFirebaseModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Sincronização em Nuvem e Status Firebase"
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Firebase</span>
          </button>

          {/* Reports generator button */}
          <button
            id="btn-open-reports"
            onClick={onOpenReportsModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Gerar Relatórios em PDF e Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Relatórios PDF/Excel</span>
          </button>

          {/* Barcode scanner button */}
          <button
            id="btn-scan-barcode"
            onClick={onOpenScannerModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Abrir Leitor de Código de Barras / QR Code"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>Bipar Código</span>
          </button>

          {/* New Requisition button */}
          {!isReadOnly && (
            <button
              id="btn-new-requisition"
              onClick={onOpenRequisitionModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all shadow-sm active:scale-95"
            >
              <FileText className="w-4 h-4 text-sky-400" />
              <span>+ Requisição</span>
            </button>
          )}

          {/* New Item button (Almoxarife or Admin) */}
          {!isReadOnly && (
            <button
              id="btn-new-item"
              onClick={onOpenNewItemModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Novo Item</span>
            </button>
          )}

          {/* Quick Movement Button (Entrada / Saída) */}
          {!isReadOnly && (
            <button
              id="btn-quick-movement"
              onClick={onOpenMovementModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>Movimentar Estoque</span>
            </button>
          )}

          {/* Stock Alerts button with badge */}
          {unreadAlertsCount > 0 && (
            <button
              id="btn-view-alerts"
              onClick={onOpenAlertsTab}
              className="relative p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all active:scale-95 cursor-pointer"
              title={`${unreadAlertsCount} itens em alerta de estoque`}
            >
              <Bell className="w-4 h-4 animate-bounce" />
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow">
                {unreadAlertsCount}
              </span>
            </button>
          )}

          {/* User Profile Pill & Actions */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 rounded-xl p-1 pl-2">
            <div 
              onClick={onOpenProfileModal}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              title={`Conectado como: ${currentUser.name} (@${currentUser.username})`}
            >
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow"
                style={{ backgroundColor: currentUser.avatarColor || (isAdmin ? '#f59e0b' : '#3b82f6') }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left leading-tight hidden lg:block pr-1">
                <p className="font-bold text-slate-100 text-xs max-w-[120px] truncate">{currentUser.name}</p>
                <p className="text-[10px] text-amber-400 font-semibold truncate flex items-center gap-1">
                  {isAdmin ? '👑 ADMIN TOTAL' : currentUser.role}
                </p>
              </div>
            </div>

            {/* Change Password Button */}
            <button
              id="btn-change-password-header"
              onClick={onChangePassword}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
              title="Alterar Minha Senha"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>

            {/* Logout Button */}
            <button
              id="btn-logout-header"
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
              title="Sair do Sistema (Logout)"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
