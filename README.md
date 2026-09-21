# motoristas-web

Front-end da tela de Motoristas — React + TypeScript + Vite, consumindo o
[`motoristas-service`](../motoristas-service) real. Demais telas do produto
(Home, Frota, Ranking, importação de manifesto) ainda não têm back-end pronto
e ficam fora desta primeira versão — ver documento "Adendo: Decomposição em
Microsserviços".

## Stack

- React 19.3 + TypeScript 7
- Vite 8 (dev server e build)
- FontAwesome (`@fortawesome/react-fontawesome`) para os ícones
- CSS Modules (sem framework de UI — a paleta e os componentes espelham o
  protótipo visual já validado com o parceiro), com animações de entrada e
  microinterações (cards escalonados, medidor radial que "enche" ao carregar,
  transições em foco/hover/clique). Tudo respeita `prefers-reduced-motion`.

## Rodando localmente

Pré-requisito: o `motoristas-service` rodando em `http://localhost:8080`
(ver README daquele repositório).

```bash
npm install
cp .env.example .env
npm run dev
```

Abre em `http://localhost:5173`.

## Build de produção

```bash
npm run build
npm run preview
```

## Estrutura

```
src/
├── api/          → cliente HTTP tipado (client.ts) e chamadas específicas (motoristas.ts)
├── types/        → tipos espelhando os DTOs Java do motoristas-service
├── context/      → ProfileContext (perfil Gestor/Operador ativo em toda a árvore)
├── hooks/        → useMotoristas (listagem + filtros), useMotoristaDetalhe (drawer)
├── components/   → DriverCard, DriverFilters, DriverDrawer, RadialGauge, Pagination,
│                   Toast e Sidebar/ (navegação + troca de perfil)
└── pages/        → DriversPage (única página desta versão)
```

### Perfil Gestor/Operador

A Sidebar tem um seletor "Visualizando como" (Gestor/Operador), ligado a um
`ProfileContext` global. Réplica, em React, a regra que no protótipo HTML
era feita com `body.profile-gestor` + CSS `display:none`: aqui é
renderização condicional — quando o perfil ativo é Operador, a seção
"Resultado financeiro" do drawer (frete, pedágio, rentabilidade) some
inteira, em vez de aparecer mascarada ou desabilitada.

As demais entradas da Sidebar (Frota, Ranking, Importar XML, Exportar
planilha) ainda não têm tela — clicar nelas só registra um aviso no
console, coerente com o escopo atual do projeto (só Motoristas está
implementado, ver "Pendências conhecidas" abaixo).

## Contrato com o back-end

Os tipos em `src/types/motorista.ts` espelham exatamente
`MotoristaResumoDTO`, `MotoristaDetalheDTO` e `ViagemResponseDTO` do
`motoristas-service`. Se o contrato do back-end mudar, este arquivo é o
primeiro lugar a atualizar.

Endpoints usados:

| Método | Rota | Uso neste front-end |
|---|---|---|
| GET | `/api/motoristas?status=&busca=&destino=&page=&size=` | Grade paginada de cards da tela de Motoristas — `busca` casa por nome ou CPF |
| GET | `/api/motoristas/{id}` | Conteúdo do drawer de detalhe — inclui CPF/CNPJ, telefone e rentabilidade |
| PATCH | `/api/motoristas/{id}/status` | Botões "Disponível" / "Em operação" no drawer |

## Pendências conhecidas

- Sem gateway ainda: a URL do back-end é configurada direto via
  `VITE_API_BASE_URL` (ver `.env.example`). Quando o `gateway-service`
  existir, só essa variável muda.
- Filtro por destino é um campo de texto livre e parcial (ex.: "paulo" acha
  "São Paulo") — não há um `<select>` com a lista de destinos distintos
  porque o `motoristas-service` ainda não expõe um endpoint para isso.
