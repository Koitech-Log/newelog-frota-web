import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "../icons";
import type { Perfil } from "../../context/ProfileContext";
import styles from "./SeletorPerfil.module.css";

interface SeletorPerfilProps {
  valor: Perfil;
  nomeUsuario: string;
  desabilitado?: boolean;
  dica?: string;
  onChange: (novo: Perfil) => void;
}

const OPCOES: { valor: Perfil; titulo: string; descricao: string; icone: typeof icons.userTie }[] = [
  { valor: "gestor", titulo: "Gestor", descricao: "Acesso total e gestão de usuários", icone: icons.userTie },
  { valor: "operador", titulo: "Operador", descricao: "Operação do dia a dia", icone: icons.userGear },
];

const LARGURA_MENU = 244;
const ALTURA_MENU = 124;

export function SeletorPerfil({ valor, nomeUsuario, desabilitado = false, dica, onChange }: SeletorPerfilProps) {
  const uid = useId();
  const gatilhoRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [aberto, setAberto] = useState(false);
  const [indice, setIndice] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number; acima: boolean }>({ top: 0, left: 0, acima: false });

  const atual = OPCOES.find((o) => o.valor === valor) ?? OPCOES[1];

  const fechar = useCallback((devolverFoco: boolean) => {
    setAberto(false);
    if (devolverFoco) gatilhoRef.current?.focus();
  }, []);

  const abrir = useCallback(() => {
    setIndice(Math.max(0, OPCOES.findIndex((o) => o.valor === valor)));
    setAberto(true);
  }, [valor]);

  // Posiciona o menu em relação ao botão (fixed + portal: a tabela tem overflow e cortaria o menu)
  useLayoutEffect(() => {
    if (!aberto || !gatilhoRef.current) return;
    const r = gatilhoRef.current.getBoundingClientRect();
    const acima = window.innerHeight - r.bottom < ALTURA_MENU + 16 && r.top > ALTURA_MENU + 16;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - LARGURA_MENU - 8);
    setPos({ top: acima ? r.top - 6 : r.bottom + 6, left, acima });
  }, [aberto]);

  // Foco no item ativo ao navegar
  useEffect(() => {
    if (aberto) menuRef.current?.querySelectorAll<HTMLElement>("[role=option]")[indice]?.focus();
  }, [aberto, indice]);

  // Fecha ao clicar fora, rolar ou redimensionar
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (!menuRef.current?.contains(alvo) && !gatilhoRef.current?.contains(alvo)) setAberto(false);
    };
    const sair = () => setAberto(false);
    document.addEventListener("mousedown", fora);
    window.addEventListener("resize", sair);
    window.addEventListener("scroll", sair, true);
    return () => {
      document.removeEventListener("mousedown", fora);
      window.removeEventListener("resize", sair);
      window.removeEventListener("scroll", sair, true);
    };
  }, [aberto]);

  function escolher(novo: Perfil) {
    fechar(true);
    if (novo !== valor) onChange(novo);
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
        setIndice((i) => (i + 1) % OPCOES.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setIndice((i) => (i - 1 + OPCOES.length) % OPCOES.length);
        break;
      case "Home":
        e.preventDefault();
        setIndice(0);
        break;
      case "End":
        e.preventDefault();
        setIndice(OPCOES.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        escolher(OPCOES[indice].valor);
        break;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        fechar(true);
        break;
      case "Tab":
        setAberto(false);
        break;
    }
  }

  return (
    <>
      <button
        ref={gatilhoRef}
        type="button"
        className={`${styles.gatilho} ${valor === "gestor" ? styles.gestor : styles.operador} ${aberto ? styles.gatilhoAberto : ""}`}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={aberto ? `${uid}-menu` : undefined}
        aria-label={`Perfil de ${nomeUsuario}: ${atual.titulo}`}
        title={dica}
        disabled={desabilitado}
        onClick={() => (aberto ? fechar(false) : abrir())}
        onKeyDown={aoTeclarGatilho}
      >
        <FontAwesomeIcon icon={atual.icone} className={styles.icone} />
        <span>{atual.titulo}</span>
        <FontAwesomeIcon icon={desabilitado ? icons.lock : icons.chevronDown} className={styles.seta} />
      </button>

      {aberto &&
        createPortal(
          <ul
            ref={menuRef}
            id={`${uid}-menu`}
            role="listbox"
            aria-label={`Perfil de ${nomeUsuario}`}
            className={`${styles.menu} ${pos.acima ? styles.menuAcima : ""}`}
            style={{ top: pos.top, left: pos.left, width: LARGURA_MENU }}
            onKeyDown={aoTeclarMenu}
          >
            {OPCOES.map((opcao, i) => {
              const selecionado = opcao.valor === valor;
              return (
                <li
                  key={opcao.valor}
                  role="option"
                  aria-selected={selecionado}
                  tabIndex={i === indice ? 0 : -1}
                  className={`${styles.opcao} ${selecionado ? styles.opcaoAtiva : ""}`}
                  onClick={() => escolher(opcao.valor)}
                  onMouseEnter={() => setIndice(i)}
                >
                  <span className={`${styles.opcaoIcone} ${opcao.valor === "gestor" ? styles.gestor : styles.operador}`}>
                    <FontAwesomeIcon icon={opcao.icone} />
                  </span>
                  <span className={styles.opcaoTexto}>
                    <strong>{opcao.titulo}</strong>
                    <small>{opcao.descricao}</small>
                  </span>
                  {selecionado && <FontAwesomeIcon icon={icons.check} className={styles.opcaoCheck} />}
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </>
  );
}
