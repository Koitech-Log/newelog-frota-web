import { useEffect } from "react";

/**
 * Atalho "/" foca o campo de busca da página atual (padrão de GitHub, Gmail etc.).
 * Ignora a tecla enquanto o usuário já digita em um campo, usa modificadores ou
 * há um diálogo aberto. Reaproveita o primeiro campo de busca visível no <main>.
 */
export function useAtalhoBusca(seletorRaiz = "main") {
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;

      const alvo = e.target as HTMLElement | null;
      const digitando =
        alvo instanceof HTMLInputElement ||
        alvo instanceof HTMLTextAreaElement ||
        alvo instanceof HTMLSelectElement ||
        alvo?.isContentEditable;
      if (digitando) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;

      const campo = document.querySelector<HTMLInputElement>(
        `${seletorRaiz} input[type="search"], ${seletorRaiz} input[placeholder^="Buscar"]`,
      );
      if (!campo || campo.offsetParent === null) return;

      e.preventDefault();
      campo.focus();
      campo.select();
    }

    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [seletorRaiz]);
}
