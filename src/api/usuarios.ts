import type { Perfil } from "../context/ProfileContext";
import { authApiClient } from "./client";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
  /** true enquanto o usuário não trocou a senha inicial definida pelo gestor. */
  mustChangePassword: boolean;
  criadoEm: string | null;
  ultimoLoginEm: string | null;
}

export interface NovoUsuario {
  nome: string;
  email: string;
  senha: string;
  perfil: Perfil;
}

interface FiltrosUsuario {
  busca: string;
  perfil: Perfil | "";
}

export const usuariosApi = {
  listar({ busca, perfil }: FiltrosUsuario, signal?: AbortSignal) {
    const params = new URLSearchParams();
    const termo = busca.trim();

    if (termo) params.set("busca", termo);
    if (perfil) params.set("perfil", perfil);

    const query = params.toString();
    const path = query ? `/api/usuarios?${query}` : "/api/usuarios";

    return authApiClient.get<Usuario[]>(path, signal);
  },

  /** Cadastro pelo gestor (POST /api/usuarios). A senha informada é temporária. */
  criar(dados: NovoUsuario) {
    return authApiClient.post<Usuario>("/api/usuarios", dados);
  },

  /** Ativa ou desativa o acesso (PATCH /api/usuarios/{id}/ativo). */
  atualizarAtivo(id: number, ativo: boolean) {
    return authApiClient.patch<Usuario>(`/api/usuarios/${id}/ativo`, { ativo });
  },

  /** Altera o perfil (PATCH /api/usuarios/{id}/perfil). */
  atualizarPerfil(id: number, perfil: Perfil) {
    return authApiClient.patch<Usuario>(`/api/usuarios/${id}/perfil`, { perfil });
  },
};
