import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Tema = "claro" | "escuro";

interface ThemeContextValue {
  tema: Tema;
  isEscuro: boolean;
  alternarTema: () => void;
  setTema: (tema: Tema) => void;
}

const STORAGE_KEY = "newelog:tema";

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Lê a preferência salva; na ausência dela, usa o esquema de cores do SO. */
function temaInicial(): Tema {
  if (typeof window === "undefined") return "claro";

  const salvo = window.localStorage.getItem(STORAGE_KEY);
  if (salvo === "claro" || salvo === "escuro") return salvo;

  const prefereEscuro = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefereEscuro ? "escuro" : "claro";
}

/**
 * Controla o tema global da aplicação via atributo `data-theme` na raiz do
 * documento — o CSS (index.css) define os tokens de cor para cada valor.
 * A preferência é persistida em localStorage e reaplicada a cada visita.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTemaState] = useState<Tema>(temaInicial);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema === "escuro" ? "dark" : "light");
    window.localStorage.setItem(STORAGE_KEY, tema);
  }, [tema]);

  const setTema = (novoTema: Tema) => setTemaState(novoTema);
  const alternarTema = () => setTemaState((atual) => (atual === "claro" ? "escuro" : "claro"));

  return (
    <ThemeContext.Provider value={{ tema, isEscuro: tema === "escuro", alternarTema, setTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme precisa ser usado dentro de um ThemeProvider.");
  }
  return context;
}
