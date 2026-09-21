import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "./components/icons";
import { Sidebar } from "./components/Sidebar";
import { DriversPage } from "./pages/DriversPage";
import { ProfileProvider } from "./context/ProfileContext";

export function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ProfileProvider>
      <div className="app">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="content-col">
          {/* Cabeçalho visível em ecrãs móveis */}
          <header className="mobile-topbar">
            <button
              type="button"
              className="burger"
              aria-label="Abrir menu"
              onClick={() => setIsSidebarOpen(true)}
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
              aria-label="Importar XML"
              onClick={() => console.info("Importação de XML")}
            >
              <FontAwesomeIcon icon={icons.fileImport} />
            </button>
          </header>

          {/* Exibição direta da sua página única */}
          <main className="main">
            <DriversPage />
          </main>
        </div>
      </div>
    </ProfileProvider>
  );
}