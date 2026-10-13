export interface ErroLinhaVeiculo {
    linha: number;
    motivo: string;
}

export interface VeiculoUploadResponse {
    mensagem: string;
    nomeArquivo: string;
    totalLinhas: number;
    totalCadastrados: number;
    totalRejeitados: number;
    erros: ErroLinhaVeiculo[];
}