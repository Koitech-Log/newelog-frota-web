// Espelha os DTOs Java do manifesto-service (br.com.newelog.dto) — qualquer
// mudança de contrato no back-end deve ser refletida aqui.

export interface MotoristaNovoImportado {
  nome: string;
  placaVeiculo: string | null;
  status: string;
}

export interface ManifestoUploadResponse {
  mensagem: string;
  nomeArquivo: string;
  totalProcessados: number;
  totalCadastrados: number;
  totalRejeitados: number;
  novos: MotoristaNovoImportado[];
}
