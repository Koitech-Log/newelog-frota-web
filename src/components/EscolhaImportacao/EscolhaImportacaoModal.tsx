import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "../icons";
import base from "../ImportManifesto/ImportManifestoModal.module.css";
import styles from "./EscolhaImportacaoModal.module.css";

interface EscolhaImportacaoModalProps {
    aberto: boolean;
    onClose: () => void;
    onEscolherManifesto: () => void;
    onEscolherVeiculos: () => void;
}

export function EscolhaImportacaoModal({
    aberto,
    onClose,
    onEscolherManifesto,
    onEscolherVeiculos,
}: EscolhaImportacaoModalProps) {
    return (
        <>
            <div
                className={`${base.scrim} ${aberto ? base.show : ""}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                className={`${base.modal} ${aberto ? base.show : ""}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="escolhaImportTitle"
                aria-hidden={!aberto}
            >
                <div className={base.head}>
                    <h3 id="escolhaImportTitle">
                        <FontAwesomeIcon icon={icons.fileImport} /> Qual deseja importar?
                    </h3>
                    <button type="button" className={base.closeBtn} onClick={onClose} aria-label="Fechar">
                        <FontAwesomeIcon icon={icons.close} />
                    </button>
                </div>

                <div className={base.body}>
                    <div className={styles.opcoes}>
                        <button type="button" className={styles.opcao} onClick={onEscolherManifesto}>
                            <FontAwesomeIcon icon={icons.fileImport} className={styles.opcaoIcone} />
                            <span>
                                <span className={styles.opcaoTitulo}>Manifesto</span>
                                <span className={styles.opcaoSub}>Atualiza e cadastra motoristas</span>
                            </span>
                        </button>

                        <button type="button" className={styles.opcao} onClick={onEscolherVeiculos}>
                            <FontAwesomeIcon icon={icons.truck} className={styles.opcaoIcone} />
                            <span>
                                <span className={styles.opcaoTitulo}>Veículos</span>
                                <span className={styles.opcaoSub}>Cadastra vários veículos de uma vez</span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}