import { useMemo } from "react";
import type { RankingItem, TipoRanking } from "../../api/ranking";
import { icons } from "../icons";
import { KpiCard } from "../dashboard/KpiCard";
import styles from "./RankingKpis.module.css";

interface RankingKpisProps {
  tipo: TipoRanking;
  /** Ranking completo do mês (sem busca): os indicadores são calculados sobre ele. */
  itens: RankingItem[];
  totalParticipantes?: number;
  mesNome: string;
}

const TEXTOS: Record<TipoRanking, { plural: string }> = {
  motoristas: { plural: "motoristas" },
  veiculos: { plural: "veículos" },
};

/** Indicadores do período, todos calculados a partir dos dados reais devolvidos pela API. */
export function RankingKpis({ tipo, itens, totalParticipantes, mesNome }: RankingKpisProps) {
  const { plural } = TEXTOS[tipo];

  const indicadores = useMemo(() => {
    const pontuacoes = itens.map((item) => item.pontuacao);
    const soma = pontuacoes.reduce((total, valor) => total + valor, 0);
    const lider = itens.find((item) => item.posicao === 1) ?? null;
    return {
      media: pontuacoes.length ? soma / pontuacoes.length : 0,
      maxima: pontuacoes.length ? Math.max(...pontuacoes) : 0,
      viagens: itens.reduce((total, item) => total + item.quantidadeViagens, 0),
      lider: lider ? (lider.motorista ?? lider.veiculo ?? "—") : "—",
    };
  }, [itens]);

  return (
    <div className={styles.grid} role="group" aria-label="Indicadores do ranking">
      <KpiCard
        indice={0}
        titulo="Classificados"
        valor={totalParticipantes ?? itens.length}
        formato="inteiro"
        icone={tipo === "motoristas" ? icons.users : icons.truck}
        cor="brand"
        descricao={`${plural[0].toUpperCase()}${plural.slice(1)} com viagens em ${mesNome}.`}
      />
      <KpiCard
        indice={1}
        titulo="Maior pontuação"
        valor={indicadores.maxima}
        formato="pontos"
        icone={icons.trophy}
        cor="amber"
        descricao={`Líder: ${indicadores.lider}.`}
      />
      <KpiCard
        indice={2}
        titulo="Pontuação média"
        valor={indicadores.media}
        formato="pontos"
        icone={icons.scale}
        cor="green"
        descricao={`Média entre todos os ${plural} do mês.`}
      />
      <KpiCard
        indice={3}
        titulo="Viagens no mês"
        valor={indicadores.viagens}
        formato="inteiro"
        icone={icons.route}
        cor="cyan"
        descricao={`Soma das viagens de todos os ${plural}.`}
      />
    </div>
  );
}
