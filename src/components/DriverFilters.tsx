import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons, iconePorTipoVeiculo } from "./icons";
import { Dropdown, type OpcaoDropdown } from "./Dropdown";
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

const OPCOES_ORDEM: OpcaoDropdown<OrdemMotoristas>[] = [
  { valor: "utilizacao", rotulo: "Utilização", icone: icons.gauge, descricao: "Mais tempo em operação primeiro" },
  { valor: "viagens", rotulo: "Qtd. viagens", icone: icons.route, descricao: "Mais viagens realizadas primeiro" },
  { valor: "valor", rotulo: "Valor agregado", icone: icons.coins, descricao: "Maior valor agregado primeiro" },
  { valor: "nome", rotulo: "Nome (A-Z)", icone: icons.sortAlpha, descricao: "Ordem alfabética" },
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
          <Dropdown
            id="fVeiculo"
            valor={tipoVeiculo}
            icone={icons.truck}
            ativo={tipoVeiculo !== "all"}
            opcoes={[
              { valor: "all", rotulo: "Todos os veículos", icone: icons.truck },
              // mantém o tipo selecionado visível mesmo se ele saiu da lista filtrada
              ...(tipoVeiculo !== "all" && !tiposVeiculoDisponiveis.includes(tipoVeiculo)
                ? [tipoVeiculo]
                : []
              ).concat(tiposVeiculoDisponiveis).map((tipo) => ({
                valor: tipo,
                rotulo: tipo,
                icone: iconePorTipoVeiculo(tipo),
              })),
            ]}
            onChange={onTipoVeiculoChange}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="fSort">Ordenar por</label>
          <Dropdown
            id="fSort"
            valor={ordem}
            icone={icons.sliders}
            ativo={ordem !== "utilizacao"}
            opcoes={OPCOES_ORDEM}
            onChange={onOrdemChange}
          />
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
