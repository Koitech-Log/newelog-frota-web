import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "../icons";
import { useImportarManifesto } from "../../hooks/useImportarManifesto";
import styles from "./ImportManifestoModal.module.css";
import { AlertaMotoristasNaoEncontrados } from "../Alert/AlertaMotoristasNaoEncontrados";

interface ImportManifestoModalProps {
  aberto: boolean;
  onClose: () => void;
  aoImportarComSucesso?: () => void;
}

export function ImportManifestoModal({
  aberto,
  onClose,
  aoImportarComSucesso,
}: ImportManifestoModalProps) {
  const { estado, resultado, mensagemErro, importar, reiniciar } = useImportarManifesto();
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFechar() {
    onClose();
    // aguarda a transição de saída antes de limpar, para não "piscar" o
    // conteúdo enquanto o modal ainda está visível fechando
    setTimeout(reiniciar, 250);
  }

  async function handleArquivo(arquivo: File | undefined) {
    if (!arquivo) return;
    await importar(arquivo);
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setArrastando(false);
    handleArquivo(e.dataTransfer.files[0]);
  }

  const carregando = estado === "carregando";

  return (
    <>
      <div
        className={`${styles.scrim} ${aberto ? styles.show : ""}`}
        onClick={handleFechar}
        aria-hidden="true"
      />
      <div
        className={`${styles.modal} ${aberto ? styles.show : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="importTitle"
        aria-hidden={!aberto}
      >
        <div className={styles.head}>
          <h3 id="importTitle">
            <FontAwesomeIcon icon={icons.fileImport} /> Importar manifesto (CSV)
          </h3>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={handleFechar}
            aria-label="Fechar"
          >
            <FontAwesomeIcon icon={icons.close} />
          </button>
        </div>

        <div className={styles.body}>
          <label
            className={`${styles.dropzone} ${arrastando ? styles.dragover : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setArrastando(true);
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={handleDrop}
          >
            <FontAwesomeIcon icon={icons.cloudUpload} className={styles.dzIcon} />
            <span className={styles.dzTitle}>Arraste o CSV do manifesto aqui</span>
            <span className={styles.dzSub}>ou clique para selecionar o arquivo</span>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              hidden
              onChange={(e) => handleArquivo(e.target.files?.[0])}
            />
          </label>

          <p className={styles.hint}>
            <FontAwesomeIcon icon={icons.shield} />
            Motoristas já cadastrados são atualizados automaticamente. Motoristas novos entram no
            cadastro, mas ficam sinalizados como pendentes de validação.
          </p>

          {carregando && (
            <div className={`${styles.status} ${styles.loading}`}>
              <FontAwesomeIcon icon={icons.spinner} spin />
              <span>Lendo manifesto…</span>
            </div>
          )}

          {estado === "erro" && (
            <div className={`${styles.status} ${styles.error}`}>
              <FontAwesomeIcon icon={icons.error} />
              <span>{mensagemErro}</span>
            </div>
          )}

          {estado === "sucesso" && resultado && (
            <div className={`${styles.status} ${styles.success}`}>
              <FontAwesomeIcon icon={icons.success} />
              <span>{resultado.totalCadastrados} motorista{resultado.totalCadastrados !== 1 ? "s" : ""} processado{resultado.totalCadastrados !== 1 ? "s" : ""} com sucesso.</span>
            </div>
          )}

          {estado === "atencao" && resultado && (
            <AlertaMotoristasNaoEncontrados motoristas={resultado.novos} />
          )}

          {estado !== "carregando" && resultado && resultado.totalRejeitados > 0 && (
            <div className={`${styles.status} ${styles.error}`}>
              <FontAwesomeIcon icon={icons.error} />
              <span>
                {resultado.totalRejeitados} linha{resultado.totalRejeitados !== 1 ? "s" : ""} rejeitada
                {resultado.totalRejeitados !== 1 ? "s" : ""} (CPF/CNPJ inválido).
              </span>
            </div>
          )}

          {estado === "sucesso" || estado === "atencao" ? (
            <button
              type="button"
              className={styles.doneBtn}
              onClick={() => {
                aoImportarComSucesso?.();
                handleFechar();
              }}
            >
              Concluir
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}
