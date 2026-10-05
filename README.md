# newelog-frota-web

Front-end do NEWELOG — React + TypeScript + Vite. Reúne a tela de **Motoristas**, a **importação de manifesto em CSV** e o **modo claro/escuro**, consumindo o `motoristas-service` e o `manifesto-service`.

## Funcionalidades

- **Motoristas:** grade paginada de cards, filtros (status, busca por nome/CPF e destino), drawer de detalhe e troca de status (Disponível / Em operação).
- **Importação de manifesto (CSV):** modal com área de arrastar e soltar, enviado ao `manifesto-service`. Ver seção abaixo.
- **Perfil Gestor/Operador:** controla o que aparece no drawer de detalhe.
- **Tema claro/escuro:** alternável pela Sidebar (desktop) ou pela barra superior (mobile).
- **Layout responsivo:** em telas de até 900px, a Sidebar vira um menu lateral aberto por botão.

## Stack

- React 19.3 + TypeScript 7
- Vite 8 (dev server e build)
- FontAwesome (`@fortawesome/react-fontawesome`) para os ícones
- oxlint para lint (`npm run lint`)
- CSS Modules (sem framework de UI), com animações de entrada e
microinterações (cards escalonados, medidor radial que "enche" ao carregar,
transições em foco/hover/clique). Tudo respeita `prefers-reduced-motion`.

## Rodando localmente

Pré-requisitos:

- `motoristas-service` rodando em `http://localhost:8080`;
- `manifesto-service` rodando em `http://localhost:8081` (necessário para a importação de CSV).

```
npm install
cp .env.example .env
npm run dev
```

Abre em `http://localhost:5173`.

### Variáveis de ambiente

| Variável                     | Padrão                  | Descrição                        |
| ---------------------------- | ----------------------- | -------------------------------- |
| `VITE_API_BASE_URL`          | `http://localhost:8080` | URL base do `motoristas-service` |
| `VITE_MANIFESTO_SERVICE_URL` | `http://localhost:8081` | URL base do `manifesto-service`  |

> O Vite embute as variáveis `VITE_*` **no momento do build**. Ao hospedar, defina-as no ambiente de build.

## Build de produção

```
npm run build
npm run preview
```

## Estrutura

```
src/
├── api/          → cliente HTTP tipado (client.ts) e chamadas específicas
│                   (motoristas.ts, manifesto.ts)
├── types/        → tipos espelhando os DTOs Java dos back-ends
│                   (motorista.ts, manifesto.ts)
├── context/      → ProfileContext (perfil Gestor/Operador), ThemeContext (tema
│                   claro/escuro) e ImportManifestoContext (modal de importação)
├── hooks/        → useMotoristas (listagem + filtros), useMotoristaDetalhe (drawer),
│                   useImportarManifesto (upload e estados da importação)
├── components/   → DriverCard, DriverFilters, DriverDrawer, RadialGauge, Pagination,
│                   Toast, ThemeToggle, Alert/ (avisos), ImportManifesto/ (modal de
│                   importação) e Sidebar/ (navegação + troca de perfil)
└── pages/        → DriversPage
```

### Perfil Gestor/Operador

A Sidebar tem um seletor "Visualizando como" (Gestor/Operador), ligado a um `ProfileContext` global. A regra é aplicada por
renderização condicional: quando o perfil ativo é Operador, a seção
"Resultado financeiro" do drawer (frete, pedágio, rentabilidade) some
inteira, em vez de aparecer mascarada ou desabilitada.

### Tema claro/escuro

O `ThemeContext` aplica o tema pelo atributo `data-theme` na raiz do documento; os tokens de cor de cada tema ficam em `src/index.css`. Na primeira visita usa o esquema de cores do sistema operacional (`prefers-color-scheme`); depois, a escolha do usuário é salva em `localStorage` (chave `newelog:tema`) e reaplicada nas visitas seguintes.

## Importação de manifesto (CSV)

Aberta pela Sidebar ou pelo botão de importação da barra superior no mobile. O modal aceita apenas arquivos `.csv` (outros formatos são recusados no próprio front-end) e envia o arquivo ao `manifesto-service` via `multipart/form-data`, no campo `file`.

Ao concluir, o modal mostra o resumo retornado pelo back-end (total processado, cadastrado e rejeitado) e a lista de **motoristas novos** adicionados. A importação é sinalizada como "atenção" quando há motoristas novos e como "sucesso" quando não há; falhas de rede ou do serviço aparecem como erro, com a mensagem retornada pelo back-end quando houver. Depois de uma importação bem-sucedida, a lista de motoristas é recarregada automaticamente.

O cadastro dos motoristas a partir do CSV é feito pelo back-end; o front-end envia o arquivo e exibe o resultado.

## Contrato com o back-end

Os tipos em `src/types/motorista.ts` espelham `MotoristaResumoDTO`, `MotoristaDetalheDTO` e `ViagemResponseDTO` do `motoristas-service`; `src/types/manifesto.ts` espelha os DTOs do `manifesto-service`. Se o contrato de algum back-end mudar, esses arquivos são o primeiro lugar a atualizar.

Endpoints usados:

| Serviço              | Método | Rota                                                  | Uso neste front-end                                                          |
| -------------------- | ------ | ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| `motoristas-service` | GET    | `/api/motoristas?status=&busca=&destino=&page=&size=` | Grade paginada de cards da tela de Motoristas — `busca` casa por nome ou CPF |
| `motoristas-service` | GET    | `/api/motoristas/{id}`                                | Conteúdo do drawer de detalhe — inclui CPF/CNPJ, telefone e rentabilidade    |
| `motoristas-service` | PATCH  | `/api/motoristas/{id}/status`                         | Botões "Disponível" / "Em operação" no drawer                                |
| `manifesto-service`  | POST   | `/manifestos/upload`                                  | Upload do CSV de manifesto no modal de importação                            |

Resposta do upload (`ManifestoUploadResponse`): `mensagem`, `nomeArquivo`, `totalProcessados`, `totalCadastrados`, `totalRejeitados` e `novos[]` (cada item com `nome`, `placaVeiculo` e `status`).