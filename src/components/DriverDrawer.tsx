import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMotoristaDetalhe } from "../hooks/useMotoristaDetalhe";
import { useProfile } from "../context/ProfileContext";
import { icons, iconePorTipoVeiculo } from "./icons";
import type { StatusMotorista } from "../types/motorista";
import { RadialGauge } from "./RadialGauge";
import styles from "./DriverDrawer.module.css";

interface DriverDrawerProps {
  motoristaId: number | null;
  onClose: () => void;
  aoAtualizarStatus?: (sucesso: boolean, mensagem: string) => void;
}

const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function calcularUtilizacao(diasOperacao: number, diasDisponiveis: number): number {
  const total = diasOperacao + diasDisponiveis;
  if (total === 0) return 0;
  return Math.round((diasOperacao / total) * 100);
}

export function DriverDrawer({ motoristaId, onClose, aoAtualizarStatus }: DriverDrawerProps) {
  const aberto = motoristaId !== null;
  const { motorista, carregando, erro, atualizandoStatus, atualizarStatus } =
    useMotoristaDetalhe(motoristaId);
  const { podeVerFinanceiro } = useProfile();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (aberto) closeButtonRef.current?.focus();
  }, [aberto]);

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onClose]);

  async function handleAtualizarStatus(status: StatusMotorista) {
    const resultado = await atualizarStatus(status);
    aoAtualizarStatus?.(resultado.sucesso, resultado.mensagem);
  }

  return (
    <>
      <div
        className={`${styles.scrim} ${aberto ? styles.scrimShow : ""}`}
        onClick={onClose}
        aria-hidden={!aberto}
      />
      <aside className={`${styles.drawer} ${aberto ? styles.open : ""}`} aria-hidden={!aberto}>
        {aberto && (
          <div className={styles.inner}>
            <button
              ref={closeButtonRef}
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Fechar detalhes"
            >
              <FontAwesomeIcon icon={icons.close} />
            </button>

            {carregando && (
              <p className={styles.info}>
                <FontAwesomeIcon icon={icons.spinner} spin /> Carregando…
              </p>
            )}
            {erro && (
              <p className={styles.error}>
                <FontAwesomeIcon icon={icons.error} /> {erro}
              </p>
            )}

            {motorista && (
              <>
                <div className={styles.head}>
                  <div className={styles.avatar}>
                    <FontAwesomeIcon icon={iconePorTipoVeiculo(motorista.tipoVeiculo)} />
                  </div>
                  <div>
                    <div className={styles.name}>
                      {motorista.nome}
                      {!motorista.cadastroValidado && (
                        <span className={styles.badgeNew}>
                          <FontAwesomeIcon icon={icons.userPlus} /> Novo
                        </span>
                      )}
                    </div>
                    <div className={styles.subtitle}>
                      {motorista.tipoVeiculo ?? "Veículo"} · placa {motorista.placaVeiculo}
                      {motorista.marcaVeiculo ? ` · ${motorista.marcaVeiculo}` : ""}
                    </div>
                  </div>
                </div>

                <section className={styles.section}>
                  <span
                    className={`${styles.statusTagLg} ${
                      motorista.status === "DISPONIVEL" ? styles.disp : styles.ocup
                    }`}
                  >
                    <FontAwesomeIcon icon={icons.dot} className={styles.statusDot} />
                    {motorista.status === "DISPONIVEL"
                      ? "Disponível para nova operação"
                      : "Em operação"}
                  </span>

                  {!motorista.cadastroValidado && (
                    <p className={styles.note}>
                      <FontAwesomeIcon icon={icons.warning} />
                      Este motorista foi incluído automaticamente a partir do último manifesto
                      importado — ainda não passou por validação manual.
                    </p>
                  )}

                  <div className={styles.statusUpdate}>
                    <span className={styles.statusUpdateLabel}>Atualizar status</span>
                    <div className={styles.statusBtns}>
                      <button
                        type="button"
                        disabled={atualizandoStatus}
                        className={`${styles.statusBtn} ${
                          motorista.status === "DISPONIVEL" ? styles.activeDisp : ""
                        }`}
                        onClick={() => handleAtualizarStatus("DISPONIVEL")}
                      >
                        {atualizandoStatus ? (
                          <FontAwesomeIcon icon={icons.spinner} spin />
                        ) : (
                          <FontAwesomeIcon icon={icons.success} />
                        )}
                        Disponível
                      </button>
                      <button
                        type="button"
                        disabled={atualizandoStatus}
                        className={`${styles.statusBtn} ${
                          motorista.status === "EM_OPERACAO" ? styles.activeOcup : ""
                        }`}
                        onClick={() => handleAtualizarStatus("EM_OPERACAO")}
                      >
                        {atualizandoStatus ? (
                          <FontAwesomeIcon icon={icons.spinner} spin />
                        ) : (
                          <FontAwesomeIcon icon={icons.truckFast} />
                        )}
                        Em operação
                      </button>
                    </div>
                    <span className={styles.statusHint}>
                      <FontAwesomeIcon icon={icons.userGear} /> Ação disponível para Operador e
                      Gestor.
                    </span>
                  </div>
                </section>

                <section className={styles.section}>
                  <div className={styles.sectionLabel}>
                    <FontAwesomeIcon icon={icons.gauge} /> Utilização no período
                  </div>
                  <div className={styles.gaugeRow}>
                    <RadialGauge
                      percentual={calcularUtilizacao(
                        motorista.diasOperacao,
                        motorista.diasDisponiveis
                      )}
                      tamanho={64}
                    />
                    <div>
                      <div className={styles.gaugeTitle}>
                        {motorista.diasOperacao} dias em operação
                      </div>
                      <div className={styles.gaugeSub}>
                        {motorista.diasDisponiveis} dias disponíveis de{" "}
                        {motorista.diasOperacao + motorista.diasDisponiveis} no total.
                      </div>
                    </div>
                  </div>
                </section>

                <section className={styles.section}>
                  <div className={styles.sectionLabel}>
                    <FontAwesomeIcon icon={icons.idCard} /> Dados cadastrais
                  </div>
                  <div className={styles.metricsGrid}>
                    <div className={styles.metric}>
                      <div className={styles.metricLabel}>
                        <FontAwesomeIcon icon={icons.idCard} /> CPF/CNPJ
                      </div>
                      <div className={styles.metricValue}>{motorista.cpfCnpj ?? "—"}</div>
                    </div>
                    <div className={styles.metric}>
                      <div className={styles.metricLabel}>
                        <FontAwesomeIcon icon={icons.phone} /> Telefone
                      </div>
                      <div className={styles.metricValue}>{motorista.telefone ?? "—"}</div>
                    </div>
                  </div>
                </section>

                {podeVerFinanceiro && (
                  <section className={styles.section}>
                    <div className={styles.sectionLabel}>
                      <FontAwesomeIcon icon={icons.money} /> Resultado financeiro
                    </div>
                    <div className={styles.metricsGrid}>
                      <div className={styles.metric}>
                        <div className={styles.metricLabel}>Valor do frete</div>
                        <div className={styles.metricValue}>
                          {formatadorMoeda.format(motorista.valorFreteTotal)}
                        </div>
                      </div>
                      <div className={styles.metric}>
                        <div className={styles.metricLabel}>Pedágio (custo confirmado)</div>
                        <div className={`${styles.metricValue} ${styles.negative}`}>
                          {formatadorMoeda.format(motorista.valorPedagioTotal)}
                        </div>
                      </div>
                      <div className={`${styles.metric} ${styles.metricWide}`}>
                        <div className={styles.metricLabel}>
                          <FontAwesomeIcon icon={icons.coins} /> Rentabilidade (frete − pedágio)
                        </div>
                        <div
                          className={`${styles.metricValue} ${styles.metricValueLg} ${
                            motorista.rentabilidadeTotal >= 0 ? styles.positive : styles.negative
                          }`}
                        >
                          {formatadorMoeda.format(motorista.rentabilidadeTotal)}
                        </div>
                      </div>
                    </div>
                    <p className={styles.note}>
                      <FontAwesomeIcon icon={icons.gauge} className={styles.infoIcon} />O
                      manifesto atual só confirma o pedágio como custo. Combustível, manutenção e
                      comissão ainda não são registrados por motorista — a rentabilidade acima
                      está parcial e tende a ser menor na prática.
                    </p>
                  </section>
                )}

                <section className={styles.section}>
                  <div className={styles.sectionLabel}>
                    <FontAwesomeIcon icon={icons.route} /> Viagens no período (
                    {motorista.viagens.length})
                  </div>
                  <div className={styles.tripList}>
                    {motorista.viagens.slice(0, 8).map((viagem, i) => (
                      <div key={i} className={styles.tripRow}>
                        <span className={styles.tripDest}>
                          {viagem.destino}
                          {viagem.destino === "São Paulo" && (
                            <FontAwesomeIcon icon={icons.star} className={styles.starIcon} />
                          )}
                        </span>
                        <span className={styles.tripValue}>
                          {formatadorMoeda.format(viagem.valorFrete)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
