# Plano: Migração da Intranet SSP para protótipo 100% estático (sem backend/banco)

## Objetivo

Remover a dependência de servidor Python + SQLite e transformar o sistema em um protótipo
100% estático (HTML/CSS/JS), publicável no GitHub Pages do repositório
`https://github.com/phenriquemachado26/ssp.intranet`, com link compartilhável. Preservar
integralmente as regras de negócio já documentadas, trocando apenas a camada de persistência:
de SQLite via `app.py` para `localStorage` do navegador, acessado através de um módulo que
simula a API (`/api/...`) interceptando `window.fetch`, para não exigir reescrever as páginas
e scripts existentes.

## Contexto

- Decisão de arquitetura confirmada com o usuário: estático puro, sem banco de dados real.
- Hospedagem confirmada: GitHub Pages, repositório `phenriquemachado26/ssp.intranet` (vazio, remoto já existe).
- Projeto não possuía `CLAUDE.md` local nem os onze documentos de governança no layout padrão;
  usa nomes próprios (`ARQUITETURA.md`, `REGRAS-DE-NEGOCIO.md`, `DESIGN-SYSTEM.md`). Serão criados
  os documentos faltantes cujo gatilho disparar, mapeados no `CLAUDE.md` local.
- Natureza do "banco": como é 100% client-side, dados ficam por navegador/aba — não há mais
  persistência compartilhada entre visitantes. Isso é uma mudança de comportamento que precisa
  ficar muito clara na documentação (não é um bug, é a natureza do protótipo estático).
- Autenticação deixa de ter qualquer valor de segurança real (toda a lógica roda no navegador do
  visitante); será documentada como "simulação para fins de demonstração", nunca como controle de
  acesso real.

## Arquivos envolvidos

- `assets/js/mock-backend.js` (novo) — substitui `app.py`, intercepta `fetch('/api/...')`.
- `index.html`, `admin.html`, `painel.html`, `avisos.html` — adicionar `<script>` do mock antes dos demais scripts.
- `assets/js/theme.js`, `main.js`, `admin.js`, `painel.js`, `avisos.js` — sem alteração de lógica (continuam chamando `fetch('/api/...')`).
- Remover: `app.py`, `data/` (inclui `intranet.db`, `server.pid`), `__pycache__/`, `logs/`, `scripts/launch-server.py`, `scripts/iniciar-intranet.ps1`, `ABRIR_INTRANET.cmd`.
- `README.md`, `docs/ARQUITETURA.md`, `docs/REGRAS-DE-NEGOCIO.md` — atualizar para refletir a nova arquitetura.
- Novos: `CLAUDE.md` (local), `docs/Progresso.md`, `docs/Memoria.md`, `docs/Infraestrutura.md`, `docs/API.md`, `docs/Auth.md`, `docs/Organograma.md`.
- `.github/workflows/` ou configuração de Pages — habilitar GitHub Pages a partir da branch `main`.
- `.gitignore` — revisar (remover entradas específicas de Python/SQLite que não fazem mais sentido).

## Etapas

1. Criar `assets/js/mock-backend.js` replicando fielmente a lógica de `app.py`: seed inicial
   (usuário Master, perfil "Paleta Padrão", 4 itens de menu), hashing PBKDF2 via `crypto.subtle`,
   sessão com expiração de 8h em `localStorage`, fila de pendências (`change_control` /
   `pending_changes`), resolução de banner por nome-base contra um manifesto estático dos arquivos
   hoje existentes em `images_banner/`, e todas as rotas GET/POST/PUT/DELETE hoje expostas por
   `app.py`. Interceptar `window.fetch` para rotas `/api/*` e devolver objetos `Response` reais.
2. Incluir `mock-backend.js` como primeiro `<script>` em `index.html`, `admin.html`, `painel.html`,
   `avisos.html` (antes de `theme.js`).
3. Adicionar um botão/link "Restaurar dados de demonstração" (em `admin.html`) que limpa o
   `localStorage` e recarrega — necessário porque não há mais servidor central para resetar o
   estado para quem for acompanhar o link.
4. Remover `app.py`, `data/`, `__pycache__/`, `logs/`, `scripts/`, `ABRIR_INTRANET.cmd`; ajustar
   `.gitignore`.
5. Atualizar `README.md` (como rodar localmente sem Python — basta abrir os arquivos ou subir um
   servidor estático qualquer —, link do GitHub Pages, credencial de demonstração, aviso de que
   não há persistência compartilhada nem segurança real).
6. Atualizar `docs/ARQUITETURA.md` (nova seção "Estado atual" descrevendo o mock client-side,
   histórico datado) e `docs/REGRAS-DE-NEGOCIO.md` (seção "Autenticação" com o aviso de que é
   simulação sem valor de segurança real; demais regras de negócio permanecem válidas).
7. Criar `CLAUDE.md` local mapeando a estrutura própria do projeto aos onze documentos de
   governança (vários como `n/a` com justificativa: sem RAG, sem API real própria, frontend
   coberto por `DESIGN-SYSTEM.md`).
8. Criar `docs/Infraestrutura.md` (hospedagem GitHub Pages), `docs/API.md` (contrato do mock),
   `docs/Auth.md` (modelo de sessão client-side e seu caráter não-seguro), `docs/Organograma.md`
   (diagrama simples do novo fluxo sem backend), `docs/Progresso.md` e `docs/Memoria.md`.
9. Inicializar o git no projeto, commitar, configurar remote
   `https://github.com/phenriquemachado26/ssp.intranet.git`, push para `main`, habilitar GitHub
   Pages (branch `main`, raiz).
10. Testar localmente servindo os arquivos estáticos (qualquer servidor HTTP simples) e validar
    fluxo: carregamento do portal público, avisos/carrossel, login Master, CRUD de menu/avisos/
    perfis, fila de validação, logout, "Restaurar dados de demonstração".
11. Revisão por Validator e Security Specialist (eu não aprovo o próprio trabalho); registrar
    resultado em `docs/Progresso.md`.

## Sincronização de documentação

Estado **previsto** de cada documento ao fim desta tarefa.

| Documento                | Previsto    | Motivo                                                                 |
| ------------------------ | ----------- | ----------------------------------------------------------------------- |
| `docs/RegrasNegocio.md`  | atualizado  | Autenticação passa a ser simulação client-side (equivalente: `docs/REGRAS-DE-NEGOCIO.md`) |
| `docs/Arquitetura.md`    | atualizado  | Backend Python/SQLite removido, substituído por mock client-side (equivalente: `docs/ARQUITETURA.md`) |
| `docs/Organograma.md`    | criado      | Fluxo de módulos mudou (sem camada de servidor/BD)                     |
| `docs/Infraestrutura.md` | criado      | Nova hospedagem via GitHub Pages                                       |
| `docs/API.md`            | criado      | Contrato do mock de API documentado para referência                    |
| `docs/Frontend.md`       | n/a         | Nenhuma tela/componente novo; tokens visuais já cobertos por `docs/DESIGN-SYSTEM.md` |
| `docs/Auth.md`           | criado      | Autenticação mudou de servidor real para simulação client-side          |
| `docs/RAG.md`            | n/a         | Projeto não possui corpus indexado nem capacidade de RAG                |
| `docs/Progresso.md`      | criado      | sempre                                                                  |
| `docs/Memoria.md`        | criado      | Decisões e limitações não óbvias (manifesto estático de banners, ausência de persistência compartilhada) |
| `docs/Harness.md`        | n/a         | Execução de sessão única, sem harness multiagente persistente configurado |

## Validação

- [ ] Validator aprovou.
- [ ] Tester aprovou (com ressalva: sem suíte automatizada de testes; validação manual via servidor estático local).
- [ ] Security Specialist aprovou (com o caveat documentado de que a autenticação é apenas demonstrativa).
- [ ] Tabela de sincronização preenchida com o estado real e conferida contra o diff.
- [ ] Documentos condicionais cujo gatilho disparou foram criados.
- [ ] `docs/Progresso.md` atualizado.

## Riscos e decisões pendentes

- Dados administrativos não são mais compartilhados entre visitantes (cada navegador tem sua
  própria cópia em `localStorage`). Para quem for "acompanhar" o link, isso significa que cada
  pessoa verá os dados de demonstração iniciais até mexer no painel — aceito como trade-off da
  opção "estático puro" escolhida pelo usuário.
- Autenticação não tem valor de segurança real; documentado de forma explícita para não induzir
  uso indevido com credenciais reais.
- Novos arquivos de banner adicionados a `images_banner/` no futuro exigirão atualizar manualmente
  o manifesto estático em `mock-backend.js` (não há mais listagem dinâmica de diretório no servidor).
