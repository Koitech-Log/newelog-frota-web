import type { CSSProperties } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { RentabilidadeMediaItem, RentabilidadeMediaResponse } from "../../api/dashboard";
import { decimal1, inteiro, moeda } from "../../utils/formatadores";
import { icons } from "../icons";
import styles from "./Destaques.module.css";

type Tom = "brand" | "green" | "red" | "cyan";

interface Destaque {
  rotulo: string;
  nome: string;
  detalhe: string;
  icone: IconDefinition;
  tom: Tom;
}

/** Itens com cadastro e ao menos uma viagem — "Sem cadastro" não é um destaque. */
function elegiveis(lista: RentabilidadeMediaItem[] | undefined) {
  return (lista ?? []).filter((item) => item.id !== null && item.quantidadeViagens > 0);
}

function melhorPor(
  lista: RentabilidadeMediaItem[],
  valor: (item: RentabilidadeMediaItem) => number,
  sentido: 1 | -1 = 1
) {
  return [...lista].sort(
    (a, b) => (valor(b) - valor(a)) * sentido || a.nome.localeCompare(b.nome, "pt-BR")
  )[0];
}

function montarDestaques(dados: RentabilidadeMediaResponse): Destaque[] {
  const motoristas = elegiveis(dados.porMotorista);
  const veiculos = elegiveis(dados.porVeiculo);
  const totalViagens = dados.geral.quantidadeViagens;
  const lista: Destaque[] = [];

  if (motoristas.length > 0) {
    const melhor = melhorPor(motoristas, (i) => i.rentabilidadeMedia);
    lista.push({
      rotulo: "Motorista destaque",
      nome: melhor.nome,
      detalhe: `${moeda.format(melhor.rentabilidadeMedia)} por viagem · ${inteiro.format(melhor.quantidadeViagens)} ${melhor.quantidadeViagens === 1 ? "viagem" : "viagens"}`,
      icone: icons.userTie,
      tom: "brand",
    });
  }

  if (veiculos.length > 0) {
    const melhor = melhorPor(veiculos, (i) => i.rentabilidadeMedia);
    lista.push({
      rotulo: "Veículo mais rentável",
      nome: melhor.nome,
      detalhe: `${moeda.format(melhor.rentabilidadeMedia)} por viagem · ${inteiro.format(melhor.quantidadeViagens)} ${melhor.quantidadeViagens === 1 ? "viagem" : "viagens"}`,
      icone: icons.truck,
      tom: "cyan",
    });
  }

  if (motoristas.length > 0) {
    const maior = melhorPor(motoristas, (i) => i.quantidadeViagens);
    const parte = totalViagens > 0 ? (maior.quantidadeViagens / totalViagens) * 100 : 0;
    lista.push({
      rotulo: "Maior volume de viagens",
      nome: maior.nome,
      detalhe: `${inteiro.format(maior.quantidadeViagens)} ${maior.quantidadeViagens === 1 ? "viagem" : "viagens"} · ${decimal1.format(parte)}% do total`,
      icone: icons.route,
      tom: "green",
    });
  }

  const noVermelho = motoristas.filter((i) => i.rentabilidadeMedia < 0);
  if (noVermelho.length > 0) {
    const pior = melhorPor(noVermelho, (i) => i.rentabilidadeMedia, -1);
    lista.push({
      rotulo: "Atenção",
      nome: `${inteiro.format(noVermelho.length)} ${noVermelho.length === 1 ? "motorista" : "motoristas"} no vermelho`,
      detalhe: `Pior média: ${pior.nome} (${moeda.format(pior.rentabilidadeMedia)})`,
      icone: icons.warning,
      tom: "red",
    });
  } else if (motoristas.length > 0) {
    lista.push({
      rotulo: "Atenção",
      nome: "Nenhum motorista no vermelho",
      detalhe: "Todos com média por viagem positiva ou zero.",
      icone: icons.success,
      tom: "green",
    });
  }

  return lista;
}

/** Cartões de insight: quem mais rende, quem mais roda e onde há risco. */
export function Destaques({ dados }: { dados: RentabilidadeMediaResponse }) {
  const destaques = montarDestaques(dados);

  if (destaques.length === 0) {
    return <p className={styles.vazio}>Sem motoristas ou veículos cadastrados com viagens no período.</p>;
  }

  return (
    <div className={styles.grid}>
      {destaques.map((destaque, i) => (
        <article
          key={destaque.rotulo}
          className={`${styles.card} ${styles[destaque.tom]}`}
          style={{ "--i": i } as CSSProperties}
        >
          <span className={styles.icone} aria-hidden="true">
            <FontAwesomeIcon icon={destaque.icone} />
          </span>
          <div className={styles.texto}>
            <h3 className={styles.rotulo}>{destaque.rotulo}</h3>
            <p className={styles.nome} title={destaque.nome}>
              {destaque.nome}
            </p>
            <p className={styles.detalhe}>{destaque.detalhe}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
