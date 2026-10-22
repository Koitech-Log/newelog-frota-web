import { useEffect, useRef, useState } from "react";

function prefereMenosMovimento() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Anima um número do valor atual até o alvo (ease-out). Quando o alvo muda,
 * a contagem parte do valor que estava na tela, não de zero.
 * Respeita "reduzir movimento" do sistema.
 */
export function useContagemAnimada(alvo: number, duracaoMs = 900): number {
  const [valor, setValor] = useState(0);
  const atualRef = useRef(0);
  const semAnimacao = duracaoMs <= 0 || prefereMenosMovimento();

  useEffect(() => {
    if (semAnimacao) return;

    const inicio = atualRef.current;
    const t0 = performance.now();
    let quadro = 0;

    const passo = (agora: number) => {
      const progresso = Math.min(1, (agora - t0) / duracaoMs);
      const suavizado = 1 - Math.pow(1 - progresso, 3);
      const atual = inicio + (alvo - inicio) * suavizado;

      atualRef.current = atual;
      setValor(atual);

      if (progresso < 1) quadro = requestAnimationFrame(passo);
    };

    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [alvo, duracaoMs, semAnimacao]);

  // Com "reduzir movimento" ativo, mostra o valor final direto, sem contagem.
  return semAnimacao ? alvo : valor;
}
