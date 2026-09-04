import React, { useState } from 'react';
import { X, UserCheck, Shield, Users, Sparkles } from 'lucide-react';
import { ConnectedOperator } from '../types.ts';

interface OperatorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: { name: string; role: string; color: string };
  onlineOperators: ConnectedOperator[];
  onSaveProfile: (profile: { name: string; role: string; color: string }) => void;
}

export const OperatorProfileModal: React.FC<OperatorProfileModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onlineOperators,
  onSaveProfile,
}) => {
  const [name, setName] = useState(currentProfile.name);
  const [role, setRole] = useState(currentProfile.role);
  const [color, setColor] = useState(currentProfile.color);

  React.useEffect(() => {
    setName(currentProfile.name);
    setRole(currentProfile.role);
    setColor(currentProfile.color);
  }, [currentProfile, isOpen]);

  if (!isOpen) return null;

  const colorOptions = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
  ];

  const presetProfiles = [
    { name: 'Carlos Eduardo', role: 'Almoxarife Chefe', color: '#3b82f6' },
    { name: 'Fernanda Lima', role: 'Operadora de Almoxarifado', color: '#10b981' },
    { name: 'Roberto Mendes', role: 'Supervisor de Logística', color: '#f59e0b' },
    { name: 'Beatriz Castro', role: 'Técnica de Segurança (SESMT)', color: '#ec4899' },
  ];

  const handleApplyPreset = (preset: typeof presetProfiles[0]) => {
    setName(preset.name);
    setRole(preset.role);
    setColor(preset.color);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSaveProfile({ name: name.trim(), role, color });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Perfil do Operador</h3>
              <p className="text-[11px] text-slate-400">Identificação para auditoria e logs em tempo real</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Quick presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Perfis Rápidos de Simulação
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presetProfiles.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-xs transition-colors flex items-center gap-2"
                >
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: p.color }}>
                    {p.name.charAt(0)}
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-slate-200 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{p.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Seu Nome Completo
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Função / Cargo
            </label>
            <select
              aria-label="Selecionar função ou cargo do operador"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="Almoxarife Chefe">Almoxarife Chefe</option>
              <option value="Operador de Almoxarifado">Operador de Almoxarifado</option>
              <option value="Supervisor de Logística">Supervisor de Logística</option>
              <option value="Técnico de Segurança">Técnico de Segurança</option>
              <option value="Solicitante de Obra">Solicitante de Obra</option>
            </select>
          </div>

          {/* Avatar Color */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Cor de Destaque
            </label>
            <div className="flex items-center gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Online Operators live list */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>Terminais Conectados no Momento ({onlineOperators.length})</span>
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {onlineOperators.map((op) => (
                <div key={op.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/40 last:border-b-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: op.color }} />
                    <span className="font-semibold text-slate-200">{op.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{op.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-save-operator-profile"
              type="submit"
              className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95"
            >
              Salvar Perfil
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
