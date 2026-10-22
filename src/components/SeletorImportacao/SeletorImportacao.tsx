import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "../icons";
import styles from "./SeletorImportacao.module.css";

export type TipoImportacao = "manifesto" | "veiculos";

interface SeletorImportacaoProps {
  /** Tipo de importação do modal que está aberto. */
  ativo: TipoImportacao;
  /** Chamado ao clicar no tipo que NÃO está ativo. */
  onTrocar: (tipo: TipoImportacao) => void;
  /** Bloqueia a troca (ex.: enquanto um arquivo está sendo enviado). */
  desabilitado?: boolean;
}

const OPCOES: { tipo: TipoImportacao; rotulo: string; icone: typeof icons.fileImport }[] = [
  { tipo: "manifesto", rotulo: "Manifesto", icone: icons.fileImport },
  { tipo: "veiculos", rotulo: "Veículos", icone: icons.truck },
];

/** Controle segmentado para alternar entre importar manifesto e veículos. */
export function SeletorImportacao({ ativo, onTrocar, desabilitado = false }: SeletorImportacaoProps) {
  return (
    <div className={styles.seletor} role="group" aria-label="Tipo de importação">
      {OPCOES.map(({ tipo, rotulo, icone }) => {
        const selecionado = tipo === ativo;
        return (
          <button
            key={tipo}
            type="button"
            className={`${styles.opcao} ${selecionado ? styles.ativa : ""}`}
            aria-pressed={selecionado}
            disabled={desabilitado && !selecionado}
            onClick={() => {
              if (!selecionado) onTrocar(tipo);
            }}
          >
            <FontAwesomeIcon icon={icone} />
            <span>{rotulo}</span>
          </button>
        );
      })}
    </div>
  );
}
