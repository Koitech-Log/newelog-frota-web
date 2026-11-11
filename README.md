# newelog-frota-web

> Projeto Integrador 3º Semestre · DSM · FATEC São José dos Campos · Equipe **Koitech-Log** · Cliente **NEWE Logística Integrada**
>
> [Repositório principal](https://github.com/Koitech-Log/Koitech-Log-3DSM-Newelog) · [Documentação do projeto](https://github.com/Koitech-Log/Documentos) · [auth-service](https://github.com/Koitech-Log/newelog-auth-service) · [motoristas-service](https://github.com/Koitech-Log/newelog-motoristas-service) · [manifesto-service](https://github.com/Koitech-Log/newelog-manifesto-service)

Front-end do NEWELOG em React + TypeScript + Vite. Tem o login, a **Visão geral** (dashboard financeiro, só para o gestor), a tela de **Motoristas** e a **importação de CSV** (manifesto e veículos). Consome o `auth-service`, o `motoristas-service` e o `manifesto-service`.

## Funcionalidades

| Sprint | Funcionalidade |
| :--- | :--- |
| 1 | **Motoristas:** grade paginada de cards, filtros (status, tipo de veículo, busca por nome/CPF e destino), drawer de detalhe e troca de status (Disponível / Em operação) |
| 1 | **Importação de manifesto (CSV):** modal de arrastar e soltar, resumo da importação e alerta de motoristas com cadastro pendente |
| 2 | **Login:** e-mail e senha no `auth-service`, opção "Manter conectado" e botão Sair |
| 2 | **Perfis Gestor / Operador:** o perfil vem do token. O operador não vê a Visão geral nem os valores financeiros do drawer |
| 2 | **Visão geral (dashboard financeiro):** fretes, custos, rentabilidade total e média por viagem, viagens, margem, destaques, frota e cadastro, composição do frete e comparativo de rentabilidade por motorista e por veículo. Navegação mês a mês, comparação com o mês anterior e atualização automática a cada 60 s |
| 2 | **Importação de veículos (CSV):** no mesmo modal, com seletor Manifesto / Veículos e tabela dos erros por linha |
| 2 | **Exportar CSV:** resumo do dashboard e comparativo de rentabilidade |
| — | Tema claro/escuro e layout responsivo (a Sidebar vira menu lateral em telas de até 900px) |

## Stack

- React 19 + TypeScript 7
- Vite 8 (dev server e build)
- FontAwesome para os ícones
- oxlint para lint (`npm run lint`)
- CSS Modules (sem framework de UI), com animações que respeitam `prefers-reduced-motion`

## Rodando localmente

Pré-requisitos (veja o README de cada serviço):

- `auth-service` em `http://localhost:8082` (login);
- `motoristas-service` em `http://localhost:8080`;
- `manifesto-service` em `http://localhost:8081` (importações de CSV).

```bash
npm install
cp .env.example .env
npm run dev
```

Abre em `http://localhost:5173`. Entre com o gestor inicial configurado no `auth-service` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).

### Variáveis de ambiente

| Variável | Padrão | Descrição |
| :--- | :--- | :--- |
| `VITE_AUTH_SERVICE_URL` | `http://localhost:8082` | URL base do `auth-service` |
| `VITE_API_BASE_URL` | `http://localhost:8080` | URL base do `motoristas-service` |
| `VITE_MANIFESTO_SERVICE_URL` | `http://localhost:8081` | URL base do `manifesto-service` |

> O Vite embute as variáveis `VITE_*` **no build**. Ao hospedar, defina-as no ambiente de build.

## Build de produção

```bash
npm run build
npm run preview
```

## Estrutura

```text
src/
├── api/          → cliente HTTP (client.ts), sessão (session.ts) e chamadas por serviço
│                   (auth.ts, motoristas.ts, dashboard.ts, manifesto.ts, veiculos.ts)
├── types/        → tipos espelhando os DTOs dos back-ends (motorista, manifesto, veiculo)
├── context/      → AuthContext (sessão), ProfileContext (perfil do token), ThemeContext,
│                   FrotaContext (totais da frota), ImportCsvContext e ImportManifestoContext
├── hooks/        → useMotoristas, useMotoristaDetalhe, useDashboard,
│                   useImportarManifesto, useImportarVeiculos
├── components/   → DriverCard, DriverFilters, DriverDrawer, RentabilidadeMedia, Pagination,
│                   Toast, ThemeToggle, dashboard/ (cards e seções da Visão geral),
│                   ImportCsv/ e SeletorImportacao/ (modal de importação),
│                   Alert/ (avisos de importação) e Sidebar/
├── pages/        → LoginPage, DashboardPage, DriversPage
└── utils/        → formatadores, exportação CSV, cálculo de variação
```

### Sessão e perfil

O login chama `POST /api/auth/login` e guarda token, nome e perfil no `sessionStorage`, ou no `localStorage` quando "Manter conectado" está marcado. O `ProfileContext` lê o perfil da sessão. Com perfil **Operador**, a Visão geral não aparece e a seção "Resultado financeiro" do drawer some inteira, em vez de aparecer mascarada. Ao sair ou trocar de usuário, o estado da área logada é refeito do zero.

### Tema claro/escuro

O `ThemeContext` aplica o tema pelo atributo `data-theme` na raiz; os tokens de cor ficam em `src/index.css`. Na primeira visita segue o sistema operacional (`prefers-color-scheme`). Depois a escolha fica salva no `localStorage` (chave `newelog:tema`).

## Importação de CSV

Aberta pelo item "Importar CSV" da Sidebar ou pelo botão da barra superior no mobile. O seletor no topo do modal escolhe entre **Manifesto** e **Veículos**. Só arquivos `.csv` são aceitos, e o envio vai ao `manifesto-service` via `multipart/form-data`, no campo `file`.

- **Manifesto:** mostra o total processado, cadastrado e rejeitado e a lista de motoristas novos (cadastro pendente). Com motoristas novos, o resultado aparece como "atenção"; sem eles, como "sucesso".
- **Veículos:** mostra cadastrados, atualizados e rejeitados, e uma tabela com a linha, o campo e o motivo de cada erro.

Depois de uma importação bem-sucedida, a lista de motoristas, os totais da frota e o dashboard são recarregados. As regras de leitura e cadastro ficam nos back-ends; o front-end envia o arquivo e exibe o resultado.

## Contrato com o back-end

Os tipos em `src/types/` espelham os DTOs Java. Se o contrato de algum back-end mudar, esses arquivos são o primeiro lugar a atualizar.

| Serviço | Método | Rota | Uso neste front-end |
| :--- | :--- | :--- | :--- |
| `auth-service` | POST | `/api/auth/login` | Tela de login |
| `motoristas-service` | GET | `/api/motoristas?status=&busca=&destino=&page=&size=` | Grade de cards da tela de Motoristas (o filtro de tipo de veículo é aplicado no front-end) |
| `motoristas-service` | GET | `/api/motoristas/{id}` | Drawer de detalhe |
| `motoristas-service` | PATCH | `/api/motoristas/{id}/status` | Botões "Disponível" / "Em operação" |
| `motoristas-service` | GET | `/api/dashboard?ano=&mes=` | Cards de fretes, custos e rentabilidade |
| `motoristas-service` | GET | `/api/dashboard/rentabilidade-media?ano=&mes=` | Rentabilidade média e comparativo por motorista/veículo |
| `manifesto-service` | POST | `/manifestos/upload` | Importação de manifesto |
| `manifesto-service` | POST | `/veiculos/upload` | Importação de veículos |

Todas as chamadas, exceto o login, enviam `Authorization: Bearer <token>`.
