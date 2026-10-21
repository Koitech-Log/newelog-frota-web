import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "./components/icons";
import { Sidebar } from "./components/Sidebar";
import { DriversPage } from "./pages/DriversPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfileProvider, useProfile } from "./context/ProfileContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { useMotoristas } from "./hooks/useMotoristas";
import { ImportManifestoProvider } from "./context/ImportManifestoContext";
import { ImportCsvProvider, useImportCsv } from "./context/ImportCsvContext";

// Lote grande o suficiente para levantar, com boa confiança, todos os tipos
// de veículo distintos existentes na base.
const TAMANHO_LOTE_FROTA = 500;

function MobileTopbar({
  onAbrirMenu,
}: {
  onAbrirMenu: () => void;
}) {
  const { abrirEscolha } = useImportCsv();
  const { isEscuro, alternarTema } = useTheme();

  const handleAlternarTema = () => {
    document.documentElement.classList.add("theme-transitioning");
    alternarTema();

    window.setTimeout(() => {
      document.documentElement.classList.remove("theme-transitioning");
    }, 400);
  };

  return (
    <header className="mobile-topbar">
      <button
        type="button"
        className="burger"
        aria-label="Abrir menu"
        onClick={onAbrirMenu}
      >
        <FontAwesomeIcon icon={icons.bars} />
      </button>

      <div className="mobile-brand">
        <FontAwesomeIcon icon={icons.truckFast} />
        <span>NEWELOG</span>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          className="mobile-import-btn"
          aria-label={
            isEscuro
              ? "Mudar para tema claro"
              : "Mudar para tema escuro"
          }
          onClick={handleAlternarTema}
        >
          <FontAwesomeIcon
            icon={isEscuro ? icons.sun : icons.moon}
          />
        </button>

        <button
          type="button"
          className="mobile-import-btn"
          aria-label="Importar CSV"
          onClick={abrirEscolha}
        >
          <FontAwesomeIcon icon={icons.fileImport} />
        </button>
      </div>
    </header>
  );
}

/** Área logada: só monta e chama os serviços depois do login. */
function AppLogado() {
  const { podeVerFinanceiro } = useProfile();

  const [paginaAtiva, setPaginaAtiva] = useState<
    "home" | "drivers"
  >("drivers");

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { totalElementos: motoristasCount } = useMotoristas({
    page: 0,
    size: 1,
  });

  // Contagem dinâmica dos tipos de veículo distintos.
  const { motoristas: motoristasParaFrota } = useMotoristas({
    page: 0,
    size: TAMANHO_LOTE_FROTA,
  });

  const frotaCount = useMemo(() => {
    const tipos = new Set<string>();

    motoristasParaFrota.forEach((m) => {
      if (m.tipoVeiculo) {
        tipos.add(m.tipoVeiculo.trim().toUpperCase());
      }
    });

    return tipos.size;
  }, [motoristasParaFrota]);

  return (
    <ImportManifestoProvider>
      <ImportCsvProvider>
        <div className="app">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            motoristasCount={motoristasCount}
            frotaCount={frotaCount}
            activeTab={paginaAtiva}
            onNavigate={setPaginaAtiva}
          />

          <div className="content-col">
            {/* Cabeçalho visível em telas móveis */}
            <MobileTopbar
              onAbrirMenu={() => setIsSidebarOpen(true)}
            />

            {/* Exibe a página selecionada no menu */}
            <main className="main">
              {paginaAtiva === "home" && podeVerFinanceiro ? (
                <DashboardPage />
              ) : (
                <DriversPage />
              )}
            </main>
          </div>
        </div>
      </ImportCsvProvider>
    </ImportManifestoProvider>
  );
}

/** Controla o acesso à aplicação com base na sessão. */
function Gate() {
  const { sessao } = useAuth();

  if (!sessao) {
    return <LoginPage />;
  }

  // Ao trocar de usuário, o estado da área logada recomeça do zero.
  return (
    <ProfileProvider
      key={sessao.token}
      perfil={sessao.perfil}
    >
      <AppLogado />
    </ProfileProvider>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ThemeProvider>
  );
}
