import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ApiRequestError } from "../../api/client";
import { usuariosApi, type HistoricoPerfil, type Usuario } from "../../api/usuarios";
import { icons } from "../icons";
import styles from "./HistoricoPerfilModal.module.css";

interface HistoricoPerfilModalProps {
  usuario: Usuario;
  onFechar: () => void;
}

const formatador = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatarData(valor: string): string {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? "Data indisponível" : formatador.format(data);
}

export function HistoricoPerfilModal({ usuario, onFechar }: HistoricoPerfilModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  const descricaoId = useId();
  const [historico, setHistorico] = useState<HistoricoPerfil[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    const focoAnterior = document.activeElement;
    const overflowAnterior = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflowAnterior;
      if (focoAnterior instanceof HTMLElement && focoAnterior.isConnected) focoAnterior.focus();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function carregar() {
      try {
        const registros = await usuariosApi.historicoPerfil(usuario.id, signal);
        if (!signal.aborted) setHistorico(registros);
      } catch (falha) {
        if (!signal.aborted) {
          setErro(
            falha instanceof ApiRequestError
              ? falha.message
              : "Não foi possível carregar o histórico. Verifique sua conexão.",
          );
        }
      } finally {
        if (!signal.aborted) setCarregando(false);
      }
    }

    void carregar();
    return () => controller.abort();
  }, [usuario.id, tentativa]);

  function fecharPeloFundo(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;
    const area = event.currentTarget.getBoundingClientRect();
    if (
      event.clientX < area.left || event.clientX > area.right ||
      event.clientY < area.top || event.clientY > area.bottom
    ) onFechar();
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className={styles.modal}
      aria-modal="true"
      aria-labelledby={tituloId}
      aria-describedby={descricaoId}
      onCancel={(event) => { event.preventDefault(); onFechar(); }}
      onClick={fecharPeloFundo}
    >
      <header className={styles.cabecalho}>
        <div className={styles.topo}>
          <span className={styles.icone}><FontAwesomeIcon icon={icons.history} /></span>
          <button type="button" className={styles.fecharIcone} aria-label="Fechar histórico" onClick={onFechar}>
            <FontAwesomeIcon icon={icons.close} />
          </button>
        </div>
        <h2 id={tituloId}>Histórico de perfil</h2>
        <p id={descricaoId}>Acompanhe as alterações de permissão deste usuário.</p>
      </header>

      <div className={styles.usuario}>
        <span className={styles.avatar} aria-hidden="true"><FontAwesomeIcon icon={icons.userClock} /></span>
        <div className={styles.identidade}><strong>{usuario.nome}</strong><span>{usuario.email}</span></div>
        <span className={`${styles.perfil} ${styles[usuario.perfil]}`}>
          {usuario.perfil === "gestor" ? "Gestor" : "Operador"}
        </span>
      </div>

      <div className={styles.corpo}>
        {carregando && (
          <p className={styles.carregando} role="status">
            <FontAwesomeIcon icon={icons.spinner} spin /> Carregando histórico…
          </p>
        )}
        {!carregando && erro && (
          <div className={styles.estado} role="alert">
            <span className={styles.iconeErro}><FontAwesomeIcon icon={icons.error} /></span>
            <h3>Não foi possível consultar o histórico</h3>
            <p>{erro}</p>
            <button type="button" className={styles.tentar} onClick={() => {
              setCarregando(true);
              setErro(null);
              setTentativa((atual) => atual + 1);
            }}>
              <FontAwesomeIcon icon={icons.retry} /> Tentar novamente
            </button>
          </div>
        )}
        {!carregando && !erro && historico.length === 0 && (
          <div className={styles.estado} role="status">
            <span className={styles.icone}><FontAwesomeIcon icon={icons.history} /></span>
            <h3>Nenhuma alteração de perfil registrada</h3>
            <p>Quando o perfil deste usuário mudar, o registro aparecerá aqui.</p>
          </div>
        )}
        {!carregando && !erro && historico.length > 0 && (
          <>
            <div className={styles.resumo}>
              <strong>{historico.length} {historico.length === 1 ? "alteração registrada" : "alterações registradas"}</strong>
              <span>Mais recentes primeiro</span>
            </div>
            <ol className={styles.timeline} aria-label="Alterações de perfil">
              {historico.map((registro, indice) => (
                <li key={registro.id} className={styles.evento}>
                  <div className={styles.eventoTopo}>
                    <strong>Perfil alterado {indice === 0 && <span className={styles.recente}>Mais recente</span>}</strong>
                    <time dateTime={registro.alteradoEm}>{formatarData(registro.alteradoEm)}</time>
                  </div>
                  <p className={styles.autor}>Por <strong>{registro.alteradoPorNome}</strong></p>
                  <div className={styles.mudanca}>
                    <span className={`${styles.perfil} ${styles[registro.perfilAnterior]}`}>
                      {registro.perfilAnterior === "gestor" ? "Gestor" : "Operador"}
                    </span>
                    <span className={styles.seta} aria-label="para"><FontAwesomeIcon icon={icons.arrowRight} /></span>
                    <span className={`${styles.perfil} ${styles[registro.perfilNovo]}`}>
                      {registro.perfilNovo === "gestor" ? "Gestor" : "Operador"}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>

      <footer className={styles.rodape}>
        <span><FontAwesomeIcon icon={icons.lock} /> Somente leitura · Registros preservados</span>
        <button type="button" className={styles.fechar} onClick={onFechar}>Fechar</button>
      </footer>
    </dialog>,
    document.body,
  );
}
