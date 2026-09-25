import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "../icons";
import { Alert } from "./Alert";
import type { MotoristaNovoImportado } from "../../types/manifesto";
import styles from "./AlertaMotoristasNaoEncontrados.module.css";

interface AlertaMotoristasNaoEncontradosProps {
    motoristas: MotoristaNovoImportado[];
}

/**
 * Avisa quais motoristas apareceram no CSV do manifesto mas não existiam
 * na base — permitindo à pessoa que fez o upload conferir a lista antes de
 * confiar no cadastro automático (ver ManifestoCruzamentoService no
 * motoristas-service, que sinaliza esses casos).
 */
export function AlertaMotoristasNaoEncontrados({
    motoristas,
}: AlertaMotoristasNaoEncontradosProps) {
    if (motoristas.length === 0) return null;

    return (
        <Alert
            variante="warning"
            titulo={`${motoristas.length} motorista${motoristas.length !== 1 ? "s" : ""} encontrado${motoristas.length !== 1 ? "s" : ""
                } no CSV, mas não cadastrado${motoristas.length !== 1 ? "s" : ""} na base`}
        >
            <div className={styles.lista}>
                {motoristas.map((motorista, indice) => (
                    <div key={indice} className={styles.item}>
                        <FontAwesomeIcon icon={icons.userPlus} className={styles.itemIcon} />
                        <span className={styles.itemNome}>{motorista.nome}</span>
                        <span className={styles.itemMeta}>{motorista.placaVeiculo ?? "sem veículo"}</span>
                    </div>
                ))}
            </div>
        </Alert>
    );
}