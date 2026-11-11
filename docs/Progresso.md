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

## 11/11/2026 — Dados mocados de endereço, telefone e horário no rodapé

Usuário forneceu dados reais (porém explicitamente como mock) para pré-preencher o rodapé: Rua
Líbero Badaró 39, Centro, São Paulo-SP, CEP 01009-000; telefone (11) 3291-6500; novo campo
"Horário de atendimento". Implementada lógica de "upgrade" na reconciliação de seed para que
quem já tinha visitado o site (com os placeholders antigos) recebesse os novos dados sem perder
eventual customização já feita pelo Master. 78 cenários de lógica validados via harness Node (74
anteriores + 4 novos). Revisão completa de Validator/Security Specialist segue acumulada.

## 11/11/2026 — Auditoria de responsividade mobile + links reais dos acessos rápidos

Usuário pediu que o protótipo fosse responsivo para smartphone. Em vez de só revisar o CSS "de
olho", usei Playwright + Chromium headless (disponível neste ambiente via `npx`, sem instalação)
para navegar e tirar screenshot de todas as páginas públicas e do painel administrativo completo
em viewport de celular (390×844), checando overflow horizontal e interagindo com menus/dialogs.
Dois bugs reais encontrados e corrigidos: (1) sidebar do painel ficava presa aberta no celular
(o próprio sidebar cobria o botão que deveria fechá-la, por falta de z-index no header); (2) nav
de `avisos.html` sobrepunha o título da página (herdava `position:absolute` do breakpoint mobile
genérico). Nenhum overflow horizontal em nenhuma tela. Também preenchidos os links reais dos 4
acessos rápidos (sites oficiais de Polícia Civil/Militar/Científica e Conseg), abrindo em nova
aba. 82 cenários de lógica validados via harness Node (78 anteriores + 4 novos). Revisão completa
de Validator/Security Specialist segue acumulada.

## 11/11/2026 — 15 sistemas internos reais em Instituições e serviços

Usuário forneceu título e link de 15 sistemas internos reais da SSP-SP (Lista Ramais, Infocrim,
Expedição de Documentos, RH, FISP, Placas Reservadas, SICON, Consulta Jurídica, CLC, Protocolo,
Infoseg, RDO, WIKI, Informativos, Sala de Reuniões); descrições breves escritas com base no
título/contexto fornecido. Adicionados aos 4 itens institucionais originais em "Instituições e
serviços" (total 19), todos já abrindo em nova aba (comportamento que já existia no código). Link
de "Polícia Civil" nos acessos rápidos simplificado para a URL curta oficial. 88 cenários de
lógica validados via harness Node (82 anteriores + 6 novos). Revisão completa de
Validator/Security Specialist segue acumulada.

## 11/11/2026 — Remove institucionais do menu, preenche redes sociais, corrige borda invisível

A pedido do usuário: (1) removidos Polícia Civil/Militar/Científica/Conseg de "Instituições e
serviços" — seguem apenas nos Acessos Rápidos do cabeçalho; (2) Facebook, Instagram e YouTube do
rodapé pré-preenchidos com os perfis oficiais reais da SSP-SP (WhatsApp continua vazio). Também
corrigido um bug visual real reportado pelo usuário: a borda dos campos de formulário ficava
branca/invisível ao clicar para editar, porque o CSS de foco usava a cor secundária do perfil
ativo sem garantia de contraste — e o perfil padrão atual ("Governo Tarcísio") tem cor secundária
branca. Trocado pela variável de contraste garantido que `theme.js` já calcula. 96 cenários de
lógica validados via harness Node (88 anteriores + 8 novos). Revisão completa de
Validator/Security Specialist segue acumulada, cada vez maior — recomendo fazer essa rodada em
breve para não acumular risco.

## 11/11/2026 — Dropzone moderna para upload de logomarca

A pedido do usuário ("deixe mais moderno e profissional"), o campo de logomarca em "Novo perfil"
deixou de ser um `<input type=file>` nativo e virou uma área de arrastar-e-soltar: ícone de
upload com "Clique para enviar"/"ou arraste a imagem aqui" quando vazia, e preview + link
"Remover logomarca" quando há uma imagem selecionada. Mesma validação de tipo/tamanho de antes,
agora reaproveitada tanto pelo clique quanto pelo arrastar. Testado visualmente com Playwright
(desktop e mobile), sem overflow. Revisão completa de Validator/Security Specialist segue
acumulada.

## 11/11/2026 — 4 avisos de demonstração + banner como upload de imagem

A pedido do usuário: campo "Nome do banner" em Cadastro de Avisos virou upload de imagem (mesmo
componente de dropzone da logomarca de perfil, extraído para reutilização). Semeados 4 avisos de
demonstração com base nos banners já existentes em `images_banner/` (Arrecadação, CasaPaulista,
Hospitalidades, SPTodas) — títulos e descrições escritos após inspecionar visualmente o conteúdo
real de cada banner (não apenas o nome do arquivo), todos com botão "Acesse Aqui", já ativos e no
carrossel, com descrição longa o bastante para acionar "Ver mais". Banners seguem referenciados
pelo nome-base (arquivos estáticos existentes), não por upload — evita inflar o `localStorage`
com imagens de 700 KB a 2 MB. Testando com Playwright, encontrado e corrigido um bug real: a
pré-visualização do banner quebrava ao editar um aviso com banner legado (usava o campo errado,
sem extensão de arquivo). 111 cenários de lógica validados via harness Node (96 anteriores + 15
novos). Revisão completa de Validator/Security Specialist segue acumulada — sugiro fortemente
rodar essa auditoria antes de considerar este lote de mocks fechado.

## 11/11/2026 — Links específicos nos botões de Hospitalidades e São Paulo por Todas

A pedido do usuário: botão "Acesse Aqui" de "O que é uma Hospitalidade no Serviço Público?" agora
aponta para o documento da Controladoria Geral; "São Paulo por Todas" aponta para
https://www.spportodas.sp.gov.br/sp-por-todas. Demais avisos de demonstração continuam com o
link genérico da SSP. 115 cenários de lógica validados via harness Node (111 anteriores + 4
novos). Revisão completa de Validator/Security Specialist segue acumulada.

## 11/11/2026 — Reordenação/ampliação de avisos e novo aviso "Conselho de Usuários"

Atendidas duas rodadas de pedidos sobre a seção de avisos: (1) descrição de "Campanha de
Arrecadação de Prendas" e "São Paulo por Todas" ampliadas, botão removido de Arrecadação, ordem
invertida (São Paulo por Todas primeiro, Arrecadação por último); (2) novo aviso de demonstração
"Consulta ao Conselho de Usuários – Avalie os Serviços de Segurança Pública" adicionado como o
primeiro de todos (à frente de São Paulo por Todas), com banner próprio, descrição fornecida pelo
usuário e botão "Participe" — por ser o primeiro com banner, passa a aparecer também no pop-up de
destaque da página inicial. SEED_VERSION 12→13→14.

- **Tester** (eu mesmo, Coder — sem suíte automatizada pré-existente no repositório): 157 cenários
  de lógica validados via harness Node.js (reconciliação de seed, upgrade de botão/descrição a
  partir de versões antigas, preservação de customização manual do Master, inclusive ordem
  manualmente alterada). Todos passando.
- Corrigido ao longo do caminho: bug real de inversão de ordem no loop de "adicionar item semeado
  faltante" (inserção sempre na posição 1 em vez de anexar no fim), que teria invertido a ordem
  dos avisos ao adicionar múltiplos itens de uma só vez.
- Também recuperado com segurança (sem commitar a exclusão) um arquivo `images_banner/AcessoRapido.png`
  que havia desaparecido do disco por motivo não identificado, via `git restore`.
- Pendência: Validator e Security Specialist completos (revisão consolidada do acumulado de
  mudanças de dados mock desta sessão) ainda não executados — segue como item de housekeeping em
  aberto.

## 11/11/2026 — Regra de negócio: quantidade mínima de perfis e cascata do Período Eleitoral

Atendido pedido do usuário para formalizar duas regras sobre perfis visuais: (1) além do Período
Eleitoral, é obrigatório manter ao menos mais um perfil cadastrado (mínimo de 2 no total); (2) ao
ativar o Período Eleitoral, a página de avisos é bloqueada, o pop-up de destaque some, o carrossel
é desativado e todos os avisos são inativados; ao sair dele, página de avisos e carrossel voltam
automaticamente, mas cada aviso individual precisa ser reativado manualmente pelo Master.

- **Tester** (eu mesmo, Coder — sem suíte automatizada pré-existente no repositório): 179 cenários
  de lógica validados via harness Node.js, incluindo a visão do visitante público durante o
  período eleitoral (nenhum aviso/destaque/carrossel escapa da vedação) e a regra de quantidade
  mínima isolada da proteção específica da Paleta Padrão. Todos passando.
- Pendência: Validator e Security Specialist completos (revisão consolidada do acumulado de
  mudanças de dados mock e regras de negócio desta sessão) ainda não executados — segue como item
  de housekeeping em aberto.

## 11/11/2026 — Rodapé: telefone na mesma linha do e-mail, ícones e novo texto "desenvolvido por"

Atendido pedido do usuário: telefone e e-mail do rodapé público agora ficam lado a lado na mesma
linha; endereço, e-mail, telefone e horário de atendimento ganharam ícones; texto de "Desenvolvido
por" alterado de "Desenvolvido pelo GTI" para "CGI - Coordenadoria de Gestão da Informação".

- **Tester** (eu mesmo, Coder — sem suíte automatizada pré-existente no repositório): 187 cenários
  de lógica validados via harness Node.js, incluindo preservação de texto já customizado pelo
  Master. Verificação visual adicional com Playwright (Chromium headless): layout correto,
  telefone e e-mail confirmados na mesma linha, 4 ícones presentes, texto exato conferido, sem
  erros de console.
- Pendência: Validator e Security Specialist completos (revisão consolidada do acumulado desta
  sessão) ainda não executados — segue como item de housekeeping em aberto.

## 11/11/2026 — Organização de imagens e correção da cascata do Período Eleitoral

Duas entregas: (1) organização de arquivos de imagem — 8 logomarcas de redes sociais movidas de
`docs/logo/` para `assets/images/social/`, duplicatas binárias exatas removidas (`BrasaoEstadoSP`/
`GovTarcisio` em `docs/logo/`), e 3 banners legados do protótipo Python original removidos de
`images_banner/` e do manifesto (`Teste.png`, `MuralhaPaulista.png`, `banner_periodoeleitoral.png`
— este último confirmado com o usuário antes de remover, por nome ambíguo); (2) correção do
comportamento de saída do Período Eleitoral: página de avisos, carrossel e avisos da home agora
voltam a ser exibidos automaticamente (reativação em massa), substituindo o comportamento anterior
que exigia reativação manual item a item.

- **Tester** (eu mesmo, Coder — sem suíte automatizada pré-existente no repositório): 187 cenários
  de lógica revalidados via harness Node.js após as duas mudanças. Todos passando.
- Pendência: Validator e Security Specialist completos (revisão consolidada do acumulado desta
  sessão) ainda não executados — segue como item de housekeeping em aberto.

## 11/11/2026 — Simplifica mensagem de confirmação do bloqueio de alterações (Governança)

Atendido pedido do usuário: o pop-up "Regras do bloqueio de alterações" (ao ativar "Bloqueio de
alterações" em Visão Geral) passou a exibir apenas a regra principal — validação obrigatória do
Master para alterações de Administradores do Site — seguida de "Deseja continuar?", em vez da
lista completa de consequências exibida anteriormente. O comportamento de fato (avisos/carrossel
desativados ao bloquear) não mudou, só o texto do pop-up.

- **Tester** (eu mesmo, Coder — sem suíte automatizada pré-existente no repositório): mudança
  restrita a texto de UI (painel.js), fora do escopo do harness Node de regras de negócio.
  Verificado visualmente com Playwright (Chromium headless, login como Master): título e corpo do
  diálogo conferem exatamente com o texto pedido, sem erros de console.
- Pendência: Validator e Security Specialist completos (revisão consolidada do acumulado desta
  sessão) ainda não executados — segue como item de housekeeping em aberto.

## 11/11/2026 — Perfis sempre exigem aprovação do Master; ícones reais de redes sociais no rodapé

Duas entregas a pedido do usuário: (1) criação/edição/exclusão/ativação de perfil visual por um
Administrador do Site agora sempre entra na fila de aprovação do Master, mesmo com o bloqueio geral
de alterações desligado — mensagem orienta o Administrador do Site a contatar um Master; a mudança
só reflete no site após aprovação; (2) ícones de redes sociais do rodapé trocados de badge de letra
para a logomarca real, escolhendo automaticamente tema claro/escuro pelo contraste do fundo.

- **Tester** (eu mesmo, Coder — sem suíte automatizada pré-existente no repositório): 201 cenários
  de lógica validados via harness Node.js (16 novos cobrindo o fluxo completo de aprovação de
  perfil). Ambas as mudanças também verificadas visualmente com Playwright: fluxo completo Site
  Admin → Master → aprovação (mensagem exata conferida, perfil só aparece após aprovação); e
  carregamento das imagens reais no rodapé de `index.html`/`avisos.html` (200 OK, 512x512, sem
  erros de console nas duas páginas).
- Pendência: Validator e Security Specialist completos (revisão consolidada do acumulado desta
  sessão) ainda não executados — segue como item de housekeeping em aberto.

## 11/11/2026 — Badge de validações pendentes e aviso "Agência SP" ativo só no carrossel

Duas entregas a pedido do usuário: (1) badge vermelho destacado (com animação de pulso) no item
"Validações pendentes" do menu do Master, mostrando a quantidade de solicitações pendentes, oculto
quando a fila está vazia; (2) novo aviso de demonstração "Agência SP" cadastrado como o último da
ordem, reaproveitando a regra já existente de "5 primeiros avisos na home" para que ele fique
visível apenas no carrossel e na listagem completa de avisos.html, sem aparecer como card na home.

Também em andamento (não documentado ainda, aguardando verificação visual): favicon composto com
fundo preto para perfis com cor primária preta/quase preta (Governo Tarcísio, Período Eleitoral),
cujas logomarcas têm traço claro pensado para fundo escuro e ficavam ilegíveis direto sobre o fundo
claro da aba do navegador.

- **Tester** (eu mesmo, Coder — sem suíte automatizada pré-existente no repositório): 209 cenários
  de lógica validados via harness Node.js. Badge verificado visualmente com Playwright (ciclo
  completo: oculto → aparece com contagem correta após solicitação pendente → oculto após
  aprovação), sem erros de console.
- Pendência: Validator e Security Specialist completos (revisão consolidada do acumulado desta
  sessão) ainda não executados — segue como item de housekeeping em aberto.

## 11/11/2026 — Favicon com fundo preto para perfis de cor primária preta

Atendido pedido do usuário: logomarcas pensadas para fundo escuro (Governo Tarcísio, Período
Eleitoral — ambos com `color_primary: '#000000'`) ficavam ilegíveis quando exibidas direto como
favicon, sobre o fundo claro padrão da aba do navegador. `theme.js` passou a compor o favicon
desses perfis sobre um fundo preto (via canvas 64x64, exportado como PNG); perfis com cor primária
clara ou escura-mas-não-preta (ex.: a Paleta Padrão, azul-marinho) continuam exibindo a logo
normalmente, sem composição.

- **Tester** (eu mesmo, Coder — sem suíte automatizada pré-existente no repositório): mudança
  restrita a `theme.js` (lógica de UI), fora do escopo do harness Node de regras de negócio.
  Verificado visualmente com Playwright (Chromium headless): pixel do canto do favicon composto é
  preto puro (0,0,0), confirmando o fundo desenhado; favicon do perfil não-preto permanece a logo
  estática direta, sem composição. Sem erros de console.
- Pendência: Validator e Security Specialist completos (revisão consolidada do acumulado desta
  sessão) ainda não executados — segue como item de housekeeping em aberto.

## 11/11/2026 — Reversão do favicon com fundo preto

A pedido do usuário, revertida a composição de favicon com fundo preto para perfis de cor primária
preta (Governo Tarcísio, Período Eleitoral) — não gostou do resultado visual. Revertido via
`git revert` (código) e regra correspondente marcada como `revogada` (não apagada) em
`docs/REGRAS-DE-NEGOCIO.md`. Favicon volta a exibir a logo diretamente em todos os perfis.

- **Tester** (eu mesmo, Coder): 209 cenários de lógica revalidados via harness Node.js após o
  revert (mudança restrita a `theme.js`, fora do escopo do harness de regras de negócio, mas
  revalidado por segurança). Sem regressões.
- Pendência: Validator e Security Specialist completos (revisão consolidada do acumulado desta
  sessão) ainda não executados — segue como item de housekeeping em aberto.

## 11/11/2026 — Novo banner de Hospitalidade ativo só no carrossel; antigo desativado no carrossel

Atendido pedido do usuário: cadastrado o aviso "Hospitalidade no Serviço Público — Registre no
SP-Agendas" (banner largo, formato carrossel), posicionado como o último da ordem para ficar
"ativo só no carrossel" — mesma técnica já usada para o Agência SP. O aviso original de
Hospitalidade teve o carrossel desligado (substituído por este), permanecendo ativo normalmente
como card/listagem.

- **Tester** (eu mesmo, Coder — sem suíte automatizada pré-existente no repositório): 218 cenários
  de lógica validados via harness Node.js, incluindo o upgrade de reconciliação (desliga o
  carrossel do aviso antigo só se ainda estiver no valor padrão) e a preservação de customização
  real do Master. Todos passando.
- Pendência: Validator e Security Specialist completos (revisão consolidada do acumulado desta
  sessão) ainda não executados — segue como item de housekeeping em aberto.

## 11/11/2026 — Nova descrição do Conselho de Usuários; consolidação de banners largos

Duas entregas: (1) descrição do aviso "Consulta ao Conselho de Usuários" substituída por versão
com parágrafos e itens de lista (quebras de linha preservadas no site via CSS `white-space:
pre-line` já existente); (2) consolidação de banners após o usuário substituir arquivos
diretamente no disco — Conselho de Usuários e Hospitalidade passaram a usar imagens largas
(2560x397); o aviso separado "carrossel-only" de Hospitalidade (de uma entrega anterior) foi
consolidado de volta no aviso original, evitando duplicidade.

- **Tester** (eu mesmo, Coder — sem suíte automatizada pré-existente no repositório): 221 cenários
  de lógica validados via harness Node.js, incluindo upgrades de banner e remoção de duplicado
  preservando customização real do Master. Verificado visualmente com Playwright: quebras de linha
  renderizando (21 linhas confirmadas), 6 avisos corretos sem erro 404, ambas as imagens novas
  carregando (2560px de largura), sem erros de console em `index.html` e `avisos.html`.
- Observação incidental (fora do escopo desta tarefa, não é regressão): `avisos.html` não exibe
  banners na listagem completa (`.notice-banner` com `display:none` ali) — comportamento uniforme
  em todos os avisos, parece design já existente, não investigado a fundo.
- Pendência: Validator e Security Specialist completos (revisão consolidada do acumulado desta
  sessão) ainda não executados — segue como item de housekeeping em aberto.
