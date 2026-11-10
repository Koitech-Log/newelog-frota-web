import { useEffect, useState } from "react";
import { ApiRequestError } from "../api/client";
import { usuariosApi, type Usuario } from "../api/usuarios";
import type { Perfil } from "../context/ProfileContext";

export function useUsuarios(busca: string, perfil: Perfil | "") {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    setCarregando(true);
    setErro(null);

    async function carregar() {
      try {
        const lista = await usuariosApi.listar({ busca, perfil }, signal);
        if (!signal.aborted) setUsuarios(lista);
      } catch (falha) {
        if (signal.aborted) return;

        setErro(
          falha instanceof ApiRequestError
            ? falha.message
            : "Não foi possível carregar os usuários. Verifique sua conexão.",
        );
      } finally {
        if (!signal.aborted) setCarregando(false);
      }
    }

    void carregar();

    return () => controller.abort();
  }, [busca, perfil, tentativa]);

  return {
    usuarios,
    carregando,
    erro,
    recarregar: () => setTentativa((atual) => atual + 1),
  };
}