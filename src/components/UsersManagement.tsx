import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  User, 
  X,
  Crown,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Calendar,
  Building2,
  Mail
} from 'lucide-react';
import { SystemUser, UserRole } from '../types.ts';
import * as api from '../services/api.ts';

interface UsersManagementProps {
  currentUser: SystemUser;
  onRefreshCurrentUser?: () => void;
}

export const UsersManagement: React.FC<UsersManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal states
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);

  // Form states for New User
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('OPERADOR');
  const [newDepartment, setNewDepartment] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Form states for Edit / Reset Password
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('OPERADOR');
  const [editDepartment, setEditDepartment] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editStatus, setEditStatus] = useState<'ATIVO' | 'BLOQUEADO'>('ATIVO');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.fetchUsers();
      setUsers(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword || !newName.trim()) {
      setErrorMsg('Preencha os campos obrigatórios: Usuário, Senha e Nome Completo.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      await api.createSystemUser({
        username: newUsername.trim().toLowerCase(),
        password: newPassword,
        name: newName.trim(),
        role: newRole,
        department: newDepartment.trim() || undefined,
        email: newEmail.trim() || undefined
      });

      setSuccessMsg(`Usuário "${newName}" cadastrado com sucesso!`);
      setIsNewUserModalOpen(false);
      resetNewForm();
      loadUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cadastrar usuário.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (user: SystemUser) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditDepartment(user.department || '');
    setEditEmail(user.email || '');
    setEditStatus(user.status);
    setEditNewPassword('');
    setIsEditModalOpen(true);
    setErrorMsg(null);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setSubmitting(true);
      setErrorMsg(null);
      await api.updateSystemUser(selectedUser.id, {
        name: editName.trim(),
        role: editRole,
        department: editDepartment.trim() || undefined,
        email: editEmail.trim() || undefined,
        status: editStatus,
        password: editNewPassword.trim() ? editNewPassword.trim() : undefined
      });

      setSuccessMsg(`Cadastro de "${editName}" atualizado com sucesso!`);
      setIsEditModalOpen(false);
      loadUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao atualizar dados do usuário.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: SystemUser) => {
    if (user.id === currentUser.id) {
      alert('Você não pode excluir sua própria conta de administrador enquanto estiver conectado.');
      return;
    }

    const confirm = window.confirm(`Confirma a exclusão definitiva do usuário "${user.name}" (${user.username})? Esta ação não pode ser desfeita.`);
    if (!confirm) return;

    try {
      await api.deleteSystemUser(user.id);
      setSuccessMsg(`Usuário "${user.name}" removido com sucesso.`);
      loadUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao excluir usuário.');
    }
  };

  const resetNewForm = () => {
    setNewUsername('');
    setNewPassword('');
    setNewName('');
    setNewRole('OPERADOR');
    setNewDepartment('');
    setNewEmail('');
    setShowNewPassword(false);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Total Admin Privilege */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-slate-900 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl font-bold shrink-0">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Controle de Usuários e Senhas</h2>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                Acesso Total Administrador
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Como Administrador, você possui permissão total irrestrita para cadastrar novos colaboradores com suas respectivas senhas, redefinir credenciais, bloquear acessos e delegar perfis de segurança.
            </p>
          </div>
        </div>

        <button
          id="btn-add-user"
          onClick={() => {
            resetNewForm();
            setIsNewUserModalOpen(true);
            setErrorMsg(null);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo Usuário</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nome, usuário, setor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700/80 text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="ALL">Todos os Perfis</option>
            <option value="ADMIN">👑 Administrador</option>
            <option value="OPERADOR">👷 Operador</option>
            <option value="ALMOXARIFE">📦 Almoxarife</option>
            <option value="CONSULTA">🔍 Consulta</option>
          </select>

          <button
            onClick={loadUsers}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="Atualizar lista de usuários"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Colaborador / Usuário</th>
                <th className="px-4 py-3.5">Perfil de Acesso</th>
                <th className="px-4 py-3.5">Setor / Departamento</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Último Acesso</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                      <span>Carregando usuários do sistema...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Nenhum usuário encontrado para os filtros informados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-md shrink-0"
                          style={{ backgroundColor: u.avatarColor || '#f59e0b' }}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100 flex items-center gap-1.5">
                            {u.name}
                            {u.id === currentUser.id && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                Você
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                            <User className="w-3 h-3 text-slate-500" />
                            @{u.username}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {u.role === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-[11px]">
                          👑 ADMIN (Acesso Total)
                        </span>
                      ) : u.role === 'OPERADOR' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 font-medium text-[11px]">
                          👷 Operador
                        </span>
                      ) : u.role === 'ALMOXARIFE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 font-medium text-[11px]">
                          📦 Almoxarife
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-700/50 text-slate-300 border border-slate-600/50 font-medium text-[11px]">
                          🔍 Consulta / Auditoria
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{u.department || 'Geral'}</span>
                      </div>
                      {u.email && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span>{u.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {u.status === 'ATIVO' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium text-[10px]">
                          <UserCheck className="w-3 h-3" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30 font-medium text-[10px]">
                          <UserX className="w-3 h-3" />
                          Bloqueado
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-slate-400">
                      {u.lastLogin ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{new Date(u.lastLogin).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">Nunca acessou</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 border border-slate-700 transition-colors cursor-pointer"
                        title="Editar cadastro ou redefinir senha"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      {u.id !== currentUser.id && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-colors cursor-pointer"
                          title="Excluir usuário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Cadastrar Novo Usuário */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setIsNewUserModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Cadastrar Novo Usuário</h3>
                <p className="text-xs text-slate-400">Defina o login, senha inicial e perfil de segurança</p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome de Usuário / Login *
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Ex: joao.silva"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Senha de Acesso *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 3 caracteres"
                      className="w-full px-3 pr-9 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Perfil de Permissão *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="OPERADOR">👷 Operador (Movimentações & Bipagem)</option>
                    <option value="ADMIN">👑 Administrador (Acesso Total)</option>
                    <option value="ALMOXARIFE">📦 Almoxarife (Catálogo & Estoque)</option>
                    <option value="CONSULTA">🔍 Consulta (Apenas Leitura)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Setor / Departamento
                  </label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="Ex: Almoxarifado Central"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  E-mail Corporativo (Opcional)
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="colaborador@empresa.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Salvar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Usuário / Redefinir Senha */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Editar Usuário & Redefinir Senha</h3>
                <p className="text-xs text-slate-400">Usuário: <strong>@{selectedUser.username}</strong></p>
              </div>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Perfil de Permissão
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none cursor-pointer"
                  >
                    <option value="OPERADOR">👷 Operador</option>
                    <option value="ADMIN">👑 Administrador (Acesso Total)</option>
                    <option value="ALMOXARIFE">📦 Almoxarife</option>
                    <option value="CONSULTA">🔍 Consulta / Auditoria</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status da Conta
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ATIVO">🟢 Ativo (Acesso Permitido)</option>
                    <option value="BLOQUEADO">🔴 Bloqueado (Acesso Negado)</option>
                  </select>
                </div>
              </div>

              {/* Redefinição de Senha */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Redefinir Senha do Usuário
                  </label>
                  <span className="text-[10px] text-slate-500">Deixe em branco para manter a atual</span>
                </div>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editNewPassword}
                    onChange={(e) => setEditNewPassword(e.target.value)}
                    placeholder="Digite a nova senha se desejar alterar..."
                    className="w-full px-3 pr-9 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Setor / Departamento
                  </label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
