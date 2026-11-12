import { useEffect, useId, useRef, type KeyboardEvent } from "react";
import type { Perfil } from "../../context/ProfileContext";
import styles from "./ConfirmarPerfilModal.module.css";

interface ConfirmarPerfilModalProps {
    aberto: boolean;
    nome: string;
    novoPerfil: Perfil;
    salvando: boolean;
    onConfirmar: () => void;
    onCancelar: () => void;
}

export function ConfirmarPerfilModal({
    aberto,
    nome,
    novoPerfil,
    salvando,
    onConfirmar,
    onCancelar,
}: ConfirmarPerfilModalProps) {
    const titleId = useId();
    const cancelarRef = useRef<HTMLButtonElement>(null);
    const rotulo = novoPerfil === "gestor" ? "Gestor" : "Operador";

    // ao abrir, o foco vai para "Cancelar" (a opção segura)
    useEffect(() => {
        if (aberto) cancelarRef.current?.focus();
    }, [aberto]);

    function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
        if (e.key === "Escape" && !salvando) {
            e.stopPropagation();
            onCancelar();
        }
    }

    return (
        <>
            <div
                className={`${styles.scrim} ${aberto ? styles.show : ""}`}
                onClick={() => !salvando && onCancelar()}
                aria-hidden="true"
            />
            <div
                className={`${styles.modal} ${aberto ? styles.show : ""}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                inert={!aberto}
                onKeyDown={handleKeyDown}
            >
                <div className={styles.corpo}>
                    <h2 id={titleId} className={styles.titulo}>
                        Alterar perfil?
                    </h2>
                    <p className={styles.texto}>
                        <strong>{nome}</strong> passará a ser <strong>{rotulo}</strong>. A mudança vale na
                        próxima ação dessa pessoa.
                    </p>
                </div>

                <div className={styles.acoes}>
                    <button
                        ref={cancelarRef}
                        type="button"
                        className={styles.cancelar}
                        onClick={onCancelar}
                        disabled={salvando}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className={styles.confirmar}
                        onClick={onConfirmar}
                        disabled={salvando}
                    >
                        {salvando ? "Salvando…" : "Confirmar"}
                    </button>
                </div>
            </div>
        </>
    );
}