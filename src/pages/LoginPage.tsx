import {
  useEffect,
  useId,
  useRef,
  useState,
  type AnimationEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { icons } from '../components/icons';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { AuthError } from '../api/auth';
import logoBranco from '../assets/newe-logo-branco.png';
import styles from './LoginPage.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_KEY = 'newelog:ultimo-email';
const ANO_ATUAL = new Date().getFullYear();

interface Errors {
  email?: string;
  senha?: string;
}

function lerEmailSalvo(): string {
  try {
    return window.localStorage.getItem(EMAIL_KEY) ?? '';
  } catch {
    return '';
  }
}

function gravarEmail(email: string | null) {
  try {
    if (email) window.localStorage.setItem(EMAIL_KEY, email);
    else window.localStorage.removeItem(EMAIL_KEY);
  } catch {
    // armazenamento indisponível: segue sem lembrar o e-mail
  }
}

function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const ligar = () => setOnline(true);
    const desligar = () => setOnline(false);
    window.addEventListener('online', ligar);
    window.addEventListener('offline', desligar);
    return () => {
      window.removeEventListener('online', ligar);
      window.removeEventListener('offline', desligar);
    };
  }, []);
  return online;
}

export function LoginPage() {
  const { signIn, aviso } = useAuth();
  const [emailSalvo] = useState(lerEmailSalvo);
  const [email, setEmail] = useState(emailSalvo);
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(true);
  const [verSenha, setVerSenha] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [jaEnviou, setJaEnviou] = useState(false);
  const [tremer, setTremer] = useState(false);
  const online = useOnline();
  const emailRef = useRef<HTMLInputElement>(null);
  const senhaRef = useRef<HTMLInputElement>(null);
  const uid = useId();

  const emailValido = EMAIL_RE.test(email.trim());

  function validate(): Errors {
    const e: Errors = {};
    if (!email.trim()) e.email = 'Informe seu e-mail.';
    else if (!EMAIL_RE.test(email.trim())) e.email = 'Esse e-mail parece incompleto.';
    if (!senha) e.senha = 'Informe sua senha.';
    return e;
  }

  function handleEmailBlur() {
    if (email.trim() && !emailValido) {
      setErrors((atual) => ({ ...atual, email: 'Esse e-mail parece incompleto.' }));
    }
  }

  function handleTeclaSenha(ev: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(ev.getModifierState('CapsLock'));
  }

  function handleFimAnimacao(ev: AnimationEvent<HTMLFormElement>) {
    // animationend de filhos (ex.: alerta) também sobe até o form
    if (ev.target === ev.currentTarget) setTremer(false);
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (loading) return;
    setFormError('');
    const e = validate();
    setErrors(e);
    if (e.email || e.senha) {
      setTremer(true);
      if (e.email) emailRef.current?.focus();
      else senhaRef.current?.focus();
      return;
    }

    setLoading(true);
    setJaEnviou(true);
    try {
      await signIn(email, senha, lembrar);
      gravarEmail(lembrar ? email.trim() : null);
    } catch (err) {
      setFormError(err instanceof AuthError ? err.message : 'Algo deu errado. Tente novamente.');
      setTremer(true);
      if (err instanceof AuthError && err.status === 401) {
        setSenha('');
        senhaRef.current?.focus();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page} data-loading={loading} data-ran={jaEnviou}>
      <aside className={styles.brand}>
        <img
          className={styles.logo}
          src={logoBranco}
          alt="NEWE Logística Integrada"
          width={160}
          height={38}
        />

        <div className={styles.route} aria-hidden="true">
          <div className={styles.stop}>
            <strong>Origem</strong>
            <span>São José dos Campos</span>
          </div>
          <div className={styles.stop}>
            <strong>Manifesto</strong>
            <span>Importação por CSV</span>
          </div>
          <div className={styles.stop}>
            <strong>Destino</strong>
            <span>Entrega ao cliente</span>
          </div>
          <span className={styles.truck}>
            <FontAwesomeIcon icon={icons.truckFast} />
          </span>
        </div>

        <div className={styles.foot}>
          <p className={styles.tagline}>Cada viagem, do manifesto à entrega, em um só lugar.</p>
          <p className={styles.copy}>© {ANO_ATUAL} NEWE Logística Integrada</p>
        </div>
      </aside>

      <section className={styles.panel}>
        <div className={styles.theme}>
          <ThemeToggle label="Tema" />
        </div>

        <div className={styles.card}>
          <div className={styles.bar} data-active={loading} aria-hidden="true" />

          <form
            className={`${styles.form} ${tremer ? styles.shake : ''}`}
            onSubmit={handleSubmit}
            onAnimationEnd={handleFimAnimacao}
            noValidate
          >
            <div className={styles.head}>
              <h1 className={styles.title}>Entrar no Newelog</h1>
              <p className={styles.subtitle}>Use o e-mail cadastrado pela NEWE Logística.</p>
            </div>

            {!online && (
              <div className={styles.notice} role="status">
                <FontAwesomeIcon icon={icons.warning} /> Você está sem conexão. Reconecte para entrar.
              </div>
            )}

            {aviso && !formError && (
              <div className={styles.notice} role="status">
                {aviso}
              </div>
            )}

            {formError && (
              <div className={styles.alert} role="alert">
                <FontAwesomeIcon icon={icons.warning} /> {formError}
              </div>
            )}

            <div className={styles.field}>
              <label htmlFor={`${uid}-email`}>E-mail</label>
              <div className={styles.control} data-invalid={!!errors.email}>
                <FontAwesomeIcon icon={icons.mail} className={styles.lead} />
                <input
                  ref={emailRef}
                  id={`${uid}-email`}
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  placeholder="nome@empresa.com.br"
                  value={email}
                  readOnly={loading}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((atual) => ({ ...atual, email: undefined }));
                  }}
                  onBlur={handleEmailBlur}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? `${uid}-email-err` : undefined}
                  autoFocus={!emailSalvo}
                />
                {emailValido && !errors.email && (
                  <FontAwesomeIcon icon={icons.success} className={styles.valid} aria-hidden="true" />
                )}
              </div>
              {errors.email && (
                <span id={`${uid}-email-err`} className={styles.error}>
                  {errors.email}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor={`${uid}-senha`}>Senha</label>
              <div className={styles.control} data-invalid={!!errors.senha}>
                <FontAwesomeIcon icon={icons.lock} className={styles.lead} />
                <input
                  ref={senhaRef}
                  id={`${uid}-senha`}
                  type={verSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  value={senha}
                  readOnly={loading}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    if (errors.senha) setErrors((atual) => ({ ...atual, senha: undefined }));
                  }}
                  onKeyDown={handleTeclaSenha}
                  onKeyUp={handleTeclaSenha}
                  onBlur={() => setCapsLock(false)}
                  aria-invalid={!!errors.senha}
                  aria-describedby={errors.senha ? `${uid}-senha-err` : undefined}
                  autoFocus={!!emailSalvo}
                />
                <button
                  type="button"
                  className={styles.eye}
                  onClick={() => setVerSenha((v) => !v)}
                  aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={verSenha}
                >
                  <FontAwesomeIcon icon={verSenha ? icons.eyeSlash : icons.eye} />
                </button>
              </div>
              {errors.senha && (
                <span id={`${uid}-senha-err`} className={styles.error}>
                  {errors.senha}
                </span>
              )}
              {capsLock && (
                <span className={styles.caps} role="status">
                  <FontAwesomeIcon icon={icons.warning} /> Caps Lock ativado
                </span>
              )}
            </div>

            <div className={styles.row}>
              <label className={styles.check}>
                <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} />
                Manter conectado
              </label>
            </div>

            <button className={styles.submit} type="submit" disabled={loading}>
              {loading ? (
                <>
                  <FontAwesomeIcon icon={icons.spinner} spin /> Entrando…
                </>
              ) : (
                <>
                  Entrar <FontAwesomeIcon icon={icons.signIn} className={styles.arrow} />
                </>
              )}
            </button>

            <p className={styles.help}>
              <FontAwesomeIcon icon={icons.info} /> Problemas para entrar? Fale com um gestor.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
