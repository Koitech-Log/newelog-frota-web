import { useEffect, useId, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "../icons";
import {
  TAMANHO_MAXIMO_BYTES,
  useImportarManifesto,
} from "../../hooks/useImportarManifesto";
import styles from "./ImportManifestoModal.module.css";
import { AlertaMotoristasNaoEncontrados } from "../Alert/AlertaMotoristasNaoEncontrados";

interface ImportManifestoModalProps {
  aberto: boolean;
  onClose: () => void;
  aoImportarComSucesso?: () => void;
}

const FOCAVEIS =
  'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace(".", ",")} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

function plural(n: number, singular: string, pluralForm: string) {
  return n === 1 ? singular : pluralForm;
}

export function ImportManifestoModal({
  aberto,
  onClose,
  aoImportarComSucesso,
}: ImportManifestoModalProps) {
  const { estado, arquivo, resultado, mensagemErro, selecionar, remover, importar, cancelar, reiniciar } =
    useImportarManifesto();
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const resetTimerRef = useRef<number | undefined>(undefined);
  const titleId = useId();
  const descId = useId();

  const carregando = estado === "carregando";
  const concluido = estado === "sucesso" || estado === "atencao";

  function handleFechar() {
    if (concluido) aoImportarComSucesso?.(); // fechar pelo X/Esc também atualiza a lista
    cancelar();
    onClose();
    // aguarda a transição de saída antes de limpar, para não "piscar" o
    // conteúdo enquanto o modal ainda está visível fechando
    window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = window.setTimeout(reiniciar, 250);
  }

  // Abertura: cancela reset pendente, trava o scroll da página, move o foco
  // para dentro do diálogo e devolve o foco ao elemento de origem ao fechar.
  useEffect(() => {
    if (!aberto) return;
    window.clearTimeout(resetTimerRef.current);
    const anterior = document.activeElement as HTMLElement | null;
    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modalRef.current?.focus();

    return () => {
      document.body.style.overflow = overflowOriginal;
      anterior?.focus?.();
    };
  }, [aberto]);

  useEffect(() => () => window.clearTimeout(resetTimerRef.current), []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.stopPropagation();
      handleFechar();
      return;
    }
    if (e.key !== "Tab") return;

    // focus trap
    const itens = Array.from(modalRef.current?.querySelectorAll<HTMLElement>(FOCAVEIS) ?? []);
    if (itens.length === 0) {
      e.preventDefault();
      return;
    }
    const primeiro = itens[0];
    const ultimo = itens[itens.length - 1];
    const ativo = document.activeElement;
    if (e.shiftKey && (ativo === primeiro || ativo === modalRef.current)) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && ativo === ultimo) {
      e.preventDefault();
      primeiro.focus();
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setArrastando(false);
    selecionar(e.dataTransfer.files[0]);
  }

  function abrirSeletor() {
    inputRef.current?.click();
  }

  const temArquivoNaFila = !!arquivo && !concluido;
  const mostrarDropzone = !arquivo && !carregando && !concluido;
  const rejeitados = resultado?.totalRejeitados ?? 0;

  return (
    <>
      <div
        className={`${styles.scrim} ${aberto ? styles.show : ""}`}
        onClick={handleFechar}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        className={`${styles.modal} ${aberto ? styles.show : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        inert={!aberto}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.head}>
          <div className={styles.headText}>
            <h3 id={titleId}>
              <FontAwesomeIcon icon={icons.fileImport} /> Importar manifesto
            </h3>
            <p id={descId} className={styles.subtitle}>
              Atualize o cadastro de motoristas a partir de um arquivo CSV.
            </p>
          </div>
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
          {mostrarDropzone && (
            <>
              <div
                className={`${styles.dropzone} ${arrastando ? styles.dragover : ""}`}
                role="button"
                tabIndex={0}
                aria-label="Selecionar arquivo CSV do manifesto"
                onClick={abrirSeletor}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    abrirSeletor();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setArrastando(true);
                }}
                onDragLeave={(e) => {
                  // ignora o "leave" disparado ao passar sobre elementos filhos
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                    setArrastando(false);
                  }
                }}
                onDrop={handleDrop}
              >
                <span className={styles.dzIconWrap}>
                  <FontAwesomeIcon icon={icons.cloudUpload} className={styles.dzIcon} />
                </span>
                <span className={styles.dzTitle}>
                  {arrastando ? (
                    "Solte o arquivo para selecionar"
                  ) : (
                    <>
                      <span className={styles.dzDesktop}>Arraste o CSV do manifesto aqui</span>
                      <span className={styles.dzTouch}>Selecione o CSV do manifesto</span>
                    </>
                  )}
                </span>
                <span className={styles.dzSub}>
                  <span className={styles.dzDesktop}>
                    ou <span className={styles.dzLink}>clique para selecionar</span>
                  </span>
                  <span className={styles.dzTouch}>
                    <span className={styles.dzLink}>Toque para escolher o arquivo</span>
                  </span>
                </span>
                <span className={styles.dzMeta}>
                  Apenas .csv · até {TAMANHO_MAXIMO_BYTES / 1024 / 1024} MB
                </span>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                hidden
                tabIndex={-1}
                onChange={(e) => {
                  selecionar(e.target.files?.[0]);
                  e.target.value = ""; // permite escolher o mesmo arquivo de novo
                }}
              />
            </>
          )}

          {arquivo && (
            <div className={styles.fileCard}>
              <span className={styles.fileIcon}>
                <FontAwesomeIcon icon={icons.fileCsv} />
              </span>
              <div className={styles.fileInfo}>
                <span className={styles.fileName} title={arquivo.name}>
                  {arquivo.name}
                </span>
                <span className={styles.fileMeta}>
                  {formatarTamanho(arquivo.size)}
                  {carregando && " · enviando…"}
                  {concluido && " · processado"}
                </span>
              </div>
              {temArquivoNaFila && !carregando && (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={remover}
                  aria-label={`Remover ${arquivo.name}`}
                >
                  <FontAwesomeIcon icon={icons.trash} />
                </button>
              )}
              {carregando && (
                <div className={styles.progress} role="progressbar" aria-label="Importando manifesto">
                  <span className={styles.progressBar} />
                </div>
              )}
            </div>
          )}

          {estado === "erro" && (
            <div className={`${styles.status} ${styles.error}`} role="alert">
              <FontAwesomeIcon icon={icons.error} />
              <span>{mensagemErro}</span>
            </div>
          )}

          {estado === "idle" && (
            <p className={styles.hint}>
              <FontAwesomeIcon icon={icons.shield} />
              <span>
                Motoristas já cadastrados são atualizados automaticamente. Motoristas novos entram
                no cadastro, mas ficam sinalizados como pendentes de validação.
              </span>
            </p>
          )}

          {concluido && resultado && (
            <div className={styles.result} aria-live="polite">
              <div className={`${styles.status} ${estado === "sucesso" ? styles.success : styles.atencao}`}>
                <FontAwesomeIcon icon={estado === "sucesso" ? icons.success : icons.warning} />
                <span>
                  {estado === "sucesso"
                    ? "Importação concluída."
                    : "Importação concluída — há motoristas novos para validar."}
                </span>
              </div>

              <dl className={styles.stats}>
                <div className={styles.stat}>
                  <dd>{resultado.totalProcessados}</dd>
                  <dt>{plural(resultado.totalProcessados, "linha lida", "linhas lidas")}</dt>
                </div>
                <div className={`${styles.stat} ${styles.statOk}`}>
                  <dd>{resultado.totalCadastrados}</dd>
                  <dt>{plural(resultado.totalCadastrados, "importado", "importados")}</dt>
                </div>
                <div className={`${styles.stat} ${rejeitados > 0 ? styles.statErr : ""}`}>
                  <dd>{rejeitados}</dd>
                  <dt>{plural(rejeitados, "rejeitada", "rejeitadas")}</dt>
                </div>
              </dl>

              {rejeitados > 0 && (
                <p className={styles.rejeitadosNote}>
                  <FontAwesomeIcon icon={icons.error} />
                  <span>
                    {rejeitados} {plural(rejeitados, "linha foi rejeitada", "linhas foram rejeitadas")}{" "}
                    por CPF/CNPJ inválido. Corrija no arquivo e importe novamente.
                  </span>
                </p>
              )}

              {estado === "atencao" && <AlertaMotoristasNaoEncontrados motoristas={resultado.novos} />}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {concluido ? (
            <button type="button" className={styles.primaryBtn} onClick={handleFechar}>
              Concluir
            </button>
          ) : (
            <>
              <button type="button" className={styles.secondaryBtn} onClick={handleFechar}>
                Cancelar
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={importar}
                disabled={!arquivo || carregando}
              >
                {carregando ? (
                  <>
                    <FontAwesomeIcon icon={icons.spinner} spin /> Importando…
                  </>
                ) : estado === "erro" && arquivo ? (
                  <>
                    <FontAwesomeIcon icon={icons.retry} /> Tentar novamente
                  </>
                ) : (
                  "Importar manifesto"
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
