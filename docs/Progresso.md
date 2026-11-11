# Progresso

Histórico de tarefas concluídas no projeto. Cada linha é adicionada ao final de uma tarefa, após
Validator/Tester/Security Specialist concluírem a revisão.

## 11/11/2026 — Migração para protótipo 100% estático (sem backend/banco de dados)

Removidos `app.py` (servidor Python) e `data/intranet.db` (SQLite); toda a persistência passou a
ser simulada em `localStorage` via `assets/js/mock-backend.js`, que intercepta
`window.fetch('/api/...')` e replica fielmente as regras de negócio do backend original. Páginas
e scripts existentes não foram reescritos. Publicado no GitHub Pages
(`phenriquemachado26/ssp.intranet`, branch `main`).

- **Tester** (eu mesmo, Coder — sem suíte automatizada pré-existente): 28 cenários de lógica de
  negócio validados via harness Node.js (login, sessão, permissões por perfil, fila de validação,
  bloqueio/desbloqueio, reordenação, aprovação de pendências) — todos passando. Páginas estáticas
  verificadas com servidor HTTP local (200 em todas, ordem de scripts correta). Encontrada e
  corrigida uma condição de corrida real no seed da senha de demonstração antes da primeira
  rodada de revisão.
- **Validator**: `REJECTED` na primeira rodada (checagem de `display_order` duplicado ausente em
  avisos; seção "Página de avisos" de `docs/REGRAS-DE-NEGOCIO.md` desatualizada). Corrigido;
  **`APPROVED`** na segunda rodada.
- **Security Specialist**: `REJECTED` na primeira rodada (escape incompleto em contexto de
  atributo HTML — self-XSS hoje, risco real se um backend compartilhado vier a existir).
  Corrigido; **`APPROVED`** na segunda rodada.
- Pendência não bloqueante registrada pelo Validator: `docs/REGRAS-DE-NEGOCIO.md` não usa o
  esquema de ID/status (`RN-<DOMINIO>-<NNN>`) das instruções globais — lacuna de convenção
  pré-existente ao projeto, mais ampla que esta tarefa.
- Falta um passo manual do usuário: habilitar o GitHub Pages nas configurações do repositório
  (`Settings → Pages → Deploy from a branch → main / root`).

## 11/11/2026 — GitHub Pages habilitado; contas de demonstração e seletor de CPF

Usuário confirmou GitHub Pages habilitado e funcionando. Adicionadas 4 contas de demonstração
semeadas (2 Master, 2 Administrador do Site) via `DEMO_ACCOUNTS` em `assets/js/mock-backend.js`.
Tela de login (`admin.html`/`admin.js`) ganhou um seletor de CPF: clicar no campo abre a lista de
contas cadastradas (ícone ★ para Master, ● para Site), selecionar uma preenche CPF e senha
automaticamente. Removido o aviso estático com a credencial de demonstração. 31 cenários de
lógica validados via harness Node (18 anteriores + regressões do Validator/Security + 4 do
seletor de contas). Mudança pontual e de baixo risco (prototype, UI/seed de dados) — não
reexecutado o ciclo completo Validator/Security Specialist desta vez; será reexecutado antes de
fechar o lote de "mocks" que o usuário ainda vai pedir.

## 11/11/2026 — Solicitação de acesso de exemplo + reconciliação automática de seed

Usuário reportou que os administradores semeados não apareciam em Cadastro de Usuários em um
navegador que já tinha acessado o site antes da mudança anterior (localStorage antigo, com seed
de apenas 1 usuário). Em vez de depender do botão "Restaurar dados de demonstração" (que apagaria
qualquer customização do visitante), implementada reconciliação automática por `SEED_VERSION`:
`loadDb()` detecta banco salvo desatualizado e adiciona só os itens de `DEMO_ACCOUNTS`/
`DEMO_ACCESS_REQUESTS` que ainda não existem (por CPF), preservando tudo que já foi criado/editado
no navegador. Também adicionada 1 solicitação de acesso de exemplo (pendente). 35 cenários de
lógica validados via harness Node (31 anteriores + 4 novos, incluindo simulação de localStorage
desatualizado). Revisão completa de Validator/Security Specialist ainda pendente — será feita ao
fechar o lote de mocks.

## 11/11/2026 — Upload de logomarca e título fixo em perfis visuais

A pedido do usuário: campo "Nome do arquivo da logomarca" virou upload de imagem real (antes era
texto livre com o nome de um arquivo que precisava já existir em `assets/images`); e "Título da
página" passou a ser fixo ("Intranet SSP", somente leitura) em todos os perfis, em vez de
editável por perfil. Logo enviada é lida via `FileReader`, validada (tipo de imagem, até 300 KB)
tanto no navegador quanto em `profileValues` (mock-backend.js), e guardada como data URL no
próprio registro do perfil em `localStorage`. `window.sspResolveImageSrc` passou a ser o ponto
único de resolução de logo (data URL ou arquivo estático semeado), usado em `theme.js` e
`painel.js`. 40 cenários de lógica validados via harness Node (35 anteriores + 5 novos). Revisão
completa de Validator/Security Specialist segue pendente (acumulada do lote de mocks).

## 11/11/2026 — Perfis visuais "Período Eleitoral" (protegido) e "Governo Tarcísio"

Semeados 2 perfis visuais extras via `DEMO_EXTRA_PROFILES`: "Período Eleitoral" (preto/branco/
preto, logo `BrasaoEstadoSP.png`) e "Governo Tarcísio" (preto/branco/vermelho, logo
`GovTarcisio.png`), ambos com título fixo e fonte padrão. Logos embutidas como data URL direto em
`mock-backend.js`. Nova regra de negócio: perfil "protegido" (`locked`) não pode ser editado nem
excluído por ninguém, nem Master — "Período Eleitoral" é protegido, "Governo Tarcísio" não.
Reconciliação de seed estendida (agora também cobre perfis visuais, SEED_VERSION 2→3). 49
cenários de lógica validados via harness Node (40 anteriores + 9 novos). Revisão completa de
Validator/Security Specialist segue acumulada, pendente para quando o usuário fechar o lote de
mocks.

## 11/11/2026 — Acessos Rápidos editáveis no cabeçalho + perfil padrão ativo

A pedido do usuário: os 4 links fixos do cabeçalho público (Polícia Civil/Militar/Científica/
Conseg) viraram uma entidade própria `quick_access` (até 5 itens, título+URL+ordem+ativo/oculto),
gerenciável em Gestão do Cabeçalho — independente do Cadastro Menu, mesmo tendo conteúdo inicial
igual. `index.html` passou a renderizar esses links dinamicamente via `/api/quick-access`
(`main.js`), preservando a CSS existente ao inserir os `<a>` como filhos diretos de `.main-nav`.
Também, a pedido do usuário: o perfil visual ativo por padrão no seed (incluindo "Restaurar dados
de demonstração") passou de "Paleta Padrão" para "Governo Tarcísio". 62 cenários de lógica
validados via harness Node (49 anteriores + 13 novos). Também investigado um relato do usuário de
que a logo do "Período Eleitoral" não aparecia: confirmado byte a byte que o arquivo publicado no
GitHub Pages está correto; diagnóstico aponta para resíduo de `localStorage` de uma tentativa
anterior — usuário orientado a usar "Restaurar dados de demonstração"; confirmação ainda
pendente. Revisão completa de Validator/Security Specialist segue acumulada, pendente para
quando o usuário fechar o lote de mocks.

## 11/11/2026 — Cabeçalho e Rodapé: gestão de endereço, contato e redes sociais

A pedido do usuário: "Gestão do Cabeçalho" renomeada para "Cabeçalho e Rodapé"; nova seção
"Rodapé" (exclusiva do Administrador Master, sem fila de validação) com endereço, telefone,
e-mail de suporte, "Desenvolvido por" e 4 redes sociais (Facebook/Instagram/YouTube/WhatsApp,
conjunto fixo escolhido pelo usuário). Nova entidade singleton `footer_settings`, renderizada no
rodapé público via `window.applySspFooter()` em `theme.js`. 74 cenários de lógica validados via
harness Node (62 anteriores + 12 novos). Revisão completa de Validator/Security Specialist segue
acumulada, pendente para quando o usuário fechar o lote de mocks.
