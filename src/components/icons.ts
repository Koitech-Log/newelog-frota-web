import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  // ==================== SIDEBAR / NAVEGAÇÃO ====================
  faBars,
  faGaugeHigh,
  faRoute,
  faCalendarCheck,
  faCalendarDays,
  faInbox,

  // ==================== GESTÃO / USUÁRIOS ====================
  faUserTie,
  faUserGear,
  faUserPlus,
  faIdCard,
  faRankingStar,
  faFileImport,
  faFileExport,

  // ==================== FROTA / VEÍCULOS ====================
  faTruck,
  faTruckFast,
  faTruckPickup,
  faTruckRampBox,
  faTruckArrowRight,
  faVanShuttle,
  faTrailer,
  faCar,
  faMotorcycle,

  // ==================== AÇÕES / CONTROLES ====================
  faMagnifyingGlass,
  faChevronRight,
  faChevronLeft,
  faXmark,
  faArrowRotateRight,
  faSliders,

  // ==================== STATUS / FEEDBACK ====================
  faCircleCheck,
  faCircleExclamation,
  faTriangleExclamation,
  faSpinner,
  faCircle,

  // ==================== FINANCEIRO / DIVERSOS ====================
  faPhone,
  faSackDollar,
  faCoins,
  faStar,
} from "@fortawesome/free-solid-svg-icons";

export const icons = {
  // Navegação / Estrutura
  bars: faBars,
  gauge: faGaugeHigh,
  route: faRoute,
  calendarCheck: faCalendarCheck,
  calendarDays: faCalendarDays,
  inbox: faInbox,

  // Usuários / Perfis / Arquivos
  userTie: faUserTie,
  userGear: faUserGear,
  userPlus: faUserPlus,
  idCard: faIdCard,
  rankingStar: faRankingStar,
  fileImport: faFileImport,
  fileExport: faFileExport,

  // Frota
  truck: faTruck,
  truckFast: faTruckFast,

  // Ações
  search: faMagnifyingGlass,
  chevronRight: faChevronRight,
  chevronLeft: faChevronLeft,
  close: faXmark,
  retry: faArrowRotateRight,
  sliders: faSliders,

  // Status
  success: faCircleCheck,
  error: faCircleExclamation,
  warning: faTriangleExclamation,
  spinner: faSpinner,
  dot: faCircle,

  // Financeiro & Diversos
  phone: faPhone,
  money: faSackDollar,
  coins: faCoins,
  star: faStar,
};

/**
 * Mapeamento de ícones por tipo de veículo (compatível com fleetTypes).
 */
const ICONE_POR_TIPO: Record<string, IconDefinition> = {
  FIORINO: faTruckPickup,
  VAN: faVanShuttle,
  VUC: faTruck,
  "3/4": faTruckRampBox,
  "TOCO OU SEMI-PESADO": faTrailer,
  "TRUCK OU PESADO": faTruckFast,
  "BI-TRUCK OU PESADO": faTruckFast,
  "CAVALO MECÂNICO": faTruckArrowRight,
  "CAVALO MECÂNICO TRUCADO": faTruckArrowRight,
  "SEMI-REBOQUE": faTrailer,
  AUTOMÓVEIS: faCar,
  MOTOCICLETAS: faMotorcycle,
};

export function iconePorTipoVeiculo(tipoVeiculo: string | null): IconDefinition {
  if (!tipoVeiculo) return faTruck;
  const chave = tipoVeiculo.trim().toUpperCase();
  
  // Correspondência exata ou por prefixo (ex.: "Semi-reboque com 2 eixos")
  if (ICONE_POR_TIPO[chave]) return ICONE_POR_TIPO[chave];
  const porPrefixo = Object.keys(ICONE_POR_TIPO).find((k) => chave.startsWith(k));
  return porPrefixo ? ICONE_POR_TIPO[porPrefixo] : faTruck;
}