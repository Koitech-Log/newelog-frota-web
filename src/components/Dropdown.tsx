import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { icons } from "./icons";
import styles from "./Dropdown.module.css";

export interface OpcaoDropdown<T extends string = string> {
  valor: T;
  rotulo: string;
  icone?: IconDefinition;
  descricao?: string;
}

interface DropdownProps<T extends string> {
  /** id do botão — permite ligar um <label htmlFor> externo. */
  id?: string;
  valor: T;
  opcoes: OpcaoDropdown<T>[];
  onChange: (valor: T) => void;
  /** Ícone fixo à esquerda do botão (quando a opção não traz um próprio). */
  icone?: IconDefinition;
  /** Nome acessível quando não há <label> externo. */
  rotuloAcessivel?: string;
  /** Destaca o botão como "filtro ativo" (ex.: valor diferente do padrão). */
  ativo?: boolean;
  desabilitado?: boolean;
}

const ALTURA_ITEM = 46;
const ALTURA_MAX_MENU = 288;
const FOLGA = 6;

/**
 * Dropdown próprio (listbox acessível) no lugar do <select> nativo, cujo popup não aceita estilo.
 * O menu é renderizado num portal com posição fixa, então não é cortado por containers com overflow.
 */
export function Dropdown<T extends string>({
  id,
  valor,
  opcoes,
  onChange,
  icone,
  rotuloAcessivel,
  ativo = false,
  desabilitado = false,
}: DropdownProps<T>) {
  const uid = useId();
  const gatilhoRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const buscaRef = useRef({ texto: "", timer: 0 });
  const [aberto, setAberto] = useState(false);
  const [indice, setIndice] = useState(0);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number; max: number }>({
    left: 0,
    width: 240,
    max: ALTURA_MAX_MENU,
  });

  const atual = opcoes.find((o) => o.valor === valor) ?? opcoes[0];
  const iconeAtual = atual?.icone ?? icone;

  const fechar = useCallback((devolverFoco: boolean) => {
    setAberto(false);
    if (devolverFoco) gatilhoRef.current?.focus();
  }, []);

  const abrir = useCallback(() => {
    setIndice(Math.max(0, opcoes.findIndex((o) => o.valor === valor)));
    setAberto(true);
  }, [opcoes, valor]);

  // Posiciona o menu logo abaixo do botão (ou acima, se faltar espaço), com a largura dele
  useLayoutEffect(() => {
    if (!aberto || !gatilhoRef.current) return;
    const r = gatilhoRef.current.getBoundingClientRect();
    const desejada = Math.min(opcoes.length * ALTURA_ITEM + 12, ALTURA_MAX_MENU);
    const abaixo = window.innerHeight - r.bottom - FOLGA - 12;
    const acima = r.top - FOLGA - 12;
    const emCima = abaixo < desejada && acima > abaixo;
    const largura = Math.max(r.width, 220);
    setPos({
      left: Math.min(Math.max(8, r.left), window.innerWidth - largura - 8),
      width: largura,
      max: Math.max(120, Math.min(ALTURA_MAX_MENU, emCima ? acima : abaixo)),
      ...(emCima ? { bottom: window.innerHeight - r.top + FOLGA } : { top: r.bottom + FOLGA }),
    });
  }, [aberto, opcoes.length]);

  // Foco no item ativo (e rola até ele quando a lista é longa)
  useEffect(() => {
    if (!aberto) return;
    const item = menuRef.current?.querySelectorAll<HTMLElement>("[role=option]")[indice];
    item?.focus();
    item?.scrollIntoView({ block: "nearest" });
  }, [aberto, indice]);

  // Fecha ao clicar fora, redimensionar ou rolar a página (rolar o próprio menu não fecha)
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (!menuRef.current?.contains(alvo) && !gatilhoRef.current?.contains(alvo)) setAberto(false);
    };
    const aoRolar = (e: Event) => {
      if (!menuRef.current?.contains(e.target as Node)) setAberto(false);
    };
    const sair = () => setAberto(false);
    document.addEventListener("mousedown", fora);
    window.addEventListener("resize", sair);
    window.addEventListener("scroll", aoRolar, true);
    return () => {
      document.removeEventListener("mousedown", fora);
      window.removeEventListener("resize", sair);
      window.removeEventListener("scroll", aoRolar, true);
    };
  }, [aberto]);

  function escolher(novo: T) {
    fechar(true);
    if (novo !== valor) onChange(novo);
  }

  /** Digitar letras salta para a opção que começa com elas (útil em listas longas). */
  function buscarPorTexto(letra: string) {
    const b = buscaRef.current;
    window.clearTimeout(b.timer);
    b.texto += letra.toLowerCase();
    b.timer = window.setTimeout(() => (b.texto = ""), 600);
    const i = opcoes.findIndex((o) => o.rotulo.toLowerCase().startsWith(b.texto));
    if (i >= 0) setIndice(i);
  }

  function aoTeclarGatilho(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      abrir();
    }
  }

  function aoTeclarMenu(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setIndice((i) => (i + 1) % opcoes.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setIndice((i) => (i - 1 + opcoes.length) % opcoes.length);
        break;
      case "Home":
        e.preventDefault();
        setIndice(0);
        break;
      case "End":
        e.preventDefault();
        setIndice(opcoes.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        escolher(opcoes[indice].valor);
        break;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        fechar(true);
        break;
      case "Tab":
        setAberto(false);
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) buscarPorTexto(e.key);
    }
  }

  return (
    <>
      <button
        ref={gatilhoRef}
        id={id}
        type="button"
        className={`${styles.gatilho} ${ativo ? styles.ativo : ""} ${aberto ? styles.aberto : ""}`}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={aberto ? `${uid}-menu` : undefined}
        aria-label={rotuloAcessivel ? `${rotuloAcessivel}: ${atual?.rotulo}` : undefined}
        disabled={desabilitado}
        onClick={() => (aberto ? fechar(false) : abrir())}
        onKeyDown={aoTeclarGatilho}
      >
        {iconeAtual && <FontAwesomeIcon icon={iconeAtual} className={styles.iconeGatilho} aria-hidden />}
        <span className={styles.textoGatilho}>{atual?.rotulo}</span>
        <FontAwesomeIcon icon={icons.chevronDown} className={styles.seta} aria-hidden />
      </button>

      {aberto &&
        createPortal(
          <ul
            ref={menuRef}
            id={`${uid}-menu`}
            role="listbox"
            aria-label={rotuloAcessivel}
            className={`${styles.menu} ${pos.bottom !== undefined ? styles.menuAcima : ""}`}
            style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.max }}
            onKeyDown={aoTeclarMenu}
          >
            {opcoes.map((opcao, i) => {
              const selecionada = opcao.valor === valor;
              return (
                <li
                  key={opcao.valor}
                  role="option"
                  aria-selected={selecionada}
                  tabIndex={i === indice ? 0 : -1}
                  className={`${styles.opcao} ${selecionada ? styles.opcaoAtiva : ""}`}
                  onClick={() => escolher(opcao.valor)}
                  onMouseEnter={() => setIndice(i)}
                >
                  {(opcao.icone ?? icone) && (
                    <span className={styles.opcaoIcone}>
                      <FontAwesomeIcon icon={(opcao.icone ?? icone) as IconDefinition} />
                    </span>
                  )}
                  <span className={styles.opcaoTexto}>
                    <strong>{opcao.rotulo}</strong>
                    {opcao.descricao && <small>{opcao.descricao}</small>}
                  </span>
                  {selecionada && <FontAwesomeIcon icon={icons.check} className={styles.opcaoCheck} />}
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </>
  );
}
