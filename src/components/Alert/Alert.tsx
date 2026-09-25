import type { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "../icons";
import styles from "./Alert.module.css";

export type AlertVariante = "warning" | "error" | "info" | "success";

interface AlertProps {
    variante: AlertVariante;
    titulo: string;
    children?: ReactNode;
}

const ICONE_POR_VARIANTE: Record<AlertVariante, typeof icons.warning> = {
    warning: icons.warning,
    error: icons.error,
    info: icons.shield,
    success: icons.success,
};

/**
 * Bloco de aviso/alerta genérico, com título + conteúdo opcional.
 * Usado, por exemplo, para sinalizar motoristas encontrados no manifesto
 * que não existem na base de dados (ver AlertaMotoristasNaoEncontrados).
 */
export function Alert({ variante, titulo, children }: AlertProps) {
    return (
        <div className={`${styles.alert} ${styles[variante]}`} role="alert" aria-live="polite">
            <div className={styles.head}>
                <FontAwesomeIcon icon={ICONE_POR_VARIANTE[variante]} className={styles.icon} />
                <span className={styles.titulo}>{titulo}</span>
            </div>
            {children && <div className={styles.body}>{children}</div>}
        </div>
    );
}