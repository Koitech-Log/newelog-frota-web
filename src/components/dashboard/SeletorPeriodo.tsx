import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "../icons";
import styles from "./SeletorPeriodo.module.css";

interface SeletorPeriodoProps {
  ano: number;
  mes: number;
  /** Índice (ano * 12 + mês − 1) do último mês que pode ser escolhido — o mês atual. */
  indiceMaximo: number;
  onChange: (ano: number, mes: number) => void;
}

const ANO_MINIMO = 1;
const ANO_MAXIMO = 9999;

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const MESES_CURTOS = Array.from({ length: 12 }, (_, i) =>
  capitalizar(
    new Intl.DateTimeFormat("pt-BR", { month: "short" })
      .format(new Date(2000, i, 1))
      .replace(".", "")
  )
);

function nomeDoMes(ano: number, mes: number, completo = false) {
  const data = new Date(0);
  data.setFullYear(ano, mes - 1, 1);

  const nome = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(data);
  return completo ? `${nome} de ${ano}` : `${capitalizar(nome)} ${ano}`;
}

/** Calendário em popover (grade de meses + navegação por ano), no lugar do seletor nativo. */
export function SeletorPeriodo({ ano, mes, indiceMaximo, onChange }: SeletorPeriodoProps) {
  const [aberto, setAberto] = useState(false);
  const [anoVisivel, setAnoVisivel] = useState(ano);
  const [direcao, setDirecao] = useState<1 | -1>(1);
  const raizRef = useRef<HTMLDivElement>(null);
  const gatilhoRef = useRef<HTMLButtonElement>(null);
  const gradeRef = useRef<HTMLDivElement>(null);

  const anoAtual = Math.floor(indiceMaximo / 12);
  const mesAtual = (indiceMaximo % 12) + 1;
  const mesAnterior = indiceMaximo - 1;

  // Ao abrir, foca o mês selecionado (ou o primeiro disponível) para navegar pelo teclado.
  useEffect(() => {
    if (!aberto) return;

    const id = requestAnimationFrame(() => {
      const grade = gradeRef.current;
      const alvo =
        grade?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]:not(:disabled)') ??
        grade?.querySelector<HTMLButtonElement>("button:not(:disabled)");
      alvo?.focus();
    });

    return () => cancelAnimationFrame(id);
  }, [aberto]);

  function abrir() {
    setAnoVisivel(ano);
    setDirecao(1);
    setAberto(true);
  }

  function fechar(devolverFoco = true) {
    setAberto(false);
    if (devolverFoco) gatilhoRef.current?.focus();
  }

  function trocarAno(delta: number) {
    const novo = anoVisivel + delta;
    if (novo < ANO_MINIMO || novo > Math.min(ANO_MAXIMO, anoAtual)) return;

    setDirecao(delta > 0 ? 1 : -1);
    setAnoVisivel(novo);
  }

  function escolher(novoAno: number, novoMes: number) {
    onChange(novoAno, novoMes);
    fechar();
  }

  function escolherIndice(indice: number) {
    escolher(Math.floor(indice / 12), (indice % 12) + 1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      fechar();
      return;
    }

    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      trocarAno(event.key === "PageUp" ? -1 : 1);
      return;
    }

    const passos: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 };
    const botoes = Array.from(
      gradeRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []
    );
    const atual = botoes.indexOf(document.activeElement as HTMLButtonElement);

    if (atual === -1) return;

    if (event.key in passos) {
      event.preventDefault();
      botoes[Math.min(Math.max(atual + passos[event.key], 0), botoes.length - 1)]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      botoes[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      botoes[botoes.length - 1]?.focus();
    }
  }

  const indiceSelecionado = ano * 12 + (mes - 1);

  return (
    <div
      ref={raizRef}
      className={styles.raiz}
      onBlur={(event) => {
        // fecha ao clicar/tabular para fora do calendário
        if (aberto && !raizRef.current?.contains(event.relatedTarget as Node | null)) {
          setAberto(false);
        }
      }}
    >
      <button
        ref={gatilhoRef}
        type="button"
        className={`${styles.gatilho} ${aberto ? styles.gatilhoAberto : ""}`}
        onClick={() => (aberto ? fechar(false) : abrir())}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        aria-label={`Período: ${nomeDoMes(ano, mes, true)}. Alterar mês e ano`}
      >
        <FontAwesomeIcon icon={icons.calendarDays} aria-hidden="true" />
        <span className={styles.rotulo}>{nomeDoMes(ano, mes)}</span>
        <FontAwesomeIcon
          icon={icons.chevronRight}
          className={`${styles.seta} ${aberto ? styles.setaAberta : ""}`}
          aria-hidden="true"
        />
      </button>

      {aberto && (
        <>
          <div
            className={styles.fundo}
            aria-hidden="true"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => fechar(false)}
          />
          <div
            className={styles.popover}
            role="dialog"
            aria-label="Escolher mês e ano"
            tabIndex={-1}
            onKeyDown={handleKeyDown}
          >
            <div className={styles.cabecalho}>
              <button
                type="button"
                className={styles.anoBtn}
                onClick={() => trocarAno(-1)}
                disabled={anoVisivel <= ANO_MINIMO}
                aria-label="Ano anterior"
              >
                <FontAwesomeIcon icon={icons.chevronLeft} />
              </button>

              <span
                key={anoVisivel}
                className={`${styles.ano} ${direcao > 0 ? styles.anoDireita : styles.anoEsquerda}`}
                aria-live="polite"
              >
                {anoVisivel}
              </span>

              <button
                type="button"
                className={styles.anoBtn}
                onClick={() => trocarAno(1)}
                disabled={anoVisivel >= Math.min(ANO_MAXIMO, anoAtual)}
                aria-label="Próximo ano"
              >
                <FontAwesomeIcon icon={icons.chevronRight} />
              </button>
            </div>

            <div
              key={anoVisivel}
              ref={gradeRef}
              className={`${styles.grade} ${direcao > 0 ? styles.gradeDireita : styles.gradeEsquerda}`}
              role="group"
              aria-label={`Meses de ${anoVisivel}`}
            >
              {MESES_CURTOS.map((rotulo, i) => {
                const indice = anoVisivel * 12 + i;
                const selecionado = indice === indiceSelecionado;
                const ehAtual = indice === indiceMaximo;

                return (
                  <button
                    key={rotulo}
                    type="button"
                    className={`${styles.mes} ${selecionado ? styles.mesSelecionado : ""} ${
                      ehAtual ? styles.mesAtual : ""
                    }`}
                    style={{ animationDelay: `${i * 22}ms` }}
                    disabled={indice > indiceMaximo}
                    aria-pressed={selecionado}
                    aria-label={nomeDoMes(anoVisivel, i + 1, true)}
                    onClick={() => escolher(anoVisivel, i + 1)}
                  >
                    {rotulo}
                  </button>
                );
              })}
            </div>

            <div className={styles.rodape}>
              <button
                type="button"
                className={styles.atalho}
                onClick={() => escolher(anoAtual, mesAtual)}
                disabled={indiceSelecionado === indiceMaximo}
              >
                <FontAwesomeIcon icon={icons.calendarDay} /> Mês atual
              </button>
              <button
                type="button"
                className={styles.atalho}
                onClick={() => escolherIndice(mesAnterior)}
                disabled={indiceSelecionado === mesAnterior || mesAnterior < 0}
              >
                Mês passado
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
