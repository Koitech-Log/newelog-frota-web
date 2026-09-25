import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "./components/icons";
import { Sidebar } from "./components/Sidebar";
import { DriversPage } from "./pages/DriversPage";
import { ProfileProvider } from "./context/ProfileContext";
import { useMotoristas } from "./hooks/useMotoristas";
import { ImportManifestoProvider, useImportManifesto } from "./context/ImportManifestoContext";

// Lote grande o suficiente para levantar, com boa confiança, todos os tipos
// de veículo distintos existentes na base (mesmo critério usado em DriversPage).
const TAMANHO_LOTE_FROTA = 500;

function MobileTopbar({ onAbrirMenu }: { onAbrirMenu: () => void }) {
  const { abrirModal } = useImportManifesto();

  return (
    <header className="mobile-topbar">
      <button type="button" className="burger" aria-label="Abrir menu" onClick={onAbrirMenu}>
        <FontAwesomeIcon icon={icons.bars} />
      </button>

      <div className="mobile-brand">
        <FontAwesomeIcon icon={icons.truckFast} />
        <span>NEWELOG</span>
      </div>

      <button
        type="button"
        className="mobile-import-btn"
        aria-label="Importar manifesto (CSV)"
        onClick={abrirModal}
      >
        <FontAwesomeIcon icon={icons.fileImport} />
      </button>
    </header>
  );
}

export function App() {
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
    <ProfileProvider>
      <ImportManifestoProvider>
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
      </ImportManifestoProvider>
    </ProfileProvider>
  );
}