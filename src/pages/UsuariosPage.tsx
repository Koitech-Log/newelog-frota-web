import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "../components/icons";
import { Toast } from "../components/Toast";
import { KpiCard } from "../components/dashboard/KpiCard";
import { NovoUsuarioModal } from "../components/usuarios/NovoUsuarioModal";
import { ApiRequestError } from "../api/client";
import { lerIdUsuario } from "../api/session";
import { usuariosApi, type Usuario } from "../api/usuarios";
import { useProfile, type Perfil } from "../context/ProfileContext";
import { useUsuarios } from "../hooks/useUsuarios";
import layout from "./DriversPage.module.css";
import styles from "./UsuariosPage.module.css";
import { ConfirmarPerfilModal } from "../components/usuarios/ConfirmarPerfilModal";

type FiltroStatus = "todos" | "ativos" | "inativos";

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function formatarUltimoAcesso(valor: string | null): string {
  if (!valor) return "Nunca acessou";
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? "—" : formatadorData.format(data);
}

/** Espera o usuário parar de digitar antes de consultar o serviço. */
function useAtraso<T>(valor: T, ms: number): T {
  const [atrasado, setAtrasado] = useState(valor);
  useEffect(() => {
    const id = window.setTimeout(() => setAtrasado(valor), ms);
    return () => window.clearTimeout(id);
  }, [valor, ms]);
  return atrasado;
}

/**
 * Gestão de usuários. A tela só é montada para gestores: o menu esconde o item,
 * o App não a renderiza para outros perfis, esta guarda reforça e o auth-service
 * responde 403 em /api/usuarios para quem não é gestor.
 */
export function UsuariosPage() {
  const { perfil } = useProfile();

  if (perfil !== "gestor") {
    return (
      <section className={layout.page}>
        <div className={styles.restrito} role="alert">
          <span className={styles.restritoIcone} aria-hidden="true">
            <FontAwesomeIcon icon={icons.lock} />
          </span>
          <h1>Acesso restrito</h1>
          <p>Somente gestores podem gerenciar usuários.</p>
        </div>
      </section>
    );
  }

  return <UsuariosConteudo />;
}

function UsuariosConteudo() {
  const [buscaDigitada, setBuscaDigitada] = useState("");
  const [perfilFiltro, setPerfilFiltro] = useState<Perfil | "">("");
  const [statusFiltro, setStatusFiltro] = useState<FiltroStatus>("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [pendente, setPendente] = useState<{ usuario: Usuario; novoPerfil: Perfil } | null>(null);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [alternando, setAlternando] = useState<ReadonlySet<number>>(new Set());
  const [novoId, setNovoId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ mensagem: string; tipo: "success" | "error" } | null>(null);

  const ultimoCriadoRef = useRef<number | null>(null);
  const destaqueTimer = useRef<number | undefined>(undefined);
  const meuId = useMemo(() => lerIdUsuario(), []);

  const busca = useAtraso(buscaDigitada, 300);

  // Lista filtrada pelo serviço (busca e perfil) e, separadamente, o total geral
  // que alimenta os cartões e os contadores dos filtros.
  const lista = useUsuarios(busca, perfilFiltro);
  const geral = useUsuarios("", "");

  const { usuarios, carregando, erro } = lista;
  const todos = geral.usuarios;

  const totais = useMemo(() => {
    const gestores = todos.filter((u) => u.perfil === "gestor").length;
    const ativos = todos.filter((u) => u.ativo).length;
    return {
      total: todos.length,
      gestores,
      operadores: todos.length - gestores,
      ativos,
      inativos: todos.length - ativos,
    };
  }, [todos]);

  const visiveis = useMemo(
    () =>
      usuarios.filter((u) =>
        statusFiltro === "todos" ? true : statusFiltro === "ativos" ? u.ativo : !u.ativo,
      ),
    [usuarios, statusFiltro],
  );

  const temFiltro = buscaDigitada.trim() !== "" || perfilFiltro !== "" || statusFiltro !== "todos";
  const primeiroCarregamento = carregando && usuarios.length === 0;

  useEffect(() => () => window.clearTimeout(destaqueTimer.current), []);

  const { recarregar: recarregarLista } = lista;
  const { recarregar: recarregarGeral } = geral;
  const recarregarTudo = useCallback(() => {
    recarregarLista();
    recarregarGeral();
  }, [recarregarLista, recarregarGeral]);

  function limparFiltros() {
    setBuscaDigitada("");
    setPerfilFiltro("");
    setStatusFiltro("todos");
  }

  function handleCriado(usuario: Usuario) {
    ultimoCriadoRef.current = usuario.id;
    recarregarTudo();
  }

  function fecharModal() {
    setModalAberto(false);

    // o destaque só começa quando o modal já saiu da frente da lista
    const id = ultimoCriadoRef.current;
    if (id === null) return;
    ultimoCriadoRef.current = null;
    window.clearTimeout(destaqueTimer.current);
    window.setTimeout(() => setNovoId(id), 250);
    destaqueTimer.current = window.setTimeout(() => setNovoId(null), 4500);
  }

  async function alternarAtivo(usuario: Usuario) {
    if (alternando.has(usuario.id)) return;
    setAlternando((atual) => new Set(atual).add(usuario.id));

    try {
      const atualizado = await usuariosApi.atualizarAtivo(usuario.id, !usuario.ativo);
      lista.substituir(atualizado);
      geral.substituir(atualizado);
      setToast({
        mensagem: atualizado.ativo
          ? `Acesso de ${atualizado.nome} reativado.`
          : `Acesso de ${atualizado.nome} desativado.`,
        tipo: "success",
      });
    } catch (falha) {
      setToast({
        mensagem:
          falha instanceof ApiRequestError
            ? falha.message
            : "Não foi possível atualizar o usuário. Verifique sua conexão.",
        tipo: "error",
      });
    } finally {
      setAlternando((atual) => {
        const proximo = new Set(atual);
        proximo.delete(usuario.id);
        return proximo;
      });
    }
  }

  async function confirmarPerfil() {
    if (!pendente) return;
    setSalvandoPerfil(true);

    try {
      const atualizado = await usuariosApi.atualizarPerfil(pendente.usuario.id, pendente.novoPerfil);
      recarregarTudo(); // atualiza a lista, os cartões e os contadores
      setToast({
        mensagem: `Perfil de ${atualizado.nome} alterado para ${atualizado.perfil === "gestor" ? "Gestor" : "Operador"
          }.`,
        tipo: "success",
      });
    } catch (falha) {
      setToast({
        mensagem:
          falha instanceof ApiRequestError
            ? falha.message
            : "Não foi possível alterar o perfil. Verifique sua conexão.",
        tipo: "error",
      });
    } finally {
      setSalvandoPerfil(false);
      setPendente(null);
    }
  }

  const fecharToast = useCallback(() => setToast(null), []);

  return (
    <section className={layout.page}>
      <header className={styles.cabecalho}>
        <div className={styles.cabecalhoTexto}>
          <span className={layout.eyebrow}>Administração</span>
          <h1 className={layout.title}>Usuários</h1>
          <p className={`${layout.subtitle} ${styles.subtitulo}`}>
            Cadastre quem acessa o NEWELOG, defina o perfil de cada pessoa e controle quem está com o
            acesso ativo.
          </p>
        </div>

        <button type="button" className={styles.novoBtn} onClick={() => setModalAberto(true)}>
          <FontAwesomeIcon icon={icons.userPlus} />
          Novo usuário
        </button>
      </header>

      <div className={styles.kpis}>
        <KpiCard
          titulo="Total de usuários"
          valor={totais.total}
          formato="inteiro"
          descricao="cadastrados no sistema"
          icone={icons.users}
          cor="brand"
          indice={0}
        />
        <KpiCard
          titulo="Gestores"
          valor={totais.gestores}
          formato="inteiro"
          descricao="com acesso financeiro e a usuários"
          icone={icons.userTie}
          cor="cyan"
          indice={1}
        />
        <KpiCard
          titulo="Operadores"
          valor={totais.operadores}
          formato="inteiro"
          descricao="com acesso operacional"
          icone={icons.userGear}
          cor="amber"
          indice={2}
        />
        <KpiCard
          titulo="Acessos ativos"
          valor={totais.ativos}
          formato="inteiro"
          descricao={
            totais.inativos === 0
              ? "nenhum acesso desativado"
              : `${totais.inativos} ${totais.inativos === 1 ? "acesso desativado" : "acessos desativados"}`
          }
          icone={icons.userCheck}
          cor="green"
          indice={3}
        />
      </div>

      <div className={styles.filtros}>
        <div className={styles.busca}>
          <FontAwesomeIcon icon={icons.search} />
          <input
            type="search"
            placeholder="Buscar por nome ou e-mail"
            aria-label="Buscar usuário por nome ou e-mail"
            value={buscaDigitada}
            onChange={(e) => setBuscaDigitada(e.currentTarget.value)}
          />
          {buscaDigitada && (
            <button
              type="button"
              className={styles.limparBusca}
              onClick={() => setBuscaDigitada("")}
              aria-label="Limpar busca"
            >
              <FontAwesomeIcon icon={icons.close} />
            </button>
          )}
        </div>

        <div className={styles.grupo} role="group" aria-label="Filtrar por perfil">
          {(
            [
              { valor: "", rotulo: "Todos", icone: icons.users, qtd: totais.total },
              { valor: "gestor", rotulo: "Gestores", icone: icons.userTie, qtd: totais.gestores },
              {
                valor: "operador",
                rotulo: "Operadores",
                icone: icons.userGear,
                qtd: totais.operadores,
              },
            ] as const
          ).map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              className={`${styles.chip} ${perfilFiltro === opcao.valor ? styles.chipAtivo : ""}`}
              aria-pressed={perfilFiltro === opcao.valor}
              onClick={() => setPerfilFiltro(opcao.valor)}
            >
              <FontAwesomeIcon icon={opcao.icone} />
              {opcao.rotulo}
              <span className={styles.chipQtd}>{opcao.qtd}</span>
            </button>
          ))}
        </div>

        <div className={styles.grupo} role="group" aria-label="Filtrar por situação do acesso">
          {(
            [
              { valor: "todos", rotulo: "Qualquer situação" },
              { valor: "ativos", rotulo: "Ativos" },
              { valor: "inativos", rotulo: "Inativos" },
            ] as const
          ).map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              className={`${styles.chip} ${statusFiltro === opcao.valor ? styles.chipAtivo : ""}`}
              aria-pressed={statusFiltro === opcao.valor}
              onClick={() => setStatusFiltro(opcao.valor)}
            >
              {opcao.valor !== "todos" && (
                <FontAwesomeIcon
                  icon={icons.dot}
                  className={`${styles.ponto} ${opcao.valor === "ativos" ? styles.pontoVerde : styles.pontoVermelho}`}
                />
              )}
              {opcao.rotulo}
            </button>
          ))}
        </div>
      </div>

      {primeiroCarregamento && (
        <div className={styles.tabelaContainer} role="status" aria-label="Carregando usuários">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className={styles.esqueleto} style={{ "--i": i } as CSSProperties}>
              <span className={styles.esqAvatar} />
              <span className={styles.esqLinhas}>
                <i />
                <i />
              </span>
              <span className={styles.esqPilula} />
            </div>
          ))}
        </div>
      )}

      {!primeiroCarregamento && erro && (
        <div className={layout.errorBox} role="alert">
          <FontAwesomeIcon icon={icons.error} className={layout.errorIcon} />
          <p>{erro}</p>
          <button type="button" className={layout.retryBtn} onClick={recarregarTudo}>
            <FontAwesomeIcon icon={icons.retry} />
            Tentar novamente
          </button>
        </div>
      )}

      {!primeiroCarregamento && !erro && visiveis.length === 0 && (
        <div className={layout.emptyState} role="status">
          <FontAwesomeIcon icon={temFiltro ? icons.search : icons.users} className={layout.emptyIcon} />
          <p>
            {temFiltro
              ? "Nenhum usuário encontrado com esses filtros."
              : "Nenhum usuário cadastrado ainda."}
          </p>
          {temFiltro ? (
            <button type="button" className={styles.linkBtn} onClick={limparFiltros}>
              Limpar filtros
            </button>
          ) : (
            <button type="button" className={styles.linkBtn} onClick={() => setModalAberto(true)}>
              Cadastrar o primeiro usuário
            </button>
          )}
        </div>
      )}

      {!primeiroCarregamento && !erro && visiveis.length > 0 && (
        <>
          <p className={layout.resultsMeta} aria-live="polite">
            {visiveis.length} {visiveis.length === 1 ? "usuário" : "usuários"}
            {temFiltro && ` de ${totais.total}`}
            {carregando && " · atualizando…"}
          </p>

          <div className={`${styles.tabelaContainer} ${carregando ? styles.atualizando : ""}`}>
            <table className={styles.tabela} aria-label="Usuários cadastrados">
              <thead>
                <tr>
                  <th scope="col">Usuário</th>
                  <th scope="col">Perfil</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Último acesso</th>
                  <th scope="col" className={styles.colAcesso}>
                    Acesso
                  </th>
                </tr>
              </thead>

              <tbody>
                {visiveis.map((usuario, indice) => {
                  const ehVoce = usuario.id === meuId;
                  const ocupado = alternando.has(usuario.id);
                  const situacao = !usuario.ativo
                    ? "inativo"
                    : usuario.mustChangePassword
                      ? "provisoria"
                      : "ativo";

                  return (
                    <tr
                      key={usuario.id}
                      className={`${!usuario.ativo ? styles.linhaInativa : ""} ${usuario.id === novoId ? styles.linhaNova : ""
                        }`}
                      style={{ "--i": Math.min(indice, 12) } as CSSProperties}
                    >
                      <td data-label="Usuário">
                        <div className={styles.pessoa}>
                          <span
                            className={`${styles.avatar} ${usuario.perfil === "gestor" ? styles.avatarGestor : styles.avatarOperador}`}
                            aria-hidden="true"
                          >
                            {iniciais(usuario.nome)}
                          </span>
                          <span className={styles.pessoaTexto}>
                            <span className={styles.nome}>
                              {usuario.nome}
                              {ehVoce && <span className={styles.voce}>Você</span>}
                            </span>
                            <span className={styles.email}>{usuario.email}</span>
                          </span>
                        </div>
                      </td>

                      <td data-label="Perfil">
                        <select
                          className={`${styles.seletorPerfil} ${usuario.perfil === "gestor" ? styles.badgeGestor : styles.badgeOperador
                            }`}
                          value={usuario.perfil}
                          disabled={ehVoce || salvandoPerfil}
                          aria-label={`Perfil de ${usuario.nome}`}
                          title={
                            ehVoce ? "Você não pode alterar o próprio perfil." : "Alterar perfil"
                          }
                          onChange={(e) =>
                            setPendente({ usuario, novoPerfil: e.currentTarget.value as Perfil })
                          }
                        >
                          <option value="gestor">Gestor</option>
                          <option value="operador">Operador</option>
                        </select>
                      </td>

                      <td data-label="Situação">
                        <span
                          className={`${styles.status} ${styles[`status_${situacao}`]}`}
                          title={
                            situacao === "provisoria"
                              ? "Ainda não trocou a senha inicial definida no cadastro."
                              : undefined
                          }
                        >
                          <FontAwesomeIcon
                            icon={
                              situacao === "inativo"
                                ? icons.ban
                                : situacao === "provisoria"
                                  ? icons.userClock
                                  : icons.success
                            }
                          />
                          {situacao === "inativo"
                            ? "Inativo"
                            : situacao === "provisoria"
                              ? "Senha provisória"
                              : "Ativo"}
                        </span>
                      </td>

                      <td data-label="Último acesso" className={styles.acesso}>
                        {formatarUltimoAcesso(usuario.ultimoLoginEm)}
                      </td>

                      <td data-label="Acesso" className={styles.colAcesso}>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={usuario.ativo}
                          aria-label={`${usuario.ativo ? "Desativar" : "Reativar"} acesso de ${usuario.nome}`}
                          className={`${styles.chave} ${ocupado ? styles.chaveOcupada : ""}`}
                          disabled={ehVoce || ocupado}
                          title={
                            ehVoce
                              ? "Você não pode desativar o próprio usuário."
                              : usuario.ativo
                                ? "Desativar acesso"
                                : "Reativar acesso"
                          }
                          onClick={() => void alternarAtivo(usuario)}
                        >
                          <span className={styles.chaveBola}>
                            {ocupado && <FontAwesomeIcon icon={icons.spinner} spin />}
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <NovoUsuarioModal aberto={modalAberto} onClose={fecharModal} onCriado={handleCriado} />
      <ConfirmarPerfilModal
        aberto={pendente !== null}
        nome={pendente?.usuario.nome ?? ""}
        novoPerfil={pendente?.novoPerfil ?? "operador"}
        salvando={salvandoPerfil}
        onConfirmar={() => void confirmarPerfil()}
        onCancelar={() => setPendente(null)}
      />
      <Toast mensagem={toast?.mensagem ?? null} tipo={toast?.tipo} onFechar={fecharToast} />
    </section>
  );
}
