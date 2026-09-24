import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMotoristas } from "../hooks/useMotoristas";
import { DriverFilters } from "../components/DriverFilters";
import { DriverCard } from "../components/DriverCard";
import { DriverDrawer } from "../components/DriverDrawer";
import { Pagination } from "../components/Pagination";
import { Toast } from "../components/Toast";
import { icons } from "../components/icons";
import type { StatusMotorista } from "../types/motorista";
import styles from "./DriversPage.module.css";

export function DriversPage() {
  const [busca, setBusca] = useState("");
  const [destino, setDestino] = useState("");
  const [statusAtivo, setStatusAtivo] = useState<StatusMotorista | "all">("all");
  const [tipoVeiculoAtivo, setTipoVeiculoAtivo] = useState<string | "all">("all");
  const [pagina, setPagina] = useState(0);
  const [motoristaSelecionado, setMotoristaSelecionado] = useState<number | null>(null);
  const [toast, setToast] = useState<{ mensagem: string; tipo: "success" | "error" } | null>(
    null
  );

  const filtros = useMemo(
    () => ({
      status: statusAtivo === "all" ? undefined : statusAtivo,
      busca: busca || undefined,
      destino: destino || undefined,
      tipoVeiculo: tipoVeiculoAtivo === "all" ? undefined : tipoVeiculoAtivo,
      page: pagina,
    }),
    [statusAtivo, busca, destino, tipoVeiculoAtivo, pagina]
  );

  const {
    motoristas,
    paginaAtual,
    totalPaginas,
    totalElementos,
    carregando,
    erro,
    recarregar,
  } = useMotoristas(filtros);

  function handleFiltroChange(atualizar: () => void) {
    atualizar();
    setPagina(0); // qualquer mudança de filtro volta pra primeira página
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
        Identifique quem está disponível para uma nova operação e filtre por nome, destino ou
        status.
      </p>

      <DriverFilters
        busca={busca}
        onBuscaChange={(v) => handleFiltroChange(() => setBusca(v))}
        destino={destino}
        onDestinoChange={(v) => handleFiltroChange(() => setDestino(v))}
        statusAtivo={statusAtivo}
        onStatusChange={(v) => handleFiltroChange(() => setStatusAtivo(v))}
        tipoVeiculoAtivo={tipoVeiculoAtivo}
        onTipoVeiculoChange={(v) => handleFiltroChange(() => setTipoVeiculoAtivo(v))}
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

      {!erro && !carregando && motoristas.length === 0 && (
        <div className={styles.emptyState}>
          <FontAwesomeIcon icon={icons.inbox} className={styles.emptyIcon} />
          <p>Nenhum motorista corresponde a esses filtros.</p>
        </div>
      )}

      {!erro && !carregando && motoristas.length > 0 && (
        <>
          <p className={styles.resultsMeta}>
            {totalElementos} motorista{totalElementos !== 1 ? "s" : ""} encontrado
            {totalElementos !== 1 ? "s" : ""}
          </p>
          <div className={styles.grid}>
            {motoristas.map((motorista, indice) => (
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
