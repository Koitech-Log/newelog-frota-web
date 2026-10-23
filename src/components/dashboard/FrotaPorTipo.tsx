import { useMemo, useState, type CSSProperties } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { RentabilidadeMediaItem } from "../../api/dashboard";
import { decimal1, inteiro, moeda } from "../../utils/formatadores";
import {
  desempenhoDoTipo,
  desempenhoPorPlaca,
  type ResumoFrota,
  type TipoFrota,
} from "../../utils/frota";
import { icons, iconePorTipoVeiculo } from "../icons";
import styles from "./FrotaPorTipo.module.css";

interface FrotaPorTipoProps {
  frota: ResumoFrota;
  porVeiculo: RentabilidadeMediaItem[];
  nomePeriodo: string;
}

function pct(parte: number, total: number) {
  return total > 0 ? (parte / total) * 100 : 0;
}

function rotuloStatus(status: string) {
  return status === "EM_OPERACAO" ? "Em operação" : "Disponível";
}

/** Um cartão por tipo de veículo: tamanho da frota, ocupação e desempenho no período. */
export function FrotaPorTipo({ frota, porVeiculo, nomePeriodo }: FrotaPorTipoProps) {
  const [aberto, setAberto] = useState<string | null>(null);
  const porPlaca = useMemo(() => desempenhoPorPlaca(porVeiculo), [porVeiculo]);
  const totalVeiculos = frota.veiculos.length;

  if (frota.tipos.length === 0) {
    return <p className={styles.vazio}>Nenhum motorista ou veículo cadastrado ainda.</p>;
  }

  return (
    <>
      <p className={styles.resumo}>
        <span>
          <FontAwesomeIcon icon={icons.truck} aria-hidden="true" />{" "}
          <strong>{inteiro.format(frota.quantidadeTipos)}</strong>{" "}
          {frota.quantidadeTipos === 1 ? "tipo de veículo" : "tipos de veículo"}
        </span>
        <span>
          <FontAwesomeIcon icon={icons.road} aria-hidden="true" />{" "}
          <strong>{inteiro.format(totalVeiculos)}</strong> {totalVeiculos === 1 ? "veículo" : "veículos"}
        </span>
        <span>
          <FontAwesomeIcon icon={icons.idCard} aria-hidden="true" />{" "}
          <strong>{inteiro.format(frota.totalMotoristas)}</strong>{" "}
          {frota.totalMotoristas === 1 ? "motorista" : "motoristas"}
        </span>
      </p>

      <div className={styles.grid}>
        {frota.tipos.map((tipo, i) => (
          <CartaoTipo
            key={tipo.chave}
            tipo={tipo}
            indice={i}
            totalVeiculos={totalVeiculos}
            nomePeriodo={nomePeriodo}
            porPlaca={porPlaca}
            expandido={aberto === tipo.chave}
            onAlternar={() => setAberto((atual) => (atual === tipo.chave ? null : tipo.chave))}
          />
        ))}
      </div>
    </>
  );
}

interface CartaoTipoProps {
  tipo: TipoFrota;
  indice: number;
  totalVeiculos: number;
  nomePeriodo: string;
  porPlaca: Map<string, RentabilidadeMediaItem>;
  expandido: boolean;
  onAlternar: () => void;
}

function CartaoTipo({
  tipo,
  indice,
  totalVeiculos,
  nomePeriodo,
  porPlaca,
  expandido,
  onAlternar,
}: CartaoTipoProps) {
  const desempenho = useMemo(() => desempenhoDoTipo(tipo.veiculos, porPlaca), [tipo, porPlaca]);
  const idLista = `veiculos-${tipo.chave.replace(/[^A-Z0-9]/g, "")}`;
  const parteDaFrota = pct(tipo.veiculos.length, totalVeiculos);
  const operacaoPct = pct(tipo.emOperacao, tipo.motoristas);
  const semDesempenho = desempenho.viagens === 0;

  return (
    <article className={styles.card} style={{ "--i": indice } as CSSProperties}>
      <header className={styles.topo}>
        <span className={styles.icone} aria-hidden="true">
          <FontAwesomeIcon icon={iconePorTipoVeiculo(tipo.nome)} />
        </span>
        <div className={styles.titulos}>
          <h3 className={styles.nome} title={tipo.nome}>
            {tipo.nome}
          </h3>
          <p className={styles.parte}>
            {decimal1.format(parteDaFrota)}% da frota
          </p>
        </div>
      </header>

      <div className={styles.trilhoFrota} aria-hidden="true">
        <span className={styles.barraFrota} style={{ "--w": `${Math.max(parteDaFrota, 3)}%` } as CSSProperties} />
      </div>

      <dl className={styles.numeros}>
        <div>
          <dd>{inteiro.format(tipo.veiculos.length)}</dd>
          <dt>{tipo.veiculos.length === 1 ? "veículo" : "veículos"}</dt>
        </div>
        <div>
          <dd>{inteiro.format(tipo.motoristas)}</dd>
          <dt>{tipo.motoristas === 1 ? "motorista" : "motoristas"}</dt>
        </div>
        <div>
          <dd>
            {inteiro.format(desempenho.veiculosAtivos)}
            <span className={styles.de}>/{inteiro.format(tipo.veiculos.length)}</span>
          </dd>
          <dt>com viagens</dt>
        </div>
      </dl>

      <div
        className={styles.ocupacao}
        role="img"
        aria-label={`${tipo.emOperacao} em operação e ${tipo.disponiveis} disponíveis`}
      >
        <span className={styles.emOperacao} style={{ width: `${operacaoPct}%` }} />
        <span className={styles.disponiveis} style={{ width: `${100 - operacaoPct}%` }} />
      </div>
      <p className={styles.legenda}>
        <span>
          <i className={styles.pontoOperacao} aria-hidden="true" /> {inteiro.format(tipo.emOperacao)} em
          operação
        </span>
        <span>
          <i className={styles.pontoDisponivel} aria-hidden="true" /> {inteiro.format(tipo.disponiveis)}{" "}
          {tipo.disponiveis === 1 ? "disponível" : "disponíveis"}
        </span>
      </p>

      <div className={styles.periodo}>
        {semDesempenho ? (
          <p className={styles.semViagens}>Sem viagens em {nomePeriodo}.</p>
        ) : (
          <>
            <p className={styles.periodoTitulo}>Em {nomePeriodo}</p>
            <ul className={styles.metricas}>
              <li>
                <span>Viagens</span>
                <strong>{inteiro.format(desempenho.viagens)}</strong>
              </li>
              <li>
                <span>Média por viagem</span>
                <strong className={desempenho.media < 0 ? styles.negativo : styles.positivo}>
                  {moeda.format(desempenho.media)}
                </strong>
              </li>
              <li>
                <span>Rentabilidade</span>
                <strong className={desempenho.rentabilidade < 0 ? styles.negativo : styles.positivo}>
                  {moeda.format(desempenho.rentabilidade)}
                </strong>
              </li>
            </ul>
          </>
        )}
      </div>

      {tipo.veiculos.length > 0 && (
        <>
          <button
            type="button"
            className={styles.alternar}
            onClick={onAlternar}
            aria-expanded={expandido}
            aria-controls={idLista}
          >
            <FontAwesomeIcon
              icon={icons.chevronRight}
              className={`${styles.seta} ${expandido ? styles.setaAberta : ""}`}
              aria-hidden="true"
            />
            {expandido ? "Ocultar veículos" : `Ver veículos (${tipo.veiculos.length})`}
          </button>

          {expandido && (
            <div id={idLista} className={styles.lista} role="region" aria-label={`Veículos do tipo ${tipo.nome}`}>
              <table className={styles.tabela}>
                <thead>
                  <tr>
                    <th scope="col">Placa</th>
                    <th scope="col">Motorista</th>
                    <th scope="col">Viagens</th>
                    <th scope="col">Média</th>
                  </tr>
                </thead>
                <tbody>
                  {tipo.veiculos.map((veiculo, i) => {
                    const item = porPlaca.get(veiculo.chave);
                    const viagens = item?.quantidadeViagens ?? 0;
                    const principal = veiculo.motoristas[0];

                    return (
                      <tr key={veiculo.chave} style={{ "--i": i } as CSSProperties}>
                        <th scope="row">{veiculo.placa}</th>
                        <td title={veiculo.motoristas.map((m) => m.nome).join(", ")}>
                          <span className={styles.motorista}>
                            {principal?.nome}
                            {veiculo.motoristas.length > 1 && ` +${veiculo.motoristas.length - 1}`}
                          </span>
                          <span
                            className={`${styles.status} ${
                              principal?.status === "EM_OPERACAO" ? styles.statusOperacao : styles.statusDisponivel
                            }`}
                          >
                            {rotuloStatus(principal?.status ?? "DISPONIVEL")}
                          </span>
                        </td>
                        <td>{inteiro.format(viagens)}</td>
                        <td className={item && item.rentabilidadeMedia < 0 ? styles.negativo : undefined}>
                          {viagens > 0 && item ? moeda.format(item.rentabilidadeMedia) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </article>
  );
}
