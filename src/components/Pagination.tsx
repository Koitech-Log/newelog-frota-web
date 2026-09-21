import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import styles from "./Pagination.module.css";

interface PaginationProps {
  /** 0-indexed, igual ao contrato da API (Spring Data Pageable). */
  paginaAtual: number;
  totalPaginas: number;
  onMudarPagina: (pagina: number) => void;
}

export function Pagination({ paginaAtual, totalPaginas, onMudarPagina }: PaginationProps) {
  if (totalPaginas <= 1) return null;

  // janela de páginas ao redor da atual + primeira e última, com reticências
  // nos vãos — mesmo padrão usado no protótipo HTML de referência.
  const paginasVisiveis = new Set(
    [0, totalPaginas - 1, paginaAtual - 1, paginaAtual, paginaAtual + 1].filter(
      (p) => p >= 0 && p < totalPaginas
    )
  );
  const ordenadas = Array.from(paginasVisiveis).sort((a, b) => a - b);

  function irPara(pagina: number) {
    onMudarPagina(pagina);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  let anterior: number | null = null;
  const itens: React.ReactNode[] = [];
  ordenadas.forEach((pagina) => {
    if (anterior !== null && pagina - anterior > 1) {
      itens.push(
        <span key={`gap-${pagina}`} className={styles.ellipsis}>
          …
        </span>
      );
    }
    itens.push(
      <button
        key={pagina}
        type="button"
        className={`${styles.pageBtn} ${pagina === paginaAtual ? styles.active : ""}`}
        onClick={() => irPara(pagina)}
        aria-current={pagina === paginaAtual ? "page" : undefined}
      >
        {pagina + 1}
      </button>
    );
    anterior = pagina;
  });

  return (
    <nav className={styles.pagination} aria-label="Paginação de motoristas">
      <button
        type="button"
        className={styles.pageBtn}
        disabled={paginaAtual <= 0}
        onClick={() => irPara(paginaAtual - 1)}
        aria-label="Página anterior"
      >
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>

      {itens}

      <button
        type="button"
        className={styles.pageBtn}
        disabled={paginaAtual >= totalPaginas - 1}
        onClick={() => irPara(paginaAtual + 1)}
        aria-label="Próxima página"
      >
        <FontAwesomeIcon icon={faChevronRight} />
      </button>
    </nav>
  );
}
