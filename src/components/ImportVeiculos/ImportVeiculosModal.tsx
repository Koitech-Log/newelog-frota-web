import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "../icons";
import { useImportarVeiculos } from "../../hooks/useImportarVeiculos";
import base from "../ImportManifesto/ImportManifestoModal.module.css";
import styles from "./ImportVeiculosModal.module.css";

interface ImportVeiculosModalProps {
    aberto: boolean;
    onClose: () => void;
}

export function ImportVeiculosModal({ aberto, onClose }: ImportVeiculosModalProps) {
    const { estado, resultado, mensagemErro, importar, reiniciar } = useImportarVeiculos();
    const [arquivo, setArquivo] = useState<File | null>(null);
    const [arrastando, setArrastando] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const carregando = estado === "carregando";
    const concluido = estado === "sucesso" || estado === "atencao";

    function limparTudo() {
        setArquivo(null);
        reiniciar();
        if (inputRef.current) inputRef.current.value = "";
    }

    function handleFechar() {
        onClose();
        setTimeout(limparTudo, 250);
    }

    function handleSelecionar(selecionado: File | undefined) {
        if (!selecionado) return;
        setArquivo(selecionado);
        reiniciar();
    }

    function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
        e.preventDefault();
        setArrastando(false);
        handleSelecionar(e.dataTransfer.files[0]);
    }

    async function handleEnviar() {
        if (!arquivo) return;
        await importar(arquivo);
    }

    return (
        <>
            <div
                className={`${base.scrim} ${aberto ? base.show : ""}`}
                onClick={handleFechar}
                aria-hidden="true"
            />
            <div
                className={`${base.modal} ${aberto ? base.show : ""}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="importVeiculosTitle"
                aria-hidden={!aberto}
            >
                <div className={base.head}>
                    <h3 id="importVeiculosTitle">
                        <FontAwesomeIcon icon={icons.truck} /> Importar veículos (CSV)
                    </h3>
                    <button
                        type="button"
                        className={base.closeBtn}
                        onClick={handleFechar}
                        aria-label="Fechar"
                    >
                        <FontAwesomeIcon icon={icons.close} />
                    </button>
                </div>

                <div className={base.body}>
                    <label
                        className={`${base.dropzone} ${arrastando ? base.dragover : ""}`}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setArrastando(true);
                        }}
                        onDragLeave={() => setArrastando(false)}
                        onDrop={handleDrop}
                    >
                        <FontAwesomeIcon icon={icons.cloudUpload} className={base.dzIcon} />
                        <span className={base.dzTitle}>Arraste o CSV de veículos aqui</span>
                        <span className={base.dzSub}>ou clique para selecionar o arquivo</span>
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".csv"
                            hidden
                            onChange={(e) => handleSelecionar(e.target.files?.[0])}
                        />
                    </label>

                    <p className={base.hint}>
                        <FontAwesomeIcon icon={icons.shield} />
                        Veículos válidos são cadastrados automaticamente. Linhas com placa vazia ou
                        duplicada, ou com tipo de veículo inexistente, são rejeitadas e listadas no
                        resultado.
                    </p>

                    {arquivo && (
                        <div className={styles.arquivoRow}>
                            <FontAwesomeIcon icon={icons.fileImport} />
                            <span>{arquivo.name}</span>
                        </div>
                    )}

                    <a className={styles.modeloLink} href="/modelo-veiculos.csv" download>
                        <FontAwesomeIcon icon={icons.fileExport} />
                        Baixar modelo do CSV
                    </a>

                    {carregando && (
                        <div className={`${base.status} ${base.loading}`}>
                            <FontAwesomeIcon icon={icons.spinner} spin />
                            <span>Enviando veículos…</span>
                        </div>
                    )}

                    {estado === "erro" && (
                        <div className={`${base.status} ${base.error}`}>
                            <FontAwesomeIcon icon={icons.error} />
                            <span>{mensagemErro}</span>
                        </div>
                    )}

                    {concluido && resultado && (
                        <>
                            <div
                                className={`${base.status} ${resultado.cadastrados > 0 ? base.success : base.error
                                    }`}
                            >
                                <FontAwesomeIcon
                                    icon={resultado.cadastrados > 0 ? icons.success : icons.error}
                                />
                                <span>
                                    {resultado.cadastrados} veículo
                                    {resultado.cadastrados !== 1 ? "s" : ""} cadastrado
                                    {resultado.cadastrados !== 1 ? "s" : ""} de {resultado.totalLinhas}{" "}
                                    linha{resultado.totalLinhas !== 1 ? "s" : ""}.
                                </span>
                            </div>

                            {resultado.rejeitados > 0 && (
                                <>
                                    <p className={styles.resumo}>
                                        {resultado.rejeitados} linha
                                        {resultado.rejeitados !== 1 ? "s" : ""} rejeitada
                                        {resultado.rejeitados !== 1 ? "s" : ""}:
                                    </p>
                                    <ul className={styles.listaErros}>
                                        {resultado.erros.map((erro) => (
                                            <li key={`${erro.linha}-${erro.motivo}`}>
                                                Linha {erro.linha}: {erro.motivo}
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </>
                    )}

                    {concluido ? (
                        <button type="button" className={base.doneBtn} onClick={handleFechar}>
                            Concluir
                        </button>
                    ) : (
                        <button
                            type="button"
                            className={styles.enviarBtn}
                            onClick={handleEnviar}
                            disabled={!arquivo || carregando}
                        >
                            {carregando && <FontAwesomeIcon icon={icons.spinner} spin />}
                            {carregando ? "Enviando…" : "Enviar"}
                        </button>
                    )}
                </div>
            </div >
        </>
    );
}