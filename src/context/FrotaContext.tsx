import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { motoristasApi } from "../api/motoristas";
import { ApiRequestError } from "../api/client";
import type { MotoristaResumo } from "../types/motorista";
import { resumirFrota, type ResumoFrota } from "../utils/frota";
import { useImportManifesto } from "./ImportManifestoContext";

const TAMANHO_LOTE = 500; // máximo aceito pelo motoristas-service
const MAXIMO_PAGINAS = 20;

interface FrotaContextValue {
  /** Todos os motoristas cadastrados (a mesma base da tela de Motoristas). */
  motoristas: MotoristaResumo[];
  /** Total de motoristas segundo o servidor. */
  total: number;
  resumo: ResumoFrota;
  carregando: boolean;
  erro: string | null;
  recarregar: () => void;
}

const FrotaContext = createContext<FrotaContextValue | null>(null);

/**
 * Fonte única do cadastro de motoristas e veículos para o menu lateral, o
 * dashboard e qualquer tela que precise dos totais. Recarrega sozinha sempre
 * que um CSV (manifesto ou veículos) é importado — assim os números nunca
 * ficam diferentes entre as telas.
 */
export function FrotaProvider({ children }: { children: ReactNode }) {
  const { versaoImportacao } = useImportManifesto();
  const [motoristas, setMotoristas] = useState<MotoristaResumo[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const recarregar = useCallback(() => setTick((valor) => valor + 1), []);

  useEffect(() => {
    let cancelado = false;

    setCarregando(true);
    setErro(null);

    (async () => {
      try {
        const primeira = await motoristasApi.listar({ page: 0, size: TAMANHO_LOTE });
        const paginas = Math.min(primeira.totalPaginas, MAXIMO_PAGINAS);
        const restantes =
          paginas > 1
            ? await Promise.all(
                Array.from({ length: paginas - 1 }, (_, i) =>
                  motoristasApi.listar({ page: i + 1, size: TAMANHO_LOTE })
                )
              )
            : [];

        if (cancelado) return;

        // dedupe por id: se algo mudar entre uma página e outra, não contamos duas vezes
        const unicos = new Map<number, MotoristaResumo>();
        [primeira, ...restantes].forEach((pagina) =>
          pagina.conteudo.forEach((m) => unicos.set(m.id, m))
        );

        setMotoristas([...unicos.values()]);
        setTotal(primeira.totalElementos);
      } catch (error) {
        if (cancelado) return;
        setErro(
          error instanceof ApiRequestError
            ? error.message
            : "Não foi possível carregar o cadastro de motoristas."
        );
      } finally {
        if (!cancelado) setCarregando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [versaoImportacao, tick]);

  const resumo = useMemo(() => resumirFrota(motoristas, total), [motoristas, total]);

  const value = useMemo(
    () => ({ motoristas, total, resumo, carregando, erro, recarregar }),
    [motoristas, total, resumo, carregando, erro, recarregar]
  );

  return <FrotaContext.Provider value={value}>{children}</FrotaContext.Provider>;
}

export function useFrota(): FrotaContextValue {
  const context = useContext(FrotaContext);
  if (!context) {
    throw new Error("useFrota precisa ser usado dentro de um FrotaProvider.");
  }
  return context;
}
