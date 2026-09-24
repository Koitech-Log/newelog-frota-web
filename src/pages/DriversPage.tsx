import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMotoristas } from "../hooks/useMotoristas";
import { DriverFilters, type OrdemMotoristas } from "../components/DriverFilters";
import { DriverCard } from "../components/DriverCard";
import { DriverDrawer } from "../components/DriverDrawer";
import { Pagination } from "../components/Pagination";
import { Toast } from "../components/Toast";
import { icons } from "../components/icons";
import type { MotoristaResumo, StatusMotorista } from "../types/motorista";
import styles from "./DriversPage.module.css";

const ORDENACAO_PADRAO: OrdemMotoristas = "utilizacao";
const TAMANHO_PAGINA = 12;
// Traz um lote grande do back-end (que já filtra por status/busca/destino)
// para então filtrar por tipo de veículo, ordenar e paginar no cliente.
const TAMANHO_LOTE_SERVIDOR = 500;

function calcularUtilizacao(m: MotoristaResumo): number {
  const total = m.diasOperacao + m.diasDisponiveis;
  return total === 0 ? 0 : Math.round((m.diasOperacao / total) * 100);
}

function ordenarMotoristas(lista: MotoristaResumo[], ordem: OrdemMotoristas) {
  return [...lista].sort((a, b) => {
    if (ordem === "utilizacao") {
      return (
        calcularUtilizacao(b) - calcularUtilizacao(a) ||
        b.totalViagens - a.totalViagens ||
        a.nome.localeCompare(b.nome, "pt-BR")
      );
    }
    if (ordem === "viagens") {
      return b.totalViagens - a.totalViagens || a.nome.localeCompare(b.nome, "pt-BR");
    }
    if (ordem === "valor") {
      return b.totalViagens - a.totalViagens || a.nome.localeCompare(b.nome, "pt-BR");
    }
    return a.nome.localeCompare(b.nome, "pt-BR");
  });
}

export function DriversPage() {
  const [busca, setBusca] = useState("");
  const [destino, setDestino] = useState("");
  const [statusAtivo, setStatusAtivo] = useState<StatusMotorista | "all">("all");
  const [tipoVeiculo, setTipoVeiculo] = useState<string>("all");
  const [ordem, setOrdem] = useState<OrdemMotoristas>(ORDENACAO_PADRAO);
  const [pagina, setPagina] = useState(0);
  const [motoristaSelecionado, setMotoristaSelecionado] = useState<number | null>(null);
  const [toast, setToast] = useState<{ mensagem: string; tipo: "success" | "error" } | null>(
    null
  );

  // Filtros que o back-end suporta nativamente (via query string).
  const filtrosServidor = useMemo(
    () => ({
      status: statusAtivo === "all" ? undefined : statusAtivo,
      busca: busca || undefined,
      destino: destino || undefined,
      page: 0,
      size: TAMANHO_LOTE_SERVIDOR,
    }),
    [statusAtivo, busca, destino]
  );

  const { motoristas, carregando, erro, recarregar } = useMotoristas(filtrosServidor);

  // Tipos de veículo existentes no conjunto atual (respeitando os filtros de
  // servidor já aplicados), para popular o dropdown com opções reais.
  const tiposVeiculoDisponiveis = useMemo(() => {
    const tipos = new Set<string>();
    motoristas.forEach((m) => {
      if (m.tipoVeiculo) tipos.add(m.tipoVeiculo);
    });
    return Array.from(tipos).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [motoristas]);

  // Filtro de tipo de veículo (o back-end não tem esse parâmetro) + ordenação,
  // ambos aplicados no cliente sobre o lote completo já carregado.
  const motoristasFiltrados = useMemo(() => {
    const filtrados =
      tipoVeiculo === "all"
        ? motoristas
        : motoristas.filter((m) => m.tipoVeiculo === tipoVeiculo);
    return ordenarMotoristas(filtrados, ordem);
  }, [motoristas, tipoVeiculo, ordem]);

  // Paginação também no cliente, já que o filtro de veículo pode mudar o total.
  const totalElementos = motoristasFiltrados.length;
  const totalPaginas = Math.max(1, Math.ceil(totalElementos / TAMANHO_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas - 1);
  const motoristasDaPagina = useMemo(() => {
    const inicio = paginaAtual * TAMANHO_PAGINA;
    return motoristasFiltrados.slice(inicio, inicio + TAMANHO_PAGINA);
  }, [motoristasFiltrados, paginaAtual]);

  function handleFiltroChange(atualizar: () => void) {
    atualizar();
    setPagina(0); // qualquer mudança de filtro volta pra primeira página
  }

  function limparFiltros() {
    setBusca("");
    setDestino("");
    setStatusAtivo("all");
    setTipoVeiculo("all");
    setOrdem(ORDENACAO_PADRAO);
    setPagina(0);
  }

  function handleStatusAtualizado(sucesso: boolean, mensagem: string) {
    setToast({ mensagem, tipo: sucesso ? "success" : "error" });
    if (sucesso) recarregar();
  }

  return (
    <div className={styles.page}>
      <span className={styles.eyebrow}>Controle de disponibilidade</span>
      <h1 className={styles.title}>Motoristas agregados</h1>
      <p className={styles.subtitle}>
        Identifique quem está disponível para uma nova operação e filtre por nome, destino,
        status ou tipo de veículo.
      </p>

      <DriverFilters
        busca={busca}
        onBuscaChange={(v) => handleFiltroChange(() => setBusca(v))}
        destino={destino}
        onDestinoChange={(v) => handleFiltroChange(() => setDestino(v))}
        statusAtivo={statusAtivo}
        onStatusChange={(v) => handleFiltroChange(() => setStatusAtivo(v))}
        tipoVeiculo={tipoVeiculo}
        onTipoVeiculoChange={(v) => handleFiltroChange(() => setTipoVeiculo(v))}
        tiposVeiculoDisponiveis={tiposVeiculoDisponiveis}
        ordem={ordem}
        onOrdemChange={(v) => handleFiltroChange(() => setOrdem(v))}
        onLimparFiltros={limparFiltros}
      />

      {erro && (
        <div className={styles.errorBox}>
          <FontAwesomeIcon icon={icons.error} className={styles.errorIcon} />
          <p>{erro}</p>
          <button type="button" onClick={recarregar} className={styles.retryBtn}>
            <FontAwesomeIcon icon={icons.retry} /> Tentar novamente
          </button>
        </div>
      )}

      {!erro && carregando && (
        <p className={styles.loading}>
          <FontAwesomeIcon icon={icons.spinner} spin size="lg" />
          <span>Carregando motoristas…</span>
        </p>
      )}

      {!erro && !carregando && motoristasDaPagina.length === 0 && (
        <div className={styles.emptyState}>
          <FontAwesomeIcon icon={icons.inbox} className={styles.emptyIcon} />
          <p>Nenhum motorista corresponde a esses filtros.</p>
        </div>
      )}

      {!erro && !carregando && motoristasDaPagina.length > 0 && (
        <>
          <p className={styles.resultsMeta}>
            {totalElementos} motorista{totalElementos !== 1 ? "s" : ""} encontrado
            {totalElementos !== 1 ? "s" : ""} — ordenados por{" "}
            {ordem === "utilizacao" ? "utilização" : ordem}
          </p>
          <div className={styles.grid}>
            {motoristasDaPagina.map((motorista, indice) => (
              <DriverCard
                key={motorista.id}
                motorista={motorista}
                onSelecionar={setMotoristaSelecionado}
                indice={indice}
              />
            ))}
          </div>
          <Pagination
            paginaAtual={paginaAtual}
            totalPaginas={totalPaginas}
            onMudarPagina={setPagina}
          />
        </>
      )}

      <DriverDrawer
        motoristaId={motoristaSelecionado}
        onClose={() => setMotoristaSelecionado(null)}
        aoAtualizarStatus={handleStatusAtualizado}
      />

      <Toast
        mensagem={toast?.mensagem ?? null}
        tipo={toast?.tipo}
        onFechar={() => setToast(null)}
      />
    </div>
  );
}
