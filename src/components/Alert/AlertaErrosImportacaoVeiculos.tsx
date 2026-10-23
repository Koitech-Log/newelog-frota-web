import { Alert } from "./Alert";
import type { ErroLinhaVeiculo } from "../../types/veiculo";
import { plural } from "../../utils/arquivoCsv";
import styles from "./AlertaErrosImportacaoVeiculos.module.css";

interface AlertaErrosImportacaoVeiculosProps {
    erros: ErroLinhaVeiculo[];
}

/**
 * Resultado da importação de veículos: lista cada linha rejeitada com o campo
 * e o motivo. Se não houver nenhuma, mostra a mensagem de sucesso no lugar da
 * lista (mesmo padrão do AlertaMotoristasNaoEncontrados, no fluxo de manifesto).
 */
export function AlertaErrosImportacaoVeiculos({ erros }: AlertaErrosImportacaoVeiculosProps) {
    if (erros.length === 0) {
        return (
            <Alert
                variante="success"
                titulo="Todos os veículos foram processados, sem nenhum erro."
            />
        );
    }

    return (
        <Alert
            variante="error"
            titulo={`${erros.length} ${plural(erros.length, "linha com erro", "linhas com erro")}`}
        >
            <div className={styles.tabelaWrap}>
                <table className={styles.tabela}>
                    <thead>
                        <tr>
                            <th scope="col">Linha</th>
                            <th scope="col">Campo</th>
                            <th scope="col">Motivo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {erros.map((erro, indice) => (
                            <tr key={`${erro.linha}-${indice}`}>
                                <td className={styles.colLinha}>{erro.linha}</td>
                                <td className={styles.colCampo}>{erro.campo?.trim() || "—"}</td>
                                <td className={styles.colMotivo}>{erro.motivo}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className={styles.dica}>Corrija essas linhas no arquivo e importe novamente.</p>
        </Alert>
    );
}