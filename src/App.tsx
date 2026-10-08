import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "./components/icons";
import { Sidebar } from "./components/Sidebar";
import { DriversPage } from "./pages/DriversPage";
import { ProfileProvider } from "./context/ProfileContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { useMotoristas } from "./hooks/useMotoristas";
import { ImportManifestoProvider, useImportManifesto } from "./context/ImportManifestoContext";

// Lote grande o suficiente para levantar, com boa confiança, todos os tipos
// de veículo distintos existentes na base (mesmo critério usado em DriversPage).
const TAMANHO_LOTE_FROTA = 500;

function MobileTopbar({ onAbrirMenu }: { onAbrirMenu: () => void }) {
  const { abrirModal } = useImportManifesto();
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
      <button type="button" className="burger" aria-label="Abrir menu" onClick={onAbrirMenu}>
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
          aria-label={isEscuro ? "Mudar para tema claro" : "Mudar para tema escuro"}
          onClick={handleAlternarTema}
        >
          <FontAwesomeIcon icon={isEscuro ? icons.sun : icons.moon} />
        </button>

        <button
          type="button"
          className="mobile-import-btn"
          aria-label="Importar manifesto (CSV)"
          onClick={abrirModal}
        >
          <FontAwesomeIcon icon={icons.fileImport} />
        </button>
      </div>
    </header>
  );
}

/** Área logada: só monta (e só chama os serviços) depois do login. */
function AppLogado() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { totalElementos: motoristasCount } = useMotoristas({ page: 0, size: 1 });

  // Contagem dinâmica de tipos de veículo distintos, para o contador da
  // aba "Frota" no sidebar (antes fixo em "7").
  const { motoristas: motoristasParaFrota } = useMotoristas({
    page: 0,
    size: TAMANHO_LOTE_FROTA,
  });
  const frotaCount = useMemo(() => {
    const tipos = new Set<string>();
    motoristasParaFrota.forEach((m) => {
      if (m.tipoVeiculo) tipos.add(m.tipoVeiculo.trim().toUpperCase());
    });
    return tipos.size;
  }, [motoristasParaFrota]);

  return (
    <div className="app">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        motoristasCount={motoristasCount}
        frotaCount={frotaCount}
      />

      <div className="content-col">
        {/* Cabeçalho visível em ecrãs móveis */}
        <MobileTopbar onAbrirMenu={() => setIsSidebarOpen(true)} />

        {/* Exibição direta da sua página única */}
        <main className="main">
          <DriversPage />
        </main>
      </div>
    </div>
  );
}

function Gate() {
  const { sessao } = useAuth();

  if (!sessao) return <LoginPage />;

  // key: ao trocar de usuário, o estado da área logada recomeça do zero.
  return (
    <ProfileProvider key={sessao.token} perfil={sessao.perfil}>
      <ImportManifestoProvider>
        <AppLogado />
      </ImportManifestoProvider>
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
