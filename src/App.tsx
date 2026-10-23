import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "./components/icons";
import { Sidebar } from "./components/Sidebar";
import { DriversPage } from "./pages/DriversPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfileProvider, useProfile } from "./context/ProfileContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { ImportManifestoProvider } from "./context/ImportManifestoContext";
import { FrotaProvider, useFrota } from "./context/FrotaContext";
import { ImportCsvProvider, useImportCsv } from "./context/ImportCsvContext";

function MobileTopbar({
  onAbrirMenu,
}: {
  onAbrirMenu: () => void;
}) {
  const { abrirImportacao } = useImportCsv();
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
          onClick={() => abrirImportacao()}
        >
          <FontAwesomeIcon icon={icons.fileImport} />
        </button>
      </div>
    </header>
  );
}

/** Layout da área logada: menu lateral com os totais + a página selecionada. */
function Layout() {
  const { podeVerFinanceiro } = useProfile();

  const [paginaAtiva, setPaginaAtiva] = useState<
    "home" | "drivers"
  >("drivers");

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { total: motoristasCount, resumo } = useFrota();
  const frotaCount = resumo.veiculos.length;

  return (
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
  );
}

/** Área logada: só monta e chama os serviços depois do login. */
function AppLogado() {
  return (
    <ImportManifestoProvider>
      {/* a frota recarrega sozinha a cada importação de CSV */}
      <FrotaProvider>
        <ImportCsvProvider>
          <Layout />
        </ImportCsvProvider>
      </FrotaProvider>
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
