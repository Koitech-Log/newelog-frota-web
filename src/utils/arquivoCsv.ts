export type EstadoImportacao =
  | "idle" // nenhum arquivo escolhido
  | "selecionado" // arquivo válido, aguardando confirmação
  | "carregando"
  | "sucesso"
  | "atencao" // importou, mas há algo a conferir (novos motoristas / linhas rejeitadas)
  | "erro";

/** Limite de tamanho aceito no front-end, para falhar rápido antes do upload. */
export const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024;

export function validarArquivoCsv(arquivo: File): string | null {
  if (!arquivo.name.toLowerCase().endsWith(".csv")) {
    return "Formato inválido. Envie um arquivo com extensão .csv.";
  }
  if (arquivo.size === 0) {
    return "O arquivo está vazio.";
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return `O arquivo excede o limite de ${TAMANHO_MAXIMO_BYTES / 1024 / 1024} MB.`;
  }
  return null;
}

export function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace(".", ",")} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

export function plural(n: number, singular: string, pluralForm: string) {
  return n === 1 ? singular : pluralForm;
}
