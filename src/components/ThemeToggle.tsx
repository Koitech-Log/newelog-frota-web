import { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "./icons";
import { useTheme } from "../context/ThemeContext";
import styles from "./ThemeToggle.module.css";

interface ThemeToggleProps {
  /** Rótulo textual visível ao lado do switch. */
  label?: string;
}

/**
 * Switch de tema claro/escuro. Ao alternar, aplica brevemente a classe
 * `.theme-transitioning` na raiz do documento para suavizar a troca de
 * cores em toda a árvore (ver index.css), removendo-a logo em seguida
 * para não interferir nas transições próprias de cada componente.
 */
export function ThemeToggle({ label = "Aparência" }: ThemeToggleProps) {
  const { isEscuro, alternarTema } = useTheme();
  const timeoutRef = useRef<number | null>(null);

  const handleToggle = () => {
    const root = document.documentElement;
    root.classList.add("theme-transitioning");
    alternarTema();

    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, 400);
  };

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>{label}</span>

      <button
        type="button"
        className={styles.switch}
        role="switch"
        aria-checked={isEscuro}
        aria-label={isEscuro ? "Mudar para tema claro" : "Mudar para tema escuro"}
        onClick={handleToggle}
      >
        <span className={styles.iconSun}>
          <FontAwesomeIcon icon={icons.sun} />
        </span>
        <span className={styles.iconMoon}>
          <FontAwesomeIcon icon={icons.moon} />
        </span>
        <span className={`${styles.knob} ${isEscuro ? styles.knobDark : ""}`}>
          <FontAwesomeIcon icon={isEscuro ? icons.moon : icons.sun} />
        </span>
      </button>
    </div>
  );
}
