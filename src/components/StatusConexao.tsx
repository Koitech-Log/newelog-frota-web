import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "./icons";
import styles from "./StatusConexao.module.css";

type Estado = "online" | "offline" | "voltou";

/** Faixa discreta no topo avisando quando a conexão cai e quando ela volta. */
export function StatusConexao() {
  const [estado, setEstado] = useState<Estado>(() => (navigator.onLine ? "online" : "offline"));

  useEffect(() => {
    let timer: number | undefined;
    const aoCair = () => {
      window.clearTimeout(timer);
      setEstado("offline");
    };
    const aoVoltar = () => {
      setEstado("voltou");
      timer = window.setTimeout(() => setEstado("online"), 3000);
    };
    window.addEventListener("offline", aoCair);
    window.addEventListener("online", aoVoltar);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("offline", aoCair);
      window.removeEventListener("online", aoVoltar);
    };
  }, []);

  if (estado === "online") return null;

  const offline = estado === "offline";
  return (
    <div
      className={`${styles.faixa} ${offline ? styles.offline : styles.voltou}`}
      role={offline ? "alert" : "status"}
    >
      <FontAwesomeIcon icon={offline ? icons.error : icons.wifi} aria-hidden />
      {offline
        ? "Sem conexão com a internet. Algumas ações ficam indisponíveis até a conexão voltar."
        : "Conexão restabelecida."}
    </div>
  );
}
