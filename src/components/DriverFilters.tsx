import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "./icons";
import type { StatusMotorista } from "../types/motorista";
import styles from "./DriverFilters.module.css";

interface DriverFiltersProps {
  busca: string;
  onBuscaChange: (valor: string) => void;
  destino: string;
  onDestinoChange: (valor: string) => void;
  statusAtivo: StatusMotorista | "all";
  onStatusChange: (status: StatusMotorista | "all") => void;
  tipoVeiculoAtivo: string | "all";
  onTipoVeiculoChange: (tipoVeiculo: string | "all") => void;
}

const OPCOES_STATUS: {
  valor: StatusMotorista | "all";
  rotulo: string;
  dotClass?: string;
}[] = [
  { valor: "all", rotulo: "Todos" },
  { valor: "DISPONIVEL", rotulo: "Disponíveis", dotClass: "dotGreen" },
  { valor: "EM_OPERACAO", rotulo: "Em operação", dotClass: "dotRed" },
];

const OPCOES_TIPO_VEIULO: { valor: string | "all"; rotulo: string }[] = [
  { valor: "all", rotulo:"Todos os veículos" },
  {valor: "Fiorino", rotulo: "Fiorino" },
  {valor: "Van", rotulo: "Van" },
  {valor: "VUC", rotulo: "VUC" },
  {valor: "3/4", rotulo: "3/4" },
  {valor: "Toco", rotulo: "Toco" },
  {valor: "Truck", rotulo: "Truck" },
];

export function DriverFilters({
  busca,
  onBuscaChange,
  destino,
  onDestinoChange,
  statusAtivo,
  onStatusChange,
  tipoVeiculoAtivo,
  onTipoVeiculoChange,
}: DriverFiltersProps) {
  return (
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
          {opcao.dotClass && (
            <FontAwesomeIcon
              icon={icons.dot}
              className={`${styles.dot} ${styles[opcao.dotClass]}`}
              aria-hidden
            />
          )}
          {opcao.rotulo}
        </button>
      ))}

      {OPCOES_TIPO_VEIULO.map((opcao) => (
        <button
          key = {opcao.valor}
          type = "button"
                    className={`${styles.chip} ${tipoVeiculoAtivo === opcao.valor ? styles.active : ""}`}
          onClick={() => onTipoVeiculoChange(opcao.valor)}
        >
          {opcao.rotulo}
        </button>
      ))}
    </div>
  );
}
