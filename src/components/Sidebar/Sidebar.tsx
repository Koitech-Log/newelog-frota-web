import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "../icons";
import { useProfile } from "../../context/ProfileContext";
import { useAuth } from "../../context/AuthContext";
import { useImportCsv } from "../../context/ImportCsvContext";
import { ThemeToggle } from "../ThemeToggle";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  motoristasCount?: number;
  activeTab: "home" | "drivers" | "usuarios";
  onNavigate: (pagina: "home" | "drivers" | "usuarios") => void;
}

export function Sidebar({
  isOpen,
  onClose,
  motoristasCount = 0,
  activeTab,
  onNavigate,
}: SidebarProps) {
  const { perfil, podeVerFinanceiro } = useProfile();
  const { sessao, signOut } = useAuth();
  const { abrirImportacao } = useImportCsv();

  // Esc fecha o menu lateral aberto no mobile
  useEffect(() => {
    if (!isOpen) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [isOpen, onClose]);

  const handleNavClick = (tabKey: string) => {
    if (tabKey === "home" || tabKey === "drivers" || tabKey === "usuarios") {
      if (tabKey === "home" && !podeVerFinanceiro) {
        return;
      }

      if (tabKey === "usuarios" && perfil !== "gestor") {
        return;
      }


      onNavigate(tabKey);

      if (window.innerWidth <= 900) {
        onClose();
      }

      return;
    }

    if (tabKey === "import") {
      abrirImportacao();

      if (window.innerWidth <= 900) {
        onClose();
      }

      return;
    }

    // Abas ainda não desenvolvidas aparecem como "Em breve" e não fazem nada.
  };

  return (
    <>
      <div
        className={`${styles.sidebarScrim} ${isOpen ? styles.show : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}
      >
        {/* MARCA */}
        <div className={styles.brand}>
          <div className={styles.brandMark}>
            <FontAwesomeIcon icon={icons.truckFast} />
          </div>

          <div className={styles.brandText}>
            <div className={styles.n1}>NEWELOG</div>
            <div className={styles.n2}>Frota &amp; Operação</div>
          </div>
        </div>

        {/* NAVEGAÇÃO */}
        <nav aria-label="Navegação principal">
          <div className={styles.navGroupLabel}>Painel</div>

          {podeVerFinanceiro && (
            <button
              className={`${styles.navlink} ${
                activeTab === "home" ? styles.active : ""
              }`}
              type="button"
              onClick={() => handleNavClick("home")}
            >
              <FontAwesomeIcon icon={icons.gauge} />
              <span>Visão geral</span>
            </button>
          )}

          <button
            className={`${styles.navlink} ${
              activeTab === "drivers" ? styles.active : ""
            }`}
            type="button"
            onClick={() => handleNavClick("drivers")}
          >
            <FontAwesomeIcon icon={icons.idCard} />
            <span>Motoristas</span>
            <span className={styles.count}>{motoristasCount}</span>
          </button>

          <button
            className={`${styles.navlink} ${styles.emBreve}`}
            type="button"
            aria-disabled="true"
            title="Em breve"
            onClick={() => handleNavClick("rank")}
          >
            <FontAwesomeIcon icon={icons.rankingStar} />
            <span>Ranking</span>
            <span className={styles.soon}>Em breve</span>
          </button>

          {perfil === "gestor" && (
            <button
              className={`${styles.navlink} ${
                activeTab === "usuarios" ? styles.active : ""
              }`}
              type="button"
              onClick={() => handleNavClick("usuarios")}
            >
              <FontAwesomeIcon icon={icons.users} />
              <span>Usuários</span>
            </button>
          )}

          {/* DADOS */}
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
            className={`${styles.navlink} ${styles.emBreve}`}
            type="button"
            aria-disabled="true"
            title="Em breve"
            onClick={() => handleNavClick("export")}
          >
            <FontAwesomeIcon icon={icons.fileExport} />
            <span>Exportar planilha</span>
            <span className={styles.soon}>Em breve</span>
          </button>
        </nav>

        {/* RODAPÉ */}
        <div className={styles.sidebarFoot}>
          <div className={styles.userBox}>
            <div
              className={styles.userAvatar}
              aria-hidden="true"
            >
              <FontAwesomeIcon
                icon={
                  perfil === "gestor"
                    ? icons.userTie
                    : icons.userGear
                }
              />
            </div>

            <div className={styles.userInfo}>
              <span className={styles.userName}>
                {sessao?.nome}
              </span>

              <span className={styles.userRole}>
                {perfil === "gestor" ? "Gestor" : "Operador"}
              </span>
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