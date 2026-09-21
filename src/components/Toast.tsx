import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "./icons";
import styles from "./Toast.module.css";

interface ToastProps {
  mensagem: string | null;
  tipo?: "success" | "error";
  onFechar: () => void;
}

const DURACAO_MS = 3200;

export function Toast({ mensagem, tipo = "success", onFechar }: ToastProps) {
  useEffect(() => {
    if (!mensagem) return;
    const id = setTimeout(onFechar, DURACAO_MS);
    return () => clearTimeout(id);
  }, [mensagem, onFechar]);

  if (!mensagem) return null;

  return (
    <div className={`${styles.toast} ${tipo === "error" ? styles.error : ""}`} role="status">
      <FontAwesomeIcon icon={tipo === "error" ? icons.error : icons.success} />
      <span>{mensagem}</span>
    </div>
  );
}
