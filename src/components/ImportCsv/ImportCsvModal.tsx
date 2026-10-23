import { useEffect, useId, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "../icons";
import { useImportarManifesto } from "../../hooks/useImportarManifesto";
import { useImportarVeiculos } from "../../hooks/useImportarVeiculos";
import { TAMANHO_MAXIMO_BYTES, formatarTamanho, plural } from "../../utils/arquivoCsv";
import { AlertaMotoristasNaoEncontrados } from "../Alert/AlertaMotoristasNaoEncontrados";
import { AlertaErrosImportacaoVeiculos } from "../Alert/AlertaErrosImportacaoVeiculos";
import { SeletorImportacao, type TipoImportacao } from "../SeletorImportacao";
import styles from "./ImportCsvModal.module.css";

interface ImportCsvModalProps {
  aberto: boolean;
  /** Tipo de importação selecionado no seletor do modal. */
  tipo: TipoImportacao;
  onTrocarTipo: (tipo: TipoImportacao) => void;
  onClose: () => void;
  /** Chamado ao sair do modal depois de importar um manifesto (para recarregar listas). */
  aoImportarManifesto?: () => void;
  /** Chamado ao sair do modal depois de importar veículos (para recarregar listas). */
  aoImportarVeiculos?: () => void;
  /** Callback genérico de compatibilidade, chamado quando qualquer importação termina. */
  aoImportar?: () => void;
}

/** Textos que mudam conforme o tipo — todo o resto do fluxo é idêntico. */
const CONFIG: Record<
  TipoImportacao,
  { subtitulo: string; dropzone: string; dropzoneTouch: string; aria: string; botao: string; dica: string }
> = {
  manifesto: {
    subtitulo: "Atualize o cadastro de motoristas a partir de um arquivo CSV.",
    dropzone: "Arraste o CSV do manifesto aqui",
    dropzoneTouch: "Selecione o CSV do manifesto",
    aria: "Selecionar arquivo CSV do manifesto",
    botao: "Importar manifesto",
    dica:
      "Motoristas já cadastrados são atualizados automaticamente. Motoristas novos entram no cadastro, mas ficam sinalizados como pendentes de validação.",
  },
  veiculos: {
    subtitulo: "Cadastre vários veículos de uma vez a partir de um arquivo CSV.",
    dropzone: "Arraste o CSV de veículos aqui",
    dropzoneTouch: "Selecione o CSV de veículos",
    aria: "Selecionar arquivo CSV de veículos",
    botao: "Importar veículos",
    dica:
      "Colunas esperadas: Placa, Marca, Modelo, Cor, Tipo Veículo e Agregado. Linhas inválidas ou duplicadas são rejeitadas e listadas no resultado.",
  },
};

const FOCAVEIS =
  'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ImportCsvModal({
  aberto,
  tipo,
  onTrocarTipo,
  onClose,
  aoImportarManifesto,
  aoImportarVeiculos,
  aoImportar,
}: ImportCsvModalProps) {
  const manifesto = useImportarManifesto();
  const veiculos = useImportarVeiculos();
  const ativo = tipo === "manifesto" ? manifesto : veiculos;
  const { estado, arquivo, mensagemErro, selecionar, remover, importar } = ativo;
  const config = CONFIG[tipo];

  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const resetTimerRef = useRef<number | undefined>(undefined);
  const manifestoNotificadoRef = useRef(false);
  const veiculosNotificadoRef = useRef(false);
  const titleId = useId();
  const descId = useId();

  const carregando = estado === "carregando";
  const concluido = estado === "sucesso" || estado === "atencao";

  const manifestoConcluido = manifesto.estado === "sucesso" || manifesto.estado === "atencao";
  const veiculosConcluido = veiculos.estado === "sucesso" || veiculos.estado === "atencao";

  // Notifica a tela assim que a importação termina, sem depender do fechamento do modal.
  // As refs evitam chamadas duplicadas em re-renderizações ou mudanças de callback.
  useEffect(() => {
    if (manifestoConcluido && !manifestoNotificadoRef.current) {
      manifestoNotificadoRef.current = true;
      aoImportarManifesto?.();
      aoImportar?.();
    }
    if (veiculosConcluido && !veiculosNotificadoRef.current) {
      veiculosNotificadoRef.current = true;
      aoImportarVeiculos?.();
      aoImportar?.();
    }
    if (!manifestoConcluido) manifestoNotificadoRef.current = false;
    if (!veiculosConcluido) veiculosNotificadoRef.current = false;
  }, [manifestoConcluido, veiculosConcluido, aoImportarManifesto, aoImportarVeiculos, aoImportar]);

  function handleFechar() {
    manifesto.cancelar();
    veiculos.cancelar();
    onClose();
    // aguarda a transição de saída antes de limpar, para não "piscar" o
    // conteúdo enquanto o modal ainda está visível fechando
    window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = window.setTimeout(() => {
      manifesto.reiniciar();
      veiculos.reiniciar();
    }, 250);
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
    const focado = document.activeElement;
    if (e.shiftKey && (focado === primeiro || focado === modalRef.current)) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && focado === ultimo) {
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

  // Resumo normalizado: os dois tipos mostram os mesmos três números.
  // Resumo normalizado: os dois tipos mostram os mesmos três números.
  const resumo =
    tipo === "manifesto"
      ? manifesto.resultado && {
        lidas: manifesto.resultado.totalProcessados,
        importadas: manifesto.resultado.totalCadastrados,
        rejeitadas: manifesto.resultado.totalRejeitados ?? 0,
      }
      : veiculos.resultado && {
        lidas: veiculos.resultado.totalLinhas,
        // novos + já existentes: se todas as placas já existiam, ainda houve importação
        importadas: veiculos.resultado.cadastrados + veiculos.resultado.atualizados,
        rejeitadas: veiculos.resultado.rejeitados,
      };

  // Nada foi importado (ex.: todas as linhas rejeitadas) conta como falha.
  const nadaImportado = !!resumo && resumo.importadas === 0;
  const statusSucesso = estado === "sucesso";
  const statusClasse = nadaImportado ? styles.error : statusSucesso ? styles.success : styles.atencao;
  const statusIcone = nadaImportado ? icons.error : statusSucesso ? icons.success : icons.warning;
  const statusTexto = nadaImportado
    ? "Nenhuma linha foi importada."
    : statusSucesso
      ? "Importação concluída."
      : tipo === "manifesto"
        ? "Importação concluída — há motoristas novos para validar."
        : "Importação concluída — algumas linhas foram rejeitadas.";

  const motivoRejeicao = tipo === "manifesto" ? " por CPF/CNPJ inválido" : "";

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
              <FontAwesomeIcon icon={icons.fileImport} /> Importar CSV
            </h3>
            <p id={descId} className={styles.subtitle}>
              {config.subtitulo}
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
          <SeletorImportacao ativo={tipo} onTrocar={onTrocarTipo} desabilitado={carregando} />

          {mostrarDropzone && (
            <>
              <div
                className={`${styles.dropzone} ${arrastando ? styles.dragover : ""}`}
                role="button"
                tabIndex={0}
                aria-label={config.aria}
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
                      <span className={styles.dzDesktop}>{config.dropzone}</span>
                      <span className={styles.dzTouch}>{config.dropzoneTouch}</span>
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
                <div
                  className={styles.progress}
                  role="progressbar"
                  aria-label={tipo === "manifesto" ? "Importando manifesto" : "Importando veículos"}
                >
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

          {(estado === "idle" || estado === "selecionado") && (
            <p className={styles.hint}>
              <FontAwesomeIcon icon={icons.shield} />
              <span>{config.dica}</span>
            </p>
          )}

          {concluido && resumo && (
            <div className={styles.result} aria-live="polite">
              <div className={`${styles.status} ${statusClasse}`}>
                <FontAwesomeIcon icon={statusIcone} />
                <span>{statusTexto}</span>
              </div>

              {tipo === "veiculos" && veiculos.resultado ? (
                <dl className={styles.stats}>
                  <div className={`${styles.stat} ${styles.statOk}`}>
                    <dd>{veiculos.resultado.cadastrados}</dd>
                    <dt>{plural(veiculos.resultado.cadastrados, "cadastrado", "cadastrados")}</dt>
                  </div>
                  <div className={styles.stat}>
                    <dd>{veiculos.resultado.atualizados}</dd>
                    <dt>{plural(veiculos.resultado.atualizados, "já existente", "já existentes")}</dt>
                  </div>
                  <div className={`${styles.stat} ${veiculos.resultado.rejeitados > 0 ? styles.statErr : ""}`}>
                    <dd>{veiculos.resultado.rejeitados}</dd>
                    <dt>com erro</dt>
                  </div>
                </dl>
              ) : (
                <dl className={styles.stats}>
                  <div className={styles.stat}>
                    <dd>{resumo.lidas}</dd>
                    <dt>{plural(resumo.lidas, "linha lida", "linhas lidas")}</dt>
                  </div>
                  <div className={`${styles.stat} ${styles.statOk}`}>
                    <dd>{resumo.importadas}</dd>
                    <dt>{plural(resumo.importadas, "importado", "importados")}</dt>
                  </div>
                  <div className={`${styles.stat} ${resumo.rejeitadas > 0 ? styles.statErr : ""}`}>
                    <dd>{resumo.rejeitadas}</dd>
                    <dt>{plural(resumo.rejeitadas, "rejeitada", "rejeitadas")}</dt>
                  </div>
                </dl>
              )}

              {tipo === "manifesto" && resumo.rejeitadas > 0 && (
                <p className={styles.rejeitadosNote}>
                  <FontAwesomeIcon icon={icons.error} />
                  <span>
                    {resumo.rejeitadas}{" "}
                    {plural(resumo.rejeitadas, "linha foi rejeitada", "linhas foram rejeitadas")}
                    {motivoRejeicao}. Corrija no arquivo e importe novamente.
                  </span>
                </p>
              )}

              {tipo === "veiculos" && veiculos.resultado && (
                <AlertaErrosImportacaoVeiculos erros={veiculos.resultado.erros ?? []} />
              )}

              {tipo === "manifesto" && estado === "atencao" && manifesto.resultado && (
                <AlertaMotoristasNaoEncontrados motoristas={manifesto.resultado.novos} />
              )}
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
                  config.botao
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}