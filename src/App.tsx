import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { UsuariosPage } from "./pages/UsuariosPage";
import { TrocaSenhaPage } from "./pages/TrocaSenhaPage";
import { BackToTop } from "./components/BackToTop";
import { StatusConexao } from "./components/StatusConexao";
import { useAtalhoBusca } from "./hooks/useAtalhoBusca";

type Pagina = "home" | "drivers" | "usuarios";

/** A página aberta sobrevive ao refresh (por aba); uma aba nova começa na visão geral. */
const CHAVE_PAGINA = "newelog:pagina-ativa";

const TITULOS: Record<Pagina, string> = {
  home: "Visão geral",
  drivers: "Motoristas",
  usuarios: "Usuários",
};

function lerPaginaInicial(perfilGestor: boolean): Pagina {
  try {
    const salva = sessionStorage.getItem(CHAVE_PAGINA);
    if (salva === "drivers") return "drivers";
    if (salva === "usuarios" && perfilGestor) return "usuarios";
  } catch {
    /* storage indisponível: cai na visão geral */
  }
  return perfilGestor ? "home" : "drivers";
}

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
  const { perfil, podeVerFinanceiro } = useProfile();

  // Só o gestor vê a visão geral (financeiro) e a página de usuários.
  const [paginaAtiva, setPaginaAtiva] = useState<Pagina>(() =>
    lerPaginaInicial(podeVerFinanceiro && perfil === "gestor"),
  );

  useEffect(() => {
    try {
      sessionStorage.setItem(CHAVE_PAGINA, paginaAtiva);
    } catch {
      /* sem persistência: segue funcionando */
    }
  }, [paginaAtiva]);

  useAtalhoBusca();

  // Título da aba acompanha a página aberta
  const paginaEfetiva: Pagina =
    paginaAtiva === "usuarios" && perfil === "gestor"
      ? "usuarios"
      : paginaAtiva === "home" && podeVerFinanceiro
        ? "home"
        : "drivers";
  useEffect(() => {
    document.title = `${TITULOS[paginaEfetiva]} · NEWELOG`;
  }, [paginaEfetiva]);

  // Ao trocar de página, volta ao topo (no primeiro render preserva o scroll do refresh)
  const paginaAnterior = useRef(paginaAtiva);
  useLayoutEffect(() => {
    if (paginaAnterior.current === paginaAtiva) return;
    paginaAnterior.current = paginaAtiva;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [paginaAtiva]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { total: motoristasCount } = useFrota();

  return (
    <div className="app">
      <StatusConexao />
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        motoristasCount={motoristasCount}
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
          {/* key: a troca de página remonta o bloco e dispara a animação de entrada */}
          <div key={paginaEfetiva} className="page-enter">
            {paginaEfetiva === "usuarios" ? (
              <UsuariosPage />
            ) : paginaEfetiva === "home" ? (
              <DashboardPage />
            ) : (
              <DriversPage />
            )}
          </div>
        </main>

        <BackToTop />
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

  // Sem sessão (logout): o próximo acesso volta a abrir na visão geral
  useEffect(() => {
    if (!sessao) {
      try {
        sessionStorage.removeItem(CHAVE_PAGINA);
      } catch {
        /* ignora */
      }
    }
  }, [sessao]);

  if (!sessao) {
    return <LoginPage />;
  }

  if (sessao.mustChangePassword) {
    return <TrocaSenhaPage />;
  }

  // Ao trocar de usuário, o estado da área logada recomeça do zero.
  return (
    <ProfileProvider key={sessao.token} perfil={sessao.perfil}>
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
