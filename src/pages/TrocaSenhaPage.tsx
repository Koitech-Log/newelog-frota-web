import { useId, useRef, useState, type FormEvent, type Ref } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { icons } from '../components/icons';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { AuthError } from '../api/auth';
import logoBranco from '../assets/newe-logo-branco.png';
import styles from './LoginPage.module.css';

// Mesmas regras do auth-service (AlterarSenhaRequestDTO).
const MIN = 8;
const MAX = 72;

interface Errors {
  atual?: string;
  nova?: string;
  confirmacao?: string;
}

interface CampoProps {
  id: string;
  label: string;
  valor: string;
  erro?: string;
  visivel: boolean;
  autoComplete: string;
  desabilitado: boolean;
  inputRef?: Ref<HTMLInputElement>;
  autoFocus?: boolean;
  onChange: (valor: string) => void;
}

function Campo({
  id, label, valor, erro, visivel, autoComplete, desabilitado, inputRef, autoFocus, onChange,
}: CampoProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.control} data-invalid={!!erro}>
        <FontAwesomeIcon icon={icons.lock} className={styles.lead} />
        <input
          ref={inputRef}
          id={id}
          type={visivel ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={valor}
          readOnly={desabilitado}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!erro}
          aria-describedby={erro ? `${id}-err` : undefined}
        />
      </div>
      {erro && (
        <span id={`${id}-err`} className={styles.error}>
          {erro}
        </span>
      )}
    </div>
  );
}

export function TrocaSenhaPage() {
  const { sessao, trocarSenha, signOut } = useAuth();
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [visivel, setVisivel] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const atualRef = useRef<HTMLInputElement>(null);
  const uid = useId();

  function validate(): Errors {
    const e: Errors = {};
    if (!atual) e.atual = 'Informe a senha inicial.';
    if (!nova) e.nova = 'Informe a nova senha.';
    else if (nova.length < MIN || nova.length > MAX) {
      e.nova = `A nova senha deve ter entre ${MIN} e ${MAX} caracteres.`;
    } else if (nova === atual) {
      e.nova = 'A nova senha deve ser diferente da senha inicial.';
    }
    if (!confirmacao) e.confirmacao = 'Repita a nova senha.';
    else if (confirmacao !== nova) e.confirmacao = 'As senhas não conferem.';
    return e;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (loading) return;
    setFormError('');
    const e = validate();
    setErrors(e);
    if (e.atual || e.nova || e.confirmacao) return;

    setLoading(true);
    try {
      // em caso de sucesso o AuthContext desliga a flag e o Gate libera a área logada
      await trocarSenha(atual, nova);
    } catch (err) {
      setFormError(err instanceof AuthError ? err.message : 'Algo deu errado. Tente novamente.');
      if (err instanceof AuthError && err.status === 400) atualRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page} data-loading={loading}>
      <aside className={styles.brand}>
        <img
          className={styles.logo}
          src={logoBranco}
          alt="NEWE Logística Integrada"
          width={160}
          height={38}
        />
        <div className={styles.foot}>
          <p className={styles.tagline}>Cada viagem, do manifesto à entrega, em um só lugar.</p>
        </div>
      </aside>

      <section className={styles.panel}>
        <div className={styles.theme}>
          <ThemeToggle label="Tema" />
        </div>

        <div className={styles.card}>
          <div className={styles.bar} data-active={loading} aria-hidden="true" />

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.head}>
              <h1 className={styles.title}>Defina uma nova senha</h1>
              <p className={styles.subtitle}>
                {sessao?.nome ? `Olá, ${sessao.nome}. ` : ''}
                Por segurança, troque a senha inicial para continuar.
              </p>
            </div>

            {formError && (
              <div className={styles.alert} role="alert">
                <FontAwesomeIcon icon={icons.warning} /> {formError}
              </div>
            )}

            <Campo
              id={`${uid}-atual`}
              label="Senha inicial"
              valor={atual}
              erro={errors.atual}
              visivel={visivel}
              autoComplete="current-password"
              desabilitado={loading}
              inputRef={atualRef}
              autoFocus
              onChange={(v) => {
                setAtual(v);
                if (errors.atual) setErrors((a) => ({ ...a, atual: undefined }));
              }}
            />
            <Campo
              id={`${uid}-nova`}
              label="Nova senha"
              valor={nova}
              erro={errors.nova}
              visivel={visivel}
              autoComplete="new-password"
              desabilitado={loading}
              onChange={(v) => {
                setNova(v);
                if (errors.nova) setErrors((a) => ({ ...a, nova: undefined }));
              }}
            />
            <Campo
              id={`${uid}-confirmacao`}
              label="Repita a nova senha"
              valor={confirmacao}
              erro={errors.confirmacao}
              visivel={visivel}
              autoComplete="new-password"
              desabilitado={loading}
              onChange={(v) => {
                setConfirmacao(v);
                if (errors.confirmacao) setErrors((a) => ({ ...a, confirmacao: undefined }));
              }}
            />

            <div className={styles.row}>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={visivel}
                  onChange={(e) => setVisivel(e.target.checked)}
                />
                Mostrar senhas
              </label>
            </div>

            <button className={styles.submit} type="submit" disabled={loading}>
              {loading ? (
                <>
                  <FontAwesomeIcon icon={icons.spinner} spin /> Salvando…
                </>
              ) : (
                <>
                  Trocar senha e continuar <FontAwesomeIcon icon={icons.signIn} className={styles.arrow} />
                </>
              )}
            </button>

            <p className={styles.help}>
              <button
                type="button"
                onClick={signOut}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  font: 'inherit',
                  color: 'inherit',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                Sair
              </button>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}