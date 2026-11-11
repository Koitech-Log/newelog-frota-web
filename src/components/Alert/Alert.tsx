import type { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "../icons";
import styles from "./Alert.module.css";

export type AlertVariante = "warning" | "error" | "info" | "success";

interface AlertProps {
    variante: AlertVariante;
    titulo: string;
    /** Linha de apoio, abaixo do título. */
    descricao?: string;
    children?: ReactNode;
}

const ICONE_POR_VARIANTE: Record<AlertVariante, typeof icons.warning> = {
    warning: icons.warning,
    error: icons.error,
    info: icons.shield,
    success: icons.success,
};

/**
 * Bloco de aviso/alerta genérico, com título, descrição opcional e conteúdo.
 * Usado nos resultados de importação de CSV (motoristas não encontrados,
 * linhas com erro nos veículos, etc.).
 */
export function Alert({ variante, titulo, descricao, children }: AlertProps) {
    return (
        <div
            className={`${styles.alert} ${styles[variante]}`}
            role={variante === "error" ? "alert" : "status"}
            aria-live="polite"
        >
            <div className={styles.head}>
                <span className={styles.selo} aria-hidden="true">
                    <FontAwesomeIcon icon={ICONE_POR_VARIANTE[variante]} />
                </span>
                <div className={styles.textos}>
                    <span className={styles.titulo}>{titulo}</span>
                    {descricao && <span className={styles.descricao}>{descricao}</span>}
                </div>
            </div>
            {children && <div className={styles.body}>{children}</div>}
        </div>
    );
}
