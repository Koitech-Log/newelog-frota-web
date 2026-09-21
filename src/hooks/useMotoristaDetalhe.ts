import { useCallback, useEffect, useState } from "react";
import { motoristasApi } from "../api/motoristas";
import { ApiRequestError } from "../api/client";
import type { MotoristaDetalhe, StatusMotorista } from "../types/motorista";

interface EstadoDetalheMotorista {
  motorista: MotoristaDetalhe | null;
  carregando: boolean;
  erro: string | null;
  atualizandoStatus: boolean;
}

export function useMotoristaDetalhe(id: number | null) {
  const [estado, setEstado] = useState<EstadoDetalheMotorista>({
    motorista: null,
    carregando: false,
    erro: null,
    atualizandoStatus: false,
  });

  const carregar = useCallback(async () => {
    if (id === null) return;
    setEstado((atual) => ({ ...atual, carregando: true, erro: null }));
    try {
      const motorista = await motoristasApi.buscarDetalhe(id);
      setEstado((atual) => ({ ...atual, motorista, carregando: false }));
    } catch (erro) {
      const mensagem =
        erro instanceof ApiRequestError ? erro.message : "Não foi possível carregar os detalhes.";
      setEstado((atual) => ({ ...atual, carregando: false, erro: mensagem }));
    }
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const atualizarStatus = useCallback(
    async (novoStatus: StatusMotorista): Promise<{ sucesso: boolean; mensagem: string }> => {
      if (id === null) return { sucesso: false, mensagem: "Motorista inválido." };
      setEstado((atual) => ({ ...atual, atualizandoStatus: true, erro: null }));
      try {
        const motorista = await motoristasApi.atualizarStatus(id, novoStatus);
        setEstado((atual) => ({ ...atual, motorista, atualizandoStatus: false, erro: null }));
        const rotulo = novoStatus === "DISPONIVEL" ? "Disponível" : "Em operação";
        return { sucesso: true, mensagem: `Status atualizado para ${rotulo}.` };
      } catch (erro) {
        const mensagem =
          erro instanceof ApiRequestError ? erro.message : "Não foi possível atualizar o status.";
        setEstado((atual) => ({ ...atual, atualizandoStatus: false, erro: mensagem }));
        return { sucesso: false, mensagem };
      }
    },
    [id]
  );

  return { ...estado, recarregar: carregar, atualizarStatus };
}
