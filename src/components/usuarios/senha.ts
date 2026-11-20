/** Utilitários de senha usados no cadastro de usuários. */

const MAIUSCULAS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const MINUSCULAS = "abcdefghijkmnopqrstuvwxyz";
const NUMEROS = "23456789";
const SIMBOLOS = "!@#$%&*?";

/** Inteiro aleatório em [0, max) sem viés de módulo, usando a API de criptografia do navegador. */
function aleatorio(max: number): number {
  const limite = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limite);
  return buffer[0] % max;
}

function sortear(conjunto: string): string {
  return conjunto[aleatorio(conjunto.length)];
}

/** Gera uma senha legível (sem caracteres ambíguos como 0/O e 1/l) com os quatro tipos de caractere. */
export function gerarSenha(tamanho = 14): string {
  const todos = MAIUSCULAS + MINUSCULAS + NUMEROS + SIMBOLOS;
  const caracteres = [
    sortear(MAIUSCULAS),
    sortear(MINUSCULAS),
    sortear(NUMEROS),
    sortear(SIMBOLOS),
  ];
  while (caracteres.length < tamanho) caracteres.push(sortear(todos));

  // Fisher-Yates: os quatro obrigatórios não ficam sempre no começo
  for (let i = caracteres.length - 1; i > 0; i--) {
    const j = aleatorio(i + 1);
    [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
  }
  return caracteres.join("");
}

export type NivelSenha = 0 | 1 | 2 | 3 | 4;

export interface ForcaSenha {
  nivel: NivelSenha;
  rotulo: string;
}

const ROTULOS: Record<NivelSenha, string> = {
  0: "",
  1: "Fraca",
  2: "Razoável",
  3: "Boa",
  4: "Forte",
};

/** Indicador visual apenas: a regra que vale (8 a 72 caracteres) é a do auth-service. */
export function avaliarSenha(senha: string): ForcaSenha {
  if (!senha) return { nivel: 0, rotulo: ROTULOS[0] };

  const pontos =
    Number(senha.length >= 8) +
    Number(senha.length >= 12) +
    Number(/[a-z]/.test(senha) && /[A-Z]/.test(senha)) +
    Number(/\d/.test(senha)) +
    Number(/[^A-Za-z0-9]/.test(senha));

  const nivel = Math.max(1, Math.min(4, pontos - (senha.length < 8 ? 1 : 0))) as NivelSenha;
  return { nivel, rotulo: ROTULOS[nivel] };
}
