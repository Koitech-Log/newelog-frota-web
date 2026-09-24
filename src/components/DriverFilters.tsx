import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "./icons";
import type { StatusMotorista } from "../types/motorista";
import styles from "./DriverFilters.module.css";

export type OrdemMotoristas = "utilizacao" | "viagens" | "valor" | "nome";

interface DriverFiltersProps {
  busca: string;
  onBuscaChange: (valor: string) => void;
  destino: string;
  onDestinoChange: (valor: string) => void;
  statusAtivo: StatusMotorista | "all";
  onStatusChange: (status: StatusMotorista | "all") => void;
  tipoVeiculo: string;
  onTipoVeiculoChange: (valor: string) => void;
  tiposVeiculoDisponiveis: string[];
  ordem: OrdemMotoristas;
  onOrdemChange: (valor: OrdemMotoristas) => void;
  onLimparFiltros: () => void;
}

const OPCOES_STATUS: {
  valor: StatusMotorista | "all";
  rotulo: string;
  icone: typeof icons.dot;
  dotClass?: string;
}[] = [
  { valor: "all", rotulo: "Todos", icone: icons.gauge },
  { valor: "DISPONIVEL", rotulo: "Disponíveis", icone: icons.success, dotClass: "dotGreen" },
  { valor: "EM_OPERACAO", rotulo: "Em operação", icone: icons.truckFast, dotClass: "dotRed" },
];

export function DriverFilters({
  busca,
  onBuscaChange,
  destino,
  onDestinoChange,
  statusAtivo,
  onStatusChange,
  tipoVeiculo,
  onTipoVeiculoChange,
  tiposVeiculoDisponiveis,
  ordem,
  onOrdemChange,
  onLimparFiltros,
}: DriverFiltersProps) {
  const temFiltrosAtivos = Boolean(
    busca.trim() ||
      destino.trim() ||
      statusAtivo !== "all" ||
      tipoVeiculo !== "all" ||
      ordem !== "utilizacao"
  );

  return (
    <div className={styles.panel}>
      <div className={styles.bar}>
        <div className={styles.searchField}>
          <FontAwesomeIcon icon={icons.search} aria-hidden />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF…"
            value={busca}
            onChange={(e) => onBuscaChange(e.target.value)}
          />
        </div>

        <div className={styles.searchField}>
          <FontAwesomeIcon icon={icons.route} aria-hidden />
          <input
            type="text"
            placeholder="Filtrar por destino…"
            value={destino}
            onChange={(e) => onDestinoChange(e.target.value)}
          />
        </div>

        {OPCOES_STATUS.map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            className={`${styles.chip} ${statusAtivo === opcao.valor ? styles.active : ""}`}
            onClick={() => onStatusChange(opcao.valor)}
          >
            <FontAwesomeIcon
              icon={opcao.icone}
              className={opcao.dotClass ? styles[opcao.dotClass] : undefined}
              aria-hidden
            />
            {opcao.rotulo}
          </button>
        ))}
      </div>

      <div className={styles.advanced}>
        <div className={styles.field}>
          <label htmlFor="fVeiculo">Tipo de veículo</label>
          <div className={styles.selectWrap}>
            <FontAwesomeIcon icon={icons.truck} aria-hidden />
            <select
              id="fVeiculo"
              value={tipoVeiculo}
              onChange={(e) => onTipoVeiculoChange(e.target.value)}
            >
              <option value="all">Todos os veículos</option>
              {tiposVeiculoDisponiveis.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="fSort">Ordenar por</label>
          <div className={styles.selectWrap}>
            <FontAwesomeIcon icon={icons.sliders} aria-hidden />
            <select
              id="fSort"
              value={ordem}
              onChange={(e) => onOrdemChange(e.target.value as OrdemMotoristas)}
            >
              <option value="utilizacao">Utilização</option>
              <option value="viagens">Qtd. viagens</option>
              <option value="valor">Valor agregado</option>
              <option value="nome">Nome (A-Z)</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          className={styles.clear}
          onClick={onLimparFiltros}
          disabled={!temFiltrosAtivos}
          title="Limpar filtros"
        >
          <FontAwesomeIcon icon={icons.close} aria-hidden />
          Limpar filtros
        </button>
      </div>
    </div>
  );
}
