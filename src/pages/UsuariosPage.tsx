import { useState } from "react";
import type { Perfil } from "../context/ProfileContext";
import { useUsuarios } from "../hooks/useUsuarios";
import layout from "./DriversPage.module.css";
import styles from "./UsuariosPage.module.css";

export function UsuariosPage() {
  const [busca, setBusca] = useState("");
  const [perfil, setPerfil] = useState<Perfil | "">("");
  const { usuarios, carregando, erro, recarregar } = useUsuarios(busca, perfil);

  return (
    <section className={layout.page}>
      <span className={layout.eyebrow}>Administração</span>
      <h1 className={layout.title}>Usuários</h1>
      <p className={layout.subtitle}>
        Busque usuários por nome ou e-mail e filtre pelo perfil.
      </p>

      <div className={styles.filtros}>
        <label>
          Buscar usuário
          <input
            type="search"
            placeholder="Nome ou e-mail"
            value={busca}
            onChange={(event) => setBusca(event.currentTarget.value)}
          />
        </label>

        <label>
          Perfil
          <select
            value={perfil}
            onChange={(event) => {
              const valor = event.currentTarget.value;
              setPerfil(valor === "gestor" || valor === "operador" ? valor : "");
            }}
          >
            <option value="">Todos</option>
            <option value="gestor">Gestor</option>
            <option value="operador">Operador</option>
          </select>
        </label>
      </div>

      {carregando && (
        <p className={layout.loading} role="status">
          Carregando usuários…
        </p>
      )}

      {!carregando && erro && (
        <div className={layout.errorBox} role="alert">
          <p>{erro}</p>
          <button
            type="button"
            className={layout.retryBtn}
            onClick={recarregar}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!carregando && !erro && usuarios.length === 0 && (
        <p className={layout.emptyState} role="status">
          Nenhum usuário encontrado.
        </p>
      )}

      {!carregando && !erro && usuarios.length > 0 && (
        <div className={styles.tabelaContainer}>
          <table className={styles.tabela} aria-label="Usuários cadastrados">
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">E-mail</th>
                <th scope="col">Perfil</th>
              </tr>
            </thead>

            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td>{usuario.nome}</td>
                  <td>{usuario.email}</td>
                  <td>{usuario.perfil === "gestor" ? "Gestor" : "Operador"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}