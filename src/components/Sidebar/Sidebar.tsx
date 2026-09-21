import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "../icons";
import { useProfile } from "../../context/ProfileContext";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  // Mantém 'drivers' selecionado por defeito
  const [activeTab, setActiveTab] = useState<string>("drivers");
  const { perfil, setPerfil } = useProfile();

  const handleNavClick = (tabKey: string) => {
    // Se clicar em motoristas, apenas fecha o menu no telemóvel
    if (tabKey === "drivers") {
      setActiveTab("drivers");
      if (window.innerWidth <= 900) {
        onClose();
      }
      return;
    }

    // Para as restantes abas ainda não desenvolvidas
    console.info(`A página "${tabKey}" ainda não está implementada.`);
  };

  return (
    <>
      <div
        className={`${styles.sidebarScrim} ${isOpen ? styles.show : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        {/* ==================== MARCA ==================== */}
        <div className={styles.brand}>
          <div className={styles.brandMark}>
            <FontAwesomeIcon icon={icons.truckFast} />
          </div>

          <div className={styles.brandText}>
            <div className={styles.n1}>NEWELOG</div>
            <div className={styles.n2}>Frota &amp; Operação</div>
          </div>
        </div>

        {/* ==================== NAVEGAÇÃO ==================== */}
        <nav aria-label="Navegação principal">
          <div className={styles.navGroupLabel}>Painel</div>

          <button
            className={`${styles.navlink} ${activeTab === "home" ? styles.active : ""}`}
            type="button"
            onClick={() => handleNavClick("home")}
          >
            <FontAwesomeIcon icon={icons.gauge} />
            <span>Visão geral</span>
          </button>

          <button
            className={`${styles.navlink} ${activeTab === "fleet" ? styles.active : ""}`}
            type="button"
            onClick={() => handleNavClick("fleet")}
          >
            <FontAwesomeIcon icon={icons.truck} />
            <span>Frota</span>
            <span className={styles.count}>7</span>
          </button>

          {/* Botão ativo da sua página atual */}
          <button
            className={`${styles.navlink} ${activeTab === "drivers" ? styles.active : ""}`}
            type="button"
            onClick={() => handleNavClick("drivers")}
          >
            <FontAwesomeIcon icon={icons.idCard} />
            <span>Motoristas</span>
            <span className={styles.count}>6</span>
          </button>

          <button
            className={`${styles.navlink} ${activeTab === "rank" ? styles.active : ""}`}
            type="button"
            onClick={() => handleNavClick("rank")}
          >
            <FontAwesomeIcon icon={icons.rankingStar} />
            <span>Ranking</span>
          </button>

          {/* ==================== DADOS ==================== */}
          <div className={styles.navGroupLabel}>Dados</div>

          <button
            className={styles.navlink}
            type="button"
            onClick={() => handleNavClick("import")}
          >
            <FontAwesomeIcon icon={icons.fileImport} />
            <span>Importar XML</span>
          </button>

          <button
            className={styles.navlink}
            type="button"
            onClick={() => handleNavClick("export")}
          >
            <FontAwesomeIcon icon={icons.fileExport} />
            <span>Exportar planilha</span>
          </button>
        </nav>

        {/* ==================== RODAPÉ ==================== */}
        <div className={styles.sidebarFoot}>
          <div className={styles.profileSwitch}>
            <span className={styles.profileSwitchLabel}>Visualizando como</span>

            <div
              className={styles.profileToggle}
              role="radiogroup"
              aria-label="Perfil de visualização"
            >
              <button
                className={`${styles.profileBtn} ${perfil === "gestor" ? styles.profileActive : ""}`}
                type="button"
                role="radio"
                aria-checked={perfil === "gestor"}
                onClick={() => setPerfil("gestor")}
              >
                <FontAwesomeIcon icon={icons.userTie} />
                <span>Gestor</span>
              </button>

              <button
                className={`${styles.profileBtn} ${perfil === "operador" ? styles.profileActive : ""}`}
                type="button"
                role="radio"
                aria-checked={perfil === "operador"}
                onClick={() => setPerfil("operador")}
              >
                <FontAwesomeIcon icon={icons.userGear} />
                <span>Operador</span>
              </button>
            </div>
          </div>

          <div className={styles.statusPill}>
            <span className={styles.statusDot}></span>
            <span>Base: manifestos ago/2026</span>
          </div>
        </div>
      </aside>
    </>
  );
}