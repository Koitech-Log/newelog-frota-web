export type StatusMotorista = "disponivel" | "ocupado";

export interface MotoristaAgregado {
  id: string;
  nomeCompleto: string;
  cpfCnpj: string;
  telefone: string;
  veiculo: string;
  placa: string;
  status: StatusMotorista;
}

export type MotoristaAgregadoFormData = Omit<MotoristaAgregado, "id">;

