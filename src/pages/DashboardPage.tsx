import { useEffect, useState } from "react";
import {
  buscarDashboard,
  type DashboardResponse,
} from "../api/dashboard";
import { useImportManifesto } from "../context/ImportManifestoContext";
import styles from "./DashboardPage.module.css";

const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function DashboardPage() {
  const [periodo, setPeriodo] = useState(() => {
    const hoje = new Date();

    return {
      ano: hoje.getFullYear(),
      mes: hoje.getMonth() + 1,
    };
  });

  const [dados, setDados] = useState<DashboardResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizacao, setAtualizacao] = useState(0);

  const { versaoImportacao } = useImportManifesto();

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      setCarregando(true);
      setErro(null);

      try {
        const resposta = await buscarDashboard(periodo.ano, periodo.mes);

        if (!cancelado) {
          setDados(resposta);
        }
      } catch (error) {
        if (!cancelado) {
          setDados(null);
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os indicadores."
          );
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    void carregar();

    return () => {
      cancelado = true;
    };
  }, [periodo.ano, periodo.mes, atualizacao, versaoImportacao]);

  const valorPeriodo =
    `${String(periodo.ano).padStart(4, "0")}-` +
    String(periodo.mes).padStart(2, "0");

  const dataPeriodo = new Date(0);
  dataPeriodo.setFullYear(periodo.ano, periodo.mes - 1, 1);

  const nomePeriodo = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(dataPeriodo);

  function alterarPeriodo(valor: string) {
    if (!/^\d{4}-\d{2}$/.test(valor)) {
      return;
    }

    const [ano, mes] = valor.split("-").map(Number);

    if (ano < 1 || ano > 9999 || mes < 1 || mes > 12) {
      return;
    }

    if (ano === periodo.ano && mes === periodo.mes) {
      return;
    }

    setCarregando(true);
    setErro(null);
    setDados(null);
    setPeriodo({ ano, mes });
  }

  return (
    <section
      className={styles.page}
      aria-labelledby="dashboard-titulo"
      aria-busy={carregando}
    >
      <header className={styles.header}>
        <div>
          <h1 id="dashboard-titulo" className={styles.title}>
            Visão geral
          </h1>

          <p className={styles.subtitle}>
            Indicadores financeiros de {nomePeriodo}.
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.periodField}>
            <label htmlFor="dashboard-periodo">Mês e ano</label>

            <input
              id="dashboard-periodo"
              className={styles.periodInput}
              type="month"
              min="0001-01"
              max="9999-12"
              value={valorPeriodo}
              onChange={(event) => alterarPeriodo(event.target.value)}
              required
            />
          </div>

          <button
            type="button"
            className={styles.button}
            onClick={() => setAtualizacao((valor) => valor + 1)}
            disabled={carregando}
          >
            {carregando ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </header>

      {carregando && (
        <p className={styles.message} role="status">
          Carregando indicadores...
        </p>
      )}

      {!carregando && erro && (
        <div className={styles.error} role="alert">
          <p>{erro}</p>

          <button
            type="button"
            className={styles.button}
            onClick={() => setAtualizacao((valor) => valor + 1)}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!carregando && !erro && dados && (
        <>
          <div className={styles.grid}>
            <article className={styles.card}>
              <h2 className={styles.label}>Fretes totais</h2>

              <p className={styles.value}>
                {formatadorMoeda.format(dados.freteTotal)}
              </p>

              <p className={styles.description}>
                Soma dos fretes do período.
              </p>
            </article>

            <article className={styles.card}>
              <h2 className={styles.label}>Custos totais</h2>

              <p className={styles.value}>
                {formatadorMoeda.format(dados.custoTotal)}
              </p>

              <p className={styles.description}>
                Pedágios registrados no período.
              </p>
            </article>

            <article className={styles.card}>
              <h2 className={styles.label}>Rentabilidade total</h2>

              <p
                className={`${styles.value} ${
                  dados.rentabilidadeTotal < 0
                    ? styles.negative
                    : dados.rentabilidadeTotal > 0
                      ? styles.positive
                      : ""
                }`}
              >
                {formatadorMoeda.format(dados.rentabilidadeTotal)}
              </p>

              <p className={styles.description}>
                {dados.rentabilidadeTotal < 0
                  ? "Resultado negativo no período."
                  : "Fretes menos custos do período."}
              </p>
            </article>
          </div>

          <p className={styles.note}>
            Custos = pedágios.
          </p>
        </>
      )}
    </section>
  );
}