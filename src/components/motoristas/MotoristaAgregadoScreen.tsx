import { useMemo, useState } from "react";
import type { MotoristaAgregado, MotoristaAgregadoFormData, StatusMotorista } from "./types";
import "./MotoristaAgregadoScreen.css";

// ---------- Dados de exemplo (substituir pela chamada à API) ----------
const MOCK_MOTORISTAS: MotoristaAgregado[] = [
  { id: "1", nomeCompleto: "Abraão Carneiro De Morais", cpfCnpj: "123.456.789-01", telefone: "(12) 98211-4432", veiculo: "3/4 ", placa: "GCR4B72", status: "disponivel" },
  { id: "2", nomeCompleto: "Adalberto Gonçalves", cpfCnpj: "234.567.891-02", telefone: "(12) 99123-5567", veiculo: "Fiorino ", placa: "QUD9B27", status: "disponivel" },
  { id: "3", nomeCompleto: "Adilson Aparecido De Ávila Filho", cpfCnpj: "345.678.912-03", telefone: "(12) 98456-7789", veiculo: "Van ", placa: "ITG0H20", status: "ocupado" },
  { id: "4", nomeCompleto: "Adriano Martins De Moura", cpfCnpj: "456.789.123-04", telefone: "(11) 97654-3321", veiculo: "Fiorino ", placa: "TDE1E48", status: "ocupado" },
  { id: "5", nomeCompleto: "Danilo Costa", cpfCnpj: "567.891.234-05", telefone: "(12) 98877-6655", veiculo: "Truck", placa: "PUX5A10", status: "disponivel" },
  { id: "6", nomeCompleto: "Antônio Molinari", cpfCnpj: "678.912.345-06", telefone: "(19) 99887-1234", veiculo: "Truck ", placa: "CLU3373", status: "ocupado" }
];

const STATUS_LABEL: Record<StatusMotorista, string> = {
  disponivel: "Disponível",
  ocupado: "Ocupado",
};

const EMPTY_FORM: MotoristaAgregadoFormData = {
  nomeCompleto: "",
  cpfCnpj: "",
  telefone: "",
  veiculo: "",
  placa: "",
  status: "disponivel",
};

function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function formatTelefone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, a, b, c) => (c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : `(${a}`));
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, a, b, c) => (c ? `(${a}) ${b}-${c}` : `(${a}) ${b}`));
}

function isValidCpfCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11 || digits.length === 14;
}

function isValidTelefone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11;
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function MotoristaAgregadoScreen() {
  const [motoristas, setMotoristas] = useState<MotoristaAgregado[]>(MOCK_MOTORISTAS);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | StatusMotorista>("todos");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<MotoristaAgregadoFormData>(EMPTY_FORM);
  const [erros, setErros] = useState<Partial<Record<keyof MotoristaAgregadoFormData, string>>>({});

  const motoristasFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return motoristas.filter((m) => {
      const combinaBusca =
        !termo ||
        m.nomeCompleto.toLowerCase().includes(termo) ||
        m.placa.toLowerCase().includes(termo) ||
        m.cpfCnpj.includes(termo);
      const combinaStatus = filtroStatus === "todos" || m.status === filtroStatus;
      return combinaBusca && combinaStatus;
    });
  }, [motoristas, busca, filtroStatus]);

  function abrirEdicao(motorista: MotoristaAgregado) {
    setEditandoId(motorista.id);
    setForm({
      nomeCompleto: motorista.nomeCompleto,
      cpfCnpj: motorista.cpfCnpj,
      telefone: motorista.telefone,
      veiculo: motorista.veiculo,
      placa: motorista.placa,
      status: motorista.status,
    });
    setErros({});
  }

  function abrirCriacao() {
    setEditandoId("novo");
    setForm(EMPTY_FORM);
    setErros({});
  }

  function fecharDrawer() {
    setEditandoId(null);
  }

  function validarFormulario(): boolean {
    const novosErros: typeof erros = {};
    if (!form.nomeCompleto.trim()) novosErros.nomeCompleto = "Informe o nome completo.";
    if (!isValidCpfCnpj(form.cpfCnpj)) novosErros.cpfCnpj = "CPF ou CNPJ inválido.";
    if (!isValidTelefone(form.telefone)) novosErros.telefone = "Telefone inválido.";
    if (!form.veiculo.trim()) novosErros.veiculo = "Informe o veículo.";
    if (!form.placa.trim()) novosErros.placa = "Informe a placa.";
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function salvar() {
    if (!validarFormulario()) return;

    if (editandoId === "novo") {
      const novo: MotoristaAgregado = { id: crypto.randomUUID(), ...form, placa: form.placa.toUpperCase() };
      setMotoristas((prev) => [novo, ...prev]);
    } else {
      setMotoristas((prev) =>
        prev.map((m) => (m.id === editandoId ? { ...m, ...form, placa: form.placa.toUpperCase() } : m))
      );
    }
    fecharDrawer();
  }

  return (
    <div className="ma-screen">
      <div className="ma-header">
        <div className="ma-header-text">
          <h1>Motoristas agregados</h1>
          <p>Consulte e atualize os dados oficiais da frota agregada.</p>
        </div>
        <button className="ma-btn-primary" onClick={abrirCriacao}>
          + Novo motorista
        </button>
      </div>

      <div className="ma-toolbar">
        <div className="ma-search">
          <IconSearch />
          <input
            type="text"
            placeholder="Buscar por nome, placa ou CPF/CNPJ"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <select
          className="ma-filter-select"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as "todos" | StatusMotorista)}
        >
          <option value="todos">Todos os status</option>
          <option value="disponivel">Disponível</option>
          <option value="em_operacao">Em operação</option>
        </select>
      </div>

      <div className="ma-table-wrap">
        <table className="ma-table">
          <thead>
            <tr>
              <th>Nome completo</th>
              <th>CPF/CNPJ</th>
              <th>Telefone</th>
              <th>Veículo</th>
              <th>Placa</th>
              <th>Status</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {motoristasFiltrados.map((m) => (
              <tr key={m.id}>
                <td className="ma-name-cell">{m.nomeCompleto}</td>
                <td>{m.cpfCnpj}</td>
                <td>{m.telefone}</td>
                <td>{m.veiculo}</td>
                <td>
                  <span className="ma-plate">{m.placa}</span>
                </td>
                <td>
                  <span className={`ma-status-pill ${m.status}`}>
                    <span className="ma-status-dot" />
                    {STATUS_LABEL[m.status]}
                  </span>
                </td>
                <td>
                  <button className="ma-icon-btn" aria-label={`Editar ${m.nomeCompleto}`} onClick={() => abrirEdicao(m)}>
                    <IconEdit />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {motoristasFiltrados.length === 0 && (
          <div className="ma-empty">Nenhum motorista corresponde a essa busca ou filtro.</div>
        )}
      </div>

      {editandoId && (
        <>
          <div className="ma-scrim" onClick={fecharDrawer} />
          <aside className="ma-drawer" role="dialog" aria-modal="true" aria-label="Editar motorista agregado">
            <div className="ma-drawer-head">
              <h2>{editandoId === "novo" ? "Novo motorista agregado" : "Editar motorista agregado"}</h2>
              <button className="ma-drawer-close" onClick={fecharDrawer} aria-label="Fechar">
                <IconClose />
              </button>
            </div>

            <div className="ma-drawer-body">
              <div className="ma-field">
                <label htmlFor="nomeCompleto">Nome completo</label>
                <input
                  id="nomeCompleto"
                  type="text"
                  className={erros.nomeCompleto ? "invalid" : ""}
                  value={form.nomeCompleto}
                  onChange={(e) => setForm((f) => ({ ...f, nomeCompleto: e.target.value }))}
                />
                {erros.nomeCompleto && <div className="ma-field-error">{erros.nomeCompleto}</div>}
              </div>

              <div className="ma-field">
                <label htmlFor="cpfCnpj">CPF/CNPJ</label>
                <input
                  id="cpfCnpj"
                  type="text"
                  inputMode="numeric"
                  className={erros.cpfCnpj ? "invalid" : ""}
                  value={form.cpfCnpj}
                  onChange={(e) => setForm((f) => ({ ...f, cpfCnpj: formatCpfCnpj(e.target.value) }))}
                />
                {erros.cpfCnpj && <div className="ma-field-error">{erros.cpfCnpj}</div>}
              </div>

              <div className="ma-field">
                <label htmlFor="telefone">Telefone</label>
                <input
                  id="telefone"
                  type="text"
                  inputMode="numeric"
                  className={erros.telefone ? "invalid" : ""}
                  value={form.telefone}
                  onChange={(e) => setForm((f) => ({ ...f, telefone: formatTelefone(e.target.value) }))}
                />
                {erros.telefone && <div className="ma-field-error">{erros.telefone}</div>}
              </div>

              <div className="ma-field">
                <label htmlFor="veiculo">Veículo</label>
                <input
                  id="veiculo"
                  type="text"
                  placeholder="Ex.: Fiorino (Fiat)"
                  className={erros.veiculo ? "invalid" : ""}
                  value={form.veiculo}
                  onChange={(e) => setForm((f) => ({ ...f, veiculo: e.target.value }))}
                />
                {erros.veiculo && <div className="ma-field-error">{erros.veiculo}</div>}
              </div>

              <div className="ma-field">
                <label htmlFor="placa">Placa</label>
                <input
                  id="placa"
                  type="text"
                  className={erros.placa ? "invalid" : ""}
                  value={form.placa}
                  onChange={(e) => setForm((f) => ({ ...f, placa: e.target.value.toUpperCase() }))}
                />
                {erros.placa && <div className="ma-field-error">{erros.placa}</div>}
              </div>

              <div className="ma-field">
                <label>Status</label>
                <div className="ma-status-toggle">
                  <button
                    type="button"
                    className={form.status === "disponivel" ? "active" : ""}
                    onClick={() => setForm((f) => ({ ...f, status: "disponivel" }))}
                  >
                    Disponível
                  </button>
                  <button
                    type="button"
                    className={form.status === "ocupado" ? "active" : ""}
                    onClick={() => setForm((f) => ({ ...f, status: "ocupado" }))}
                  >
                    Em operação
                  </button>
                </div>
              </div>
            </div>

            <div className="ma-drawer-foot">
              <button className="ma-btn-secondary" onClick={fecharDrawer}>
                Cancelar
              </button>
              <button className="ma-btn-primary" onClick={salvar}>
                Salvar
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

