import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Building2, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  X, 
  BadgeCheck, 
  ArrowUpRight,
  UserCheck,
  Package,
  AlertCircle
} from 'lucide-react';
import { Employee, StockMovement } from '../types.ts';

interface EmployeesManagementProps {
  employees: Employee[];
  movements: StockMovement[];
  onAddEmployee: (emp: Omit<Employee, 'id' | 'createdAt'>) => Promise<boolean>;
  onUpdateEmployee: (emp: Employee) => Promise<boolean>;
  onDeleteEmployee: (id: string) => Promise<boolean>;
  onOpenMovementForEmployee?: (employeeName: string) => void;
}

const DEPARTMENTS = [
  'Almoxarifado Central',
  'Manutenção Elétrica',
  'Mecânica Industrial',
  'SESMT & Segurança',
  'Obras & Engenharia Civil',
  'Produção / Usinagem',
  'Logística & Frotas',
  'Administrativo / Obras'
];

export const EmployeesManagement: React.FC<EmployeesManagementProps> = ({
  employees,
  movements,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onOpenMovementForEmployee
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('TODOS');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formRegistration, setFormRegistration] = useState('');
  const [formDepartment, setFormDepartment] = useState(DEPARTMENTS[0]);
  const [formCustomDepartment, setFormCustomDepartment] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formStatus, setFormStatus] = useState<'ATIVO' | 'INATIVO'>('ATIVO');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate movements per employee
  const movementsPerEmployee = useMemo(() => {
    const map = new Map<string, number>();
    for (const mov of movements) {
      if (mov.recipient) {
        const key = mov.recipient.toLowerCase();
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
    return map;
  }, [movements]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDept = departmentFilter === 'TODOS' || emp.department === departmentFilter;
      const matchesStatus = statusFilter === 'TODOS' || emp.status === statusFilter;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, searchTerm, departmentFilter, statusFilter]);

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormName('');
    setFormRegistration(`MAT-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormDepartment(DEPARTMENTS[0]);
    setFormCustomDepartment('');
    setFormRole('');
    setFormPhone('');
    setFormEmail('');
    setFormStatus('ATIVO');
    setFormNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormName(emp.name);
    setFormRegistration(emp.registration);
    if (DEPARTMENTS.includes(emp.department)) {
      setFormDepartment(emp.department);
      setFormCustomDepartment('');
    } else {
      setFormDepartment('OUTRO');
      setFormCustomDepartment(emp.department);
    }
    setFormRole(emp.role);
    setFormPhone(emp.phone || '');
    setFormEmail(emp.email || '');
    setFormStatus(emp.status);
    setFormNotes(emp.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Informe o nome completo do funcionário.');
      return;
    }
    if (!formRegistration.trim()) {
      setFormError('Informe o número de matrícula/registro.');
      return;
    }
    if (!formRole.trim()) {
      setFormError('Informe o cargo ou função do funcionário.');
      return;
    }

    const finalDepartment = formDepartment === 'OUTRO' 
      ? (formCustomDepartment.trim() || 'Geral')
      : formDepartment;

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingEmployee) {
        const success = await onUpdateEmployee({
          ...editingEmployee,
          name: formName.trim(),
          registration: formRegistration.trim().toUpperCase(),
          department: finalDepartment,
          role: formRole.trim(),
          phone: formPhone.trim() || undefined,
          email: formEmail.trim() || undefined,
          status: formStatus,
          notes: formNotes.trim() || undefined
        });
        if (success) setIsModalOpen(false);
      } else {
        const success = await onAddEmployee({
          name: formName.trim(),
          registration: formRegistration.trim().toUpperCase(),
          department: finalDepartment,
          role: formRole.trim(),
          phone: formPhone.trim() || undefined,
          email: formEmail.trim() || undefined,
          status: formStatus,
          notes: formNotes.trim() || undefined
        });
        if (success) setIsModalOpen(false);
      }
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar funcionário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (emp: Employee) => {
    if (window.confirm(`Tem certeza que deseja remover o funcionário ${emp.name} (${emp.registration}) do cadastro?`)) {
      await onDeleteEmployee(emp.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            Quadro de Pessoal & Solicitantes
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
            Cadastro de Funcionários & Beneficiários
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Gerencie os colaboradores habilitados para retirada de EPIs, ferramentas, peças e emissão de requisições no almoxarifado.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-900/40 shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Funcionário</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Total de Cadastrados</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{employees.length}</div>
          <div className="text-[11px] text-blue-400 mt-0.5">Colaboradores ativos e inativos</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Funcionários Ativos</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {employees.filter(e => e.status === 'ATIVO').length}
          </div>
          <div className="text-[11px] text-emerald-500 mt-0.5">Autorizados para retirada</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Departamentos / Setores</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {new Set(employees.map(e => e.department)).size}
          </div>
          <div className="text-[11px] text-amber-500 mt-0.5">Frentes operacionais</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Cautelas & Entregas</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">
            {movements.filter(m => m.type === 'SAIDA').length}
          </div>
          <div className="text-[11px] text-indigo-400 mt-0.5">Retiradas registradas</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, matrícula, setor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-blue-500"
          >
            <option value="TODOS">Todos os Setores</option>
            {Array.from(new Set(employees.map(e => e.department))).map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-blue-500"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="ATIVO">Apenas Ativos</option>
            <option value="INATIVO">Apenas Inativos</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Colaborador</th>
                <th className="py-3.5 px-4">Departamento / Setor</th>
                <th className="py-3.5 px-4">Cargo / Função</th>
                <th className="py-3.5 px-4">Contatos</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Cautelas / Baixas</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Nenhum colaborador encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const movCount = Array.from(movementsPerEmployee.entries())
                    .filter(([name]) => name.includes(emp.name.toLowerCase()) || name.includes(emp.registration.toLowerCase()))
                    .reduce((acc, [, count]) => acc + count, 0);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/40 transition">
                      {/* Name & Reg */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                            {emp.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100 flex items-center gap-2">
                              {emp.name}
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                                {emp.registration}
                              </span>
                            </div>
                            {emp.notes && (
                              <div className="text-xs text-slate-400 line-clamp-1">{emp.notes}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{emp.department}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-300">
                        {emp.role}
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 text-xs text-slate-400 space-y-0.5">
                        {emp.phone && (
                          <div className="flex items-center gap-1 text-slate-300">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{emp.phone}</span>
                          </div>
                        )}
                        {emp.email && (
                          <div className="flex items-center gap-1 text-slate-400">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span className="truncate max-w-[150px]">{emp.email}</span>
                          </div>
                        )}
                        {!emp.phone && !emp.email && (
                          <span className="text-slate-600">Sem contatos</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {emp.status === 'ATIVO' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/30">
                            <XCircle className="w-3 h-3" />
                            Inativo
                          </span>
                        )}
                      </td>

                      {/* Movements linked */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium">
                          <Package className="w-3 h-3" />
                          {movCount} {movCount === 1 ? 'retirada' : 'retiradas'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onOpenMovementForEmployee && (
                            <button
                              onClick={() => onOpenMovementForEmployee(`${emp.name} (${emp.department})`)}
                              title="Registrar Saída / Cautela para este funcionário"
                              className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white transition"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            title="Editar Dados"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(emp)}
                            title="Excluir Funcionário"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add or Edit Employee */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-100">
                  {editingEmployee ? 'Editar Cadastro de Funcionário' : 'Novo Funcionário / Solicitante'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome Completo do Funcionário *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Andrade Silva"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Registration / Matrícula */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Matrícula / Registro Operacional *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MAT-2044"
                    value={formRegistration}
                    onChange={(e) => setFormRegistration(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm font-mono text-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Cargo / Role */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cargo / Função *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Eletricista de Manutenção"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Department */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Departamento / Setor de Lotação *
                  </label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-hidden focus:border-blue-500"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                    <option value="OUTRO">+ Outro setor personalizado...</option>
                  </select>

                  {formDepartment === 'OUTRO' && (
                    <input
                      type="text"
                      placeholder="Digite o nome do novo setor..."
                      value={formCustomDepartment}
                      onChange={(e) => setFormCustomDepartment(e.target.value)}
                      className="w-full mt-2 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-hidden focus:border-blue-500"
                    />
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Telefone / Ramal
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321 ou Ramal 204"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    E-mail Corporativo
                  </label>
                  <input
                    type="email"
                    placeholder="colaborador@empresa.com.br"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status Cadastral
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="ATIVO">ATIVO (Autorizado para retiradas)</option>
                    <option value="INATIVO">INATIVO (Bloqueado no balcão)</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Observações Adicionais / Restrições de EPI
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Treinamento NR-10 válido até 12/2026. Autorizado para ferramentas elétricas."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-hidden focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-900/40 disabled:opacity-50"
                >
                  {isSubmitting ? 'Gravando...' : editingEmployee ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
