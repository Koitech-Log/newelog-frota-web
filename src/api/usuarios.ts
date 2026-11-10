import type { Perfil } from "../context/ProfileContext";
import { authApiClient } from "./client";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
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
};