function escapar(valor: string | number): string {
  const texto = String(valor);
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/** Evita que o Excel interprete textos como fórmulas (=, +, -, @). */
export function textoSeguro(texto: string): string {
  return /^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto;
}

/** Número com vírgula decimal, como o Excel em pt-BR espera. */
export function numeroCsv(valor: number): string {
  return valor.toFixed(2).replace(".", ",");
}

/** Baixa um CSV separado por ponto e vírgula, com BOM para abrir com acentos no Excel. */
export function baixarCsv(nomeArquivo: string, linhas: (string | number)[][]) {
  const conteudo = "\uFEFF" + linhas.map((linha) => linha.map(escapar).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([conteudo], { type: "text/csv;charset=utf-8" }));

  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 0);
}
