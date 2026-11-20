import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "../icons";
import { ApiRequestError } from "../../api/client";
import { usuariosApi, type Usuario } from "../../api/usuarios";
import type { Perfil } from "../../context/ProfileContext";
import { avaliarSenha, gerarSenha } from "./senha";
import styles from "./NovoUsuarioModal.module.css";

interface NovoUsuarioModalProps {
  aberto: boolean;
  onClose: () => void;
  /** Chamado assim que o cadastro é concluído (a tela recarrega a lista e destaca o novo usuário). */
  onCriado: (usuario: Usuario) => void;
}

interface Erros {
  nome?: string;
  email?: string;
  senha?: string;
}

const LIMITE_NOME = 150;
const LIMITE_EMAIL = 160;
const SENHA_MIN = 8;
const SENHA_MAX = 72;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PERFIS: { valor: Perfil; titulo: string; descricao: string; icone: typeof icons.userTie }[] = [
  {
    valor: "operador",
    titulo: "Operador",
    descricao: "Acompanha frota e motoristas, sem ver valores financeiros.",
    icone: icons.userGear,
  },
  {
    valor: "gestor",
    titulo: "Gestor",
    descricao: "Vê valores financeiros e gerencia os usuários do sistema.",
    icone: icons.userTie,
  },
];

const FOCAVEIS =
  'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function validar(nome: string, email: string, senha: string): Erros {
  const erros: Erros = {};

  if (!nome.trim()) erros.nome = "Informe o nome.";
  else if (nome.trim().length > LIMITE_NOME) erros.nome = `Use no máximo ${LIMITE_NOME} caracteres.`;

  if (!email.trim()) erros.email = "Informe o e-mail.";
  else if (!REGEX_EMAIL.test(email.trim())) erros.email = "E-mail inválido.";
  else if (email.trim().length > LIMITE_EMAIL) erros.email = `Use no máximo ${LIMITE_EMAIL} caracteres.`;

  if (!senha) erros.senha = "Informe a senha inicial.";
  else if (senha.length < SENHA_MIN) erros.senha = `A senha deve ter pelo menos ${SENHA_MIN} caracteres.`;
  else if (senha.length > SENHA_MAX) erros.senha = `A senha deve ter no máximo ${SENHA_MAX} caracteres.`;

  return erros;
}

async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

export function NovoUsuarioModal({ aberto, onClose, onCriado }: NovoUsuarioModalProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [perfil, setPerfil] = useState<Perfil>("operador");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [criado, setCriado] = useState<{ usuario: Usuario; senha: string } | null>(null);
  const [copiado, setCopiado] = useState<"senha" | "credenciais" | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const nomeRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const senhaRef = useRef<HTMLInputElement>(null);
  const concluirRef = useRef<HTMLButtonElement>(null);
  const copiadoTimer = useRef<number | undefined>(undefined);
  const resetTimer = useRef<number | undefined>(undefined);
  const uid = useId();
  const titleId = `${uid}-titulo`;
  const descId = `${uid}-desc`;

  const forca = avaliarSenha(senha);

  function reiniciar() {
    setNome("");
    setEmail("");
    setPerfil("operador");
    setSenha("");
    setVerSenha(false);
    setErros({});
    setErroGeral(null);
    setEnviando(false);
    setCriado(null);
    setCopiado(null);
  }

  // Abertura: scroll da página travado e foco no primeiro campo.
  // Ao fechar, devolve o foco para quem abriu o modal.
  useEffect(() => {
    if (!aberto) return;
    window.clearTimeout(resetTimer.current);

    const anterior = document.activeElement as HTMLElement | null;
    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const foco = window.setTimeout(() => nomeRef.current?.focus(), 60);

    return () => {
      window.clearTimeout(foco);
      document.body.style.overflow = overflowOriginal;
      anterior?.focus?.();
    };
  }, [aberto]);

  // O botão "Cadastrar" sai da tela quando o cadastro conclui; sem isso o foco cairia no
  // <body> e Esc/Tab deixariam de funcionar dentro do modal.
  const cadastroConcluido = criado !== null;
  useEffect(() => {
    if (cadastroConcluido) concluirRef.current?.focus();
  }, [cadastroConcluido]);

  useEffect(
    () => () => {
      window.clearTimeout(copiadoTimer.current);
      window.clearTimeout(resetTimer.current);
    },
    [],
  );

  /** Fecha e, depois da animação de saída, deixa o formulário limpo para a próxima abertura. */
  function fechar() {
    onClose();
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(reiniciar, 300);
  }

  function handleFechar() {
    if (enviando) return;
    fechar();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.stopPropagation();
      handleFechar();
      return;
    }
    if (e.key !== "Tab") return;

    // focus trap
    const itens = Array.from(modalRef.current?.querySelectorAll<HTMLElement>(FOCAVEIS) ?? []);
    if (itens.length === 0) {
      e.preventDefault();
      return;
    }
    const primeiro = itens[0];
    const ultimo = itens[itens.length - 1];
    const focado = document.activeElement;
    if (e.shiftKey && (focado === primeiro || focado === modalRef.current)) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && focado === ultimo) {
      e.preventDefault();
      primeiro.focus();
    }
  }

  function limparErro(campo: keyof Erros) {
    if (erros[campo]) setErros((atual) => ({ ...atual, [campo]: undefined }));
    if (erroGeral) setErroGeral(null);
  }

  function validarCampo(campo: keyof Erros) {
    const todos = validar(nome, email, senha);
    setErros((atual) => ({ ...atual, [campo]: todos[campo] }));
  }

  function handleGerarSenha() {
    setSenha(gerarSenha());
    setVerSenha(true); // quem gera a senha precisa vê-la para repassar ao usuário
    limparErro("senha");
  }

  async function marcarCopiado(tipo: "senha" | "credenciais", texto: string) {
    if (!(await copiarTexto(texto))) return;
    setCopiado(tipo);
    window.clearTimeout(copiadoTimer.current);
    copiadoTimer.current = window.setTimeout(() => setCopiado(null), 2200);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;

    const encontrados = validar(nome, email, senha);
    setErros(encontrados);
    setErroGeral(null);

    if (encontrados.nome) return nomeRef.current?.focus();
    if (encontrados.email) return emailRef.current?.focus();
    if (encontrados.senha) return senhaRef.current?.focus();

    setEnviando(true);
    try {
      const usuario = await usuariosApi.criar({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        perfil,
      });
      setCriado({ usuario, senha });
      onCriado(usuario);
    } catch (falha) {
      if (falha instanceof ApiRequestError && falha.status === 409) {
        setErros((atual) => ({ ...atual, email: falha.message }));
        emailRef.current?.focus();
      } else if (falha instanceof ApiRequestError && falha.status === 403) {
        setErroGeral("Somente gestores podem cadastrar usuários.");
      } else {
        setErroGeral(
          falha instanceof ApiRequestError
            ? falha.message
            : "Não foi possível cadastrar o usuário. Verifique sua conexão.",
        );
      }
    } finally {
      setEnviando(false);
    }
  }

  function cadastrarOutro() {
    reiniciar();
    window.setTimeout(() => nomeRef.current?.focus(), 60);
  }

  const textoCredenciais = criado
    ? `NEWELOG — acesso\nE-mail: ${criado.usuario.email}\nSenha inicial: ${criado.senha}`
    : "";

  return (
    <>
      <div
        className={`${styles.scrim} ${aberto ? styles.show : ""}`}
        onClick={handleFechar}
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        className={`${styles.modal} ${aberto ? styles.show : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        inert={!aberto}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.head}>
          <span className={styles.headIcon} aria-hidden="true">
            <FontAwesomeIcon icon={criado ? icons.userCheck : icons.userPlus} />
          </span>

          <div className={styles.headText}>
            <h3 id={titleId}>{criado ? "Usuário cadastrado" : "Novo usuário"}</h3>
            <p id={descId} className={styles.subtitle}>
              {criado
                ? "Repasse o acesso ao usuário com segurança."
                : "Cadastre quem vai acessar o NEWELOG e defina o que ele pode ver."}
            </p>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={handleFechar}
            disabled={enviando}
            aria-label="Fechar"
          >
            <FontAwesomeIcon icon={icons.close} />
          </button>
        </div>

        {criado ? (
          <div className={styles.body}>
            <div className={styles.sucesso} aria-live="polite">
              <span className={styles.sucessoIcone} aria-hidden="true">
                <FontAwesomeIcon icon={icons.check} />
              </span>
              <p className={styles.sucessoTitulo}>
                {criado.usuario.nome.split(" ")[0]} já pode acessar o sistema
              </p>
            </div>

            <dl className={styles.credenciais}>
              <div>
                <dt>Nome</dt>
                <dd>{criado.usuario.nome}</dd>
              </div>
              <div>
                <dt>E-mail</dt>
                <dd>{criado.usuario.email}</dd>
              </div>
              <div>
                <dt>Perfil</dt>
                <dd>{criado.usuario.perfil === "gestor" ? "Gestor" : "Operador"}</dd>
              </div>
              <div>
                <dt>Senha inicial</dt>
                <dd className={styles.senhaLinha}>
                  <code>{criado.senha}</code>
                  <button
                    type="button"
                    className={styles.miniBtn}
                    onClick={() => marcarCopiado("senha", criado.senha)}
                    aria-label="Copiar senha"
                  >
                    <FontAwesomeIcon icon={copiado === "senha" ? icons.check : icons.copy} />
                    {copiado === "senha" ? "Copiada" : "Copiar"}
                  </button>
                </dd>
              </div>
            </dl>

            <p className={styles.hint}>
              <FontAwesomeIcon icon={icons.shield} />
              <span>
                Esta é a única vez que a senha aparece. Depois de fechar, ela não poderá ser
                consultada novamente.
              </span>
            </p>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => marcarCopiado("credenciais", textoCredenciais)}
              >
                <FontAwesomeIcon icon={copiado === "credenciais" ? icons.check : icons.copy} />
                {copiado === "credenciais" ? "Copiado" : "Copiar acesso"}
              </button>
              <button type="button" className={styles.secondaryBtn} onClick={cadastrarOutro}>
                <FontAwesomeIcon icon={icons.userPlus} />
                Cadastrar outro
              </button>
              <button
                ref={concluirRef}
                type="button"
                className={styles.primaryBtn}
                onClick={fechar}
              >
                Concluir
              </button>
            </div>
          </div>
        ) : (
          <form className={styles.body} onSubmit={handleSubmit} noValidate>
            {erroGeral && (
              <div className={styles.erroGeral} role="alert">
                <FontAwesomeIcon icon={icons.error} />
                <span>{erroGeral}</span>
              </div>
            )}

            <div className={styles.field}>
              <label htmlFor={`${uid}-nome`}>Nome completo</label>
              <div className={styles.control} data-invalid={!!erros.nome}>
                <FontAwesomeIcon icon={icons.idCard} />
                <input
                  ref={nomeRef}
                  id={`${uid}-nome`}
                  type="text"
                  autoComplete="off"
                  placeholder="Ex.: Maria Souza"
                  maxLength={LIMITE_NOME + 20}
                  value={nome}
                  onChange={(ev) => {
                    setNome(ev.currentTarget.value);
                    limparErro("nome");
                  }}
                  onBlur={() => nome && validarCampo("nome")}
                  aria-invalid={!!erros.nome}
                  aria-describedby={erros.nome ? `${uid}-nome-err` : undefined}
                />
              </div>
              {erros.nome && (
                <p id={`${uid}-nome-err`} className={styles.erro} role="alert">
                  {erros.nome}
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor={`${uid}-email`}>E-mail</label>
              <div className={styles.control} data-invalid={!!erros.email}>
                <FontAwesomeIcon icon={icons.mail} />
                <input
                  ref={emailRef}
                  id={`${uid}-email`}
                  type="email"
                  autoComplete="off"
                  placeholder="nome@empresa.com"
                  value={email}
                  onChange={(ev) => {
                    setEmail(ev.currentTarget.value);
                    limparErro("email");
                  }}
                  onBlur={() => email && validarCampo("email")}
                  aria-invalid={!!erros.email}
                  aria-describedby={erros.email ? `${uid}-email-err` : undefined}
                />
              </div>
              {erros.email && (
                <p id={`${uid}-email-err`} className={styles.erro} role="alert">
                  {erros.email}
                </p>
              )}
            </div>

            <fieldset className={styles.perfis}>
              <legend>Perfil de acesso</legend>
              <div className={styles.perfisGrid}>
                {PERFIS.map((opcao) => (
                  <label
                    key={opcao.valor}
                    className={styles.perfilCard}
                    data-checked={perfil === opcao.valor}
                  >
                    <input
                      type="radio"
                      name={`${uid}-perfil`}
                      value={opcao.valor}
                      checked={perfil === opcao.valor}
                      onChange={() => setPerfil(opcao.valor)}
                    />
                    <span className={styles.perfilIcone} aria-hidden="true">
                      <FontAwesomeIcon icon={opcao.icone} />
                    </span>
                    <span className={styles.perfilTitulo}>{opcao.titulo}</span>
                    <span className={styles.perfilDesc}>{opcao.descricao}</span>
                    <span className={styles.perfilCheck} aria-hidden="true">
                      <FontAwesomeIcon icon={icons.check} />
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className={styles.field}>
              <label htmlFor={`${uid}-senha`}>Senha inicial</label>
              <div className={styles.senhaRow}>
                <div className={`${styles.control} ${styles.senhaControl}`} data-invalid={!!erros.senha}>
                  <FontAwesomeIcon icon={icons.lock} />
                  <input
                    ref={senhaRef}
                    id={`${uid}-senha`}
                    type={verSenha ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder={`Mín. ${SENHA_MIN} caracteres`}
                    value={senha}
                    onChange={(ev) => {
                      setSenha(ev.currentTarget.value);
                      limparErro("senha");
                    }}
                    onBlur={() => senha && validarCampo("senha")}
                    aria-invalid={!!erros.senha}
                    aria-describedby={`${uid}-senha-info`}
                  />
                  <button
                    type="button"
                    className={styles.eye}
                    onClick={() => setVerSenha((v) => !v)}
                    aria-label={verSenha ? "Ocultar senha" : "Mostrar senha"}
                    aria-pressed={verSenha}
                  >
                    <FontAwesomeIcon icon={verSenha ? icons.eyeSlash : icons.eye} />
                  </button>
                </div>

                <button type="button" className={styles.gerarBtn} onClick={handleGerarSenha}>
                  <FontAwesomeIcon icon={icons.magic} />
                  Gerar
                </button>
              </div>

              <div id={`${uid}-senha-info`}>
                {erros.senha ? (
                  <p className={styles.erro} role="alert">
                    {erros.senha}
                  </p>
                ) : (
                  <div className={styles.forca} data-nivel={forca.nivel} aria-live="polite">
                    <span className={styles.forcaBarra} aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className={styles.forcaTexto}>
                      {forca.rotulo ? `Senha ${forca.rotulo.toLowerCase()}` : "Use a opção Gerar para criar uma senha forte."}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={handleFechar}
                disabled={enviando}
              >
                Cancelar
              </button>
              <button type="submit" className={styles.primaryBtn} disabled={enviando}>
                <FontAwesomeIcon
                  icon={enviando ? icons.spinner : icons.userPlus}
                  spin={enviando}
                />
                {enviando ? "Cadastrando…" : "Cadastrar usuário"}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
