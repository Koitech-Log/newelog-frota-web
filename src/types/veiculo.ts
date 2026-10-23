export interface ErroLinhaVeiculo {
    linha: number;
    motivo: string;
    campo?: string | null;
}

export interface VeiculoUploadResponse {
    mensagem: string;
    nomeArquivo: string;
    totalLinhas: number;
    cadastrados: number;
    atualizados: number;
    rejeitados: number;
    erros: ErroLinhaVeiculo[];
}