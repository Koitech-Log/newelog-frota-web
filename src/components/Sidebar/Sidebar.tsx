import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "../icons";
import { useProfile } from "../../context/ProfileContext";
import { useAuth } from "../../context/AuthContext";
import { useImportManifesto } from "../../context/ImportManifestoContext";
import { ThemeToggle } from "../ThemeToggle";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  motoristasCount?: number;
  frotaCount?: number;
  activeTab: "home" | "drivers";
  onNavigate: (pagina: "home" | "drivers") => void;
}

export function Sidebar({
  isOpen,
  onClose,
  motoristasCount = 0,
  frotaCount = 0,
  activeTab,
  onNavigate,
}: SidebarProps) {
  const { perfil, podeVerFinanceiro } = useProfile();
  const { sessao, signOut } = useAuth();
  const { abrirModal } = useImportManifesto();

  const handleNavClick = (tabKey: string) => {
    if (tabKey === "home" || tabKey === "drivers") {
      if (tabKey === "home" && !podeVerFinanceiro) {
        return;
      }

      onNavigate(tabKey);

      if (window.innerWidth <= 900) {
        onClose();
      }

      return;
    }

    if (tabKey === "import") {
      abrirModal();
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

          {podeVerFinanceiro && (
            <button
              className={`${styles.navlink} ${activeTab === "home" ? styles.active : ""}`}
              type="button"
              onClick={() => handleNavClick("home")}
            >
              <FontAwesomeIcon icon={icons.gauge} />
              <span>Visão geral</span>
            </button>
          )}

          <button
            className={styles.navlink}
            type="button"
            onClick={() => handleNavClick("fleet")}
          >
            <FontAwesomeIcon icon={icons.truck} />
            <span>Frota</span>
            <span className={styles.count}>{frotaCount}</span>
          </button>

          {/* Botão ativo da sua página atual */}
          <button
            className={`${styles.navlink} ${activeTab === "drivers" ? styles.active : ""}`}
            type="button"
            onClick={() => handleNavClick("drivers")}
          >
            <FontAwesomeIcon icon={icons.idCard} />
            <span>Motoristas</span>
            <span className={styles.count}>{motoristasCount}</span>
          </button>

          <button
            className={styles.navlink}
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
            <span>Importar CSV</span>
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
          <div className={styles.userBox}>
            <div className={styles.userAvatar} aria-hidden="true">
              <FontAwesomeIcon icon={perfil === "gestor" ? icons.userTie : icons.userGear} />
            </div>

            <div className={styles.userInfo}>
              <span className={styles.userName}>{sessao?.nome}</span>
              <span className={styles.userRole}>{perfil === "gestor" ? "Gestor" : "Operador"}</span>
            </div>

            <button
              type="button"
              className={styles.logoutBtn}
              onClick={signOut}
              aria-label="Sair"
              title="Sair"
            >
              <FontAwesomeIcon icon={icons.signOut} />
            </button>
          </div>

          <ThemeToggle />

          <div className={styles.statusPill}>
            <span className={styles.statusDot}></span>
            <span>Base: manifestos ago/2026</span>
          </div>
        </div>
      </aside>
    </>
  );
}