import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "./components/icons";
import { Sidebar } from "./components/Sidebar";
import { DriversPage } from "./pages/DriversPage";
import { ProfileProvider } from "./context/ProfileContext";
import { ImportManifestoProvider, useImportManifesto } from "./context/ImportManifestoContext";

function MobileTopbar({ onAbrirMenu }: { onAbrirMenu: () => void }) {
  const { abrirModal } = useImportManifesto();

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

  return (
    <ProfileProvider>
      <ImportManifestoProvider>
        <div className="app">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
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