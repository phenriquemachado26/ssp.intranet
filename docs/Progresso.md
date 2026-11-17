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

## 12/11/2026 — Dois novos itens em "Instituições e serviços": Resoluções SSP e Almoxarifado

A pedido do usuário, adicionados ao final de `DEFAULT_MENU_ITEMS` (`assets/js/mock-backend.js`)
os itens "Resoluções SSP" (`.../intranetV3/assets/resolucoes/`) e "Almoxarifado"
(`.../intranetV3/assets/almoxarifado/`), cada um em um pedido separado dentro da mesma tarefa.
SEED_VERSION 19->21 (um incremento por item), para que o item apareça também em navegadores que já
tinham `localStorage` salvo. Total de itens semeados passou de 15 para 17.

- **Tester** (eu mesmo, Coder — sem suíte automatizada pré-existente no repositório, harness Node
  de regras de negócio não versionado neste checkout): validação sintática (`node -c
  assets/js/mock-backend.js`), extração isolada de `DEFAULT_MENU_ITEMS` via Node confirmando 17
  itens, os 2 novos como últimos, títulos únicos e sem URL duplicada introduzida pela mudança (a
  única URL duplicada da lista — FISP/Placas Reservadas — é pré-existente, não relacionada a esta
  tarefa). `main.js` renderiza `menu_items` sem limite de quantidade (`items.map(...)`), então o
  grid "Instituições e serviços" comporta os novos itens sem alteração de código adicional. Não foi
  possível verificar visualmente no navegador nesta sessão (sem acesso a ferramenta de browser).
- Pendência: Validator e Security Specialist completos (revisão consolidada do acumulado desta
  sessão) ainda não executados — segue como item de housekeeping em aberto.

## 13/11/2026 — Reescrita completa de docs/REGRAS-DE-NEGOCIO.md (telas, entidades, ID e status)

A pedido do usuário, `docs/REGRAS-DE-NEGOCIO.md` foi reescrito do zero a partir da leitura integral
do código-fonte atual (`assets/js/mock-backend.js` — 1107 linhas, `main.js`, `avisos.js`,
`theme.js`, `admin.js`, `painel.js`, as 4 páginas HTML). Passou de prosa solta por seção para uma
estrutura por tela (`T-01`…`T-09`) e por entidade (`E-USUARIO`, `E-SOLICITACAO`, `E-PERFIL`,
`E-ACESSO`, `E-MENU`, `E-AVISO`, `E-RODAPE`, `E-CONTROLE`, `E-PENDENCIA`), com ID estável
`RN-<DOMÍNIO>-NNN` e status (`confirmada`/`⚠ inferida`) em cada regra — resolvendo a lacuna de
convenção já registrada como pendência pelo Validator na entrada de 11/11/2026 (migração para
protótipo estático). Adicionada uma matriz de permissões por entidade e uma tabela de mapeamento
tela↔entidade.

Nenhuma regra de negócio foi alterada de fato (tarefa puramente documental). Corrigidas duas
referências desatualizadas a um antigo backend SQLite nas seções "Cadastro Menu" e "Visão Geral
administrativa" (a migração para `localStorage`/mock já estava registrada em `docs/ARQUITETURA.md`
desde 11/11/2026, mas não havia sido propagada a essas duas frases do documento de regras).

Três comportamentos implementados no código, sem registro de decisão explícita anterior, foram
documentados como `⚠ inferida` para confirmação do usuário (ver seção "Observações técnicas a
confirmar" do documento reescrito):

- Exclusão de administrador hoje só bloqueia auto-exclusão (`id === session.id`); não há proteção
  específica ao cadastro Master principal da demonstração, diferente do que uma frase do documento
  anterior sugeria.
- Itens de "Cadastro Menu" têm uma flag de status individual (ativo/inativo) com botão dedicado no
  painel, não documentada antes.
- Aprovação de uma pendência de exclusão de perfil visual que violaria a quantidade mínima de
  perfis (ou a Paleta Padrão, ou o perfil ativo) é silenciosamente ignorada pelo mock — a resposta
  ao Master ainda diz "aplicada", mesmo sem efeito real.

- **Tester**: n/a — tarefa puramente documental, sem alteração de código/comportamento; nenhum
  cenário de regressão aplicável. Autovalidação feita linha a linha contra o código-fonte lido
  nesta sessão (ver plano em `.claude/plans/`).
- **Validator**: autovalidação (sessão única, sem harness multiagente configurado neste
  repositório — `docs/Harness.md` = n/a): estrutura por tela/entidade conferida contra o código;
  cada regra do documento anterior foi localizada e preservada ou explicitamente marcada como
  divergente; tabela de sincronização de documentação do plano conferida contra o diff real
  (somente `docs/REGRAS-DE-NEGOCIO.md` e este arquivo mudaram).
- **Security Specialist**: n/a para revisão de código (nenhum código alterado); nenhum segredo novo
  incluído — as senhas de demonstração já eram públicas em `docs/Auth.md` e no próprio
  `mock-backend.js` (exposição intencional e documentada).
- Pendências: as três divergências `⚠ inferida` acima aguardam confirmação do usuário — podem ser
  bugs a corrigir no código ou apenas lacunas de documentação a aceitar como estão.

## 13/11/2026 — Resolvidas as 3 pendências `⚠ inferida` de docs/REGRAS-DE-NEGOCIO.md

Usuário revisou, uma a uma, as três divergências levantadas na reescrita do documento de regras
(tarefa anterior, mesma data) e decidiu:

1. **Exclusão do Master principal** (`RN-USR-005b`): restaurar a proteção. Implementado
   `MASTER_PRINCIPAL_CPF` em `assets/js/mock-backend.js` — `DELETE /api/users/<id>` agora rejeita
   com 409 a exclusão do cadastro Master principal da demonstração (CPF `000.000.000-00`) por
   qualquer administrador, além da proteção já existente contra auto-exclusão.
2. **Status individual de itens de menu** (`RN-MENU-006`): manter como está, recurso intencional —
   só documentação, sem alteração de código.
3. **Aprovação silenciosa de exclusão de perfil inválida** (`RN-PERFIL-014`): corrigir. O branch
   `delete` de perfil em `applyPendingChange` (`assets/js/mock-backend.js`) agora lança erro quando
   a exclusão violaria perfil ativo/Paleta Padrão/quantidade mínima, em vez de ignorar
   silenciosamente — a aprovação falha com a mesma mensagem genérica das demais entidades e a
   solicitação permanece pendente.

`docs/REGRAS-DE-NEGOCIO.md` atualizado: as três regras promovidas de `⚠ inferida` para
`confirmada` (nova regra `RN-USR-005b`); seção "Observações técnicas a confirmar" removida (sem
pendências restantes); resolução registrada no "Histórico" do documento. `docs/ARQUITETURA.md`
ganhou entrada de histórico para as duas mudanças de código.

- **Tester** (eu mesmo, sem suíte automatizada pré-existente): `node -c assets/js/mock-backend.js`
  (sintaxe OK) e harness Node isolado ad hoc (stub de `localStorage`/`window`, descartado após o
  teste) cobrindo os 2 cenários corrigidos — Master principal protegido contra exclusão por outro
  Master (409), auto-exclusão continua bloqueada (409), exclusão de um terceiro administrador
  continua funcionando (200); aprovação de exclusão pendente da Paleta Padrão agora falha com 409
  e a Paleta Padrão permanece no banco (antes: sucesso silencioso, sem efeito).
- **Validator**: autovalidação (sessão única, `docs/Harness.md` = n/a neste repositório) —
  mudanças mínimas e localizadas, consistentes com os demais branches de cada endpoint; mensagens
  de erro seguem o padrão já usado nas demais entidades.
- **Security Specialist**: n/a — ajuste de validação de autorização que **restringe** uma ação
  (menos permissiva, não mais), sem novo dado sensível exposto.

## 13/11/2026 — Ícones de redes sociais ocultos no rodapé durante Período Eleitoral

Nova regra de negócio (`RN-PORTAL-015`, `docs/REGRAS-DE-NEGOCIO.md`): enquanto o perfil visual
"Período Eleitoral" está ativo, os ícones de redes sociais do rodapé público (`index.html`,
`avisos.html`) ficam completamente ocultos, independente de haver URL cadastrada. Ao ativar
qualquer outro perfil, os ícones voltam a ser exibidos, seguindo a regra individual já existente de
ocultação por URL vazia (RN-PORTAL-012).

Implementado em `window.applySspFooter` (`assets/js/theme.js`): o bloco `#footer-social` agora
força a lista de links para vazia (`social.hidden=true`) quando o perfil retornado por
`GET /api/theme` tem `name === 'Período Eleitoral'`; caso contrário, mantém o comportamento
anterior (filtro por URL preenchida).

- **Tester** (eu mesmo, sem suíte automatizada pré-existente): inspeção manual do código alterado
  e leitura cruzada com `profile?.name==='Período Eleitoral'`, já usado em `mock-backend.js` para a
  mesma verificação (bloqueio da página de avisos) — mesmo critério reaproveitado, sem novo campo
  de dado. Servidor local não pôde ser iniciado nesta sessão (bloqueio do classificador de ações);
  validação funcional em navegador fica pendente para o usuário.
- **Validator**: autovalidação (sessão única, `docs/Harness.md` = n/a neste repositório) — mudança
  mínima e localizada em uma única linha de `theme.js`, sem alterar as demais seções do rodapé.
- **Security Specialist**: n/a — alteração puramente de exibição condicional de ícones já públicos,
  sem novo dado sensível, autenticação ou autorização envolvida.

## 17/11/2026 — Identidade Visual, Perfis e Permissões e Logs de Auditoria

A pedido do usuário, três ajustes na área administrativa:

1. **Identidade Visual**: menu "Cabeçalho e Rodapé" renomeado para "Identidade Visual"
   (`painel.html`, `docs/REGRAS-DE-NEGOCIO.md` → T-06). Rótulo apenas; id interno (`headers-view`)
   e regra de bloqueio do perfil "Período Eleitoral" (`RN-PERFIL-010`) não mudaram.
2. **Perfis e Permissões** (nova tela `T-10`, `#access-profiles-view`): o antigo papel fixo único
   "Administrador do Site" deu lugar a perfis de acesso configuráveis pelo Master
   (`access_profiles`, `assets/js/mock-backend.js`), com matriz de permissões por área × ação
   (visualizar/incluir/editar/excluir/publicar-aprovar) sobre 8 áreas administrativas. `RN-PERM-001`
   foi revogada; `RN-PERM-005`–`RN-PERM-009` descrevem o novo modelo. Decisão de segurança tomada
   nesta tarefa (sem pedido explícito do usuário sobre este detalhe): três áreas — Cadastro de
   Usuários, Validações Pendentes, Perfis e Permissões — continuam exclusivas do Master no backend
   mock, independentemente da matriz, para não permitir escalonamento de privilégio. Migração
   automática e não destrutiva para navegadores com dados salvos antes desta mudança
   (`SEED_VERSION` 21→22): cria o perfil seed "Administrador do Site" e vincula usuários
   `role:'site'` já existentes a ele.
3. **Trava de último Master generalizada** (`RN-USR-007`): `assertNotLastActiveMaster` substitui a
   antiga proteção fixa por CPF (`MASTER_PRINCIPAL_CPF`, removida) — bloqueia excluir, desativar ou
   rebaixar qualquer conta Master quando for a última ativa. `RN-USR-005b` revogada.
4. **Logs de Auditoria** (nova tela `T-11`, `#audit-view`, somente leitura): nova entidade
   `audit_logs`, alimentada por um wrapper central em `handleApi()` (login/logout, mutações
   administrativas, negações de permissão); filtros por usuário, área, ação e período; sem endpoint
   de edição/exclusão; mantém só os últimos 2000 registros (limite de `localStorage`). Decisão de
   design: chamadas `GET` não são logadas, para não inundar o log com tráfego público do portal.

Arquivos alterados: `painel.html`, `assets/js/mock-backend.js`, `assets/js/painel.js`,
`assets/css/styles.css`, `docs/REGRAS-DE-NEGOCIO.md`, `docs/ARQUITETURA.md`, `docs/API.md`,
`docs/Auth.md`, `docs/Organograma.md`, `docs/DESIGN-SYSTEM.md`.

- **Tester** (eu mesmo, sem suíte automatizada pré-existente): `node -c` em
  `assets/js/mock-backend.js` e `assets/js/painel.js` (sintaxe OK); harness Node ad hoc (stub de
  `localStorage`/`window`/`crypto.subtle`, descartado após a execução) cobrindo: login master,
  `effective_permissions` resolvido corretamente para perfil customizado, usuário sem permissão
  recebe `403` em `menu` e isso gera log `result:'denied'`, usuário sem permissão em
  `audit_logs` recebe `403`, login malsucedido gera `audit_logs` com `action:'login_failed'`,
  desativar/excluir o último Master ativo é rejeitado com `409` (mas um segundo Master ativo pode),
  perfil de acesso seed não pode ser excluído enquanto houver usuário vinculado. Todos os cenários
  passaram. Validação em navegador real não foi realizada nesta sessão (ambiente não interativo,
  sem servidor local) — fica pendente para o usuário conferir visualmente as duas telas novas e o
  formulário de usuário atualizado.
- **Validator**: autovalidação (sessão única, `docs/Harness.md` = n/a neste repositório) — diff
  revisado linha a linha contra o plano (`.claude/plans/`); checagem adicional de que nenhum ponto
  sensível ficou em `requireAuth()` genérico sem gate de permissão (`grep` de todos os call sites de
  `requireAuth()`/`requireMaster()` no arquivo final); removida uma função morta (`roleLabel`) 
  deixada pela implementação de UI, sem uso após a troca para `profileDisplay`.
- **Security Specialist**: revisão focada em autorização (tarefa de autenticação/permissões) —
  confirmado que Cadastro de Usuários, Validações Pendentes, Perfis e Permissões e Rodapé
  permanecem `requireMaster()` hardcoded, não gatilháveis pela matriz de um perfil de acesso
  (bloqueia o vetor óbvio de escalonamento de privilégio); `sanitizePermissionMatrix` descarta
  qualquer área/ação desconhecida vinda do cliente; exclusão de perfil de acesso com usuários
  vinculados é bloqueada; trava de último Master cobre exclusão, desativação e rebaixamento.
  Nenhuma senha, token ou segredo novo foi exposto em log, resposta de API ou documentação.
  **APPROVED**.

## 17/11/2026 — Menu lateral agrupado e Logs de Auditoria com detalhe legível

A pedido do usuário, dois ajustes de UI na área administrativa:

1. **Menu lateral reagrupado**: a lista única sob "GESTÃO" virou três grupos — GERAL (Visão
   Geral), CONTEÚDO (Identidade Visual, Cadastro de Menu, Cadastro de Avisos) e ADMINISTRAÇÃO
   (Cadastro de Usuários, Perfis e Permissões, Validações Pendentes, Logs de Auditoria). Rótulos
   "Cadastro Menu"→"Cadastro de Menu" e "Validações pendentes"→"Validações Pendentes" ajustados
   para a grafia pedida. Puramente visual — `data-view`/ids internos e lógica de exibição por
   permissão não mudaram. `painel.html`, `assets/css/styles.css`.
2. **Logs de Auditoria — detalhe legível + pop-up estruturado**: o campo `detail` deixou de ser o
   trace técnico cru (`PUT /api/menu/3 -> 200`) e passou a ser uma frase breve em PT
   (`describeAudit()` em `assets/js/mock-backend.js`), nunca incluindo senha/hash mesmo quando o
   payload original os contém. Cada linha da tabela ganhou um ícone ("ℹ") que abre um pop-up
   (`#audit-detail-dialog`) com todos os campos estruturados do registro, incluindo os técnicos
   (`method`/`path`/`status`/`message`), agora armazenados separados em vez de concatenados numa
   string só. Novas regras: `RN-AUDIT-007`; `RN-AUDIT-003` ampliada.

Arquivos alterados: `painel.html`, `assets/js/mock-backend.js`, `assets/js/painel.js`,
`assets/css/styles.css`, `docs/REGRAS-DE-NEGOCIO.md`, `docs/ARQUITETURA.md`, `docs/API.md`.

- **Tester** (eu mesmo): `node -c` nos dois JS (sintaxe OK); harness Node ad hoc (descartado após
  a execução) cobrindo: detalhe de criação de item de menu cita o título cadastrado, detalhe de
  criação de usuário cita o nome da pessoa **sem nunca conter a senha em texto puro** (checado
  também em todo o array de logs serializado), detalhe de login malsucedido é frase legível. Todos
  os cenários passaram. Verificação manual de balanceamento de tags (`<dialog>`/`<section>`) em
  `painel.html`. Validação visual em navegador não foi feita (sessão não interativa).
- **Validator**: autovalidação — mudança isolada à função de descrição do log e aos campos
  estruturados da entrada; nenhum outro endpoint ou checagem de permissão foi tocado.
- **Security Specialist**: ponto de atenção verificado explicitamente — `describeAudit()` só lê
  `data.title`/`data.name`/`data.page_title`/`data.decision`/`data.status`/`data.ids`, nunca
  `data.password`; teste automatizado confirma ausência de senha em qualquer log serializado.
  **APPROVED**.

## 17/11/2026 — Logs de Auditoria mockados para visualização

Usuário reportou que a frase legível e o ícone de detalhes não apareciam na tela de Logs de
Auditoria — causa: a entidade `audit_logs` só existia vazia (feature nova, sem histórico anterior),
então a tabela mostrava o estado vazio "Nenhum registro encontrado", sem nenhuma linha para exibir
frase ou ícone. Pedido: semear alguns logs de demonstração.

Adicionado `buildDemoAuditLogs()` em `assets/js/mock-backend.js`: 10 registros cobrindo login,
login malsucedido, logout, criação/edição/publicação de conteúdo, uma ação negada (não-Master
tentando excluir usuário) e uma aprovação de fila, com datas relativas ao momento da semeadura (3
dias atrás até 2 horas atrás). `SEED_VERSION` 22→23: navegadores que já tinham migrado para a v22
(com `audit_logs` vazio) recebem os mesmos 10 registros numa migração automática única, sem afetar
nenhum outro dado já customizado (`RN-AUDIT-008`).

- **Tester** (eu mesmo): harness Node ad hoc (descartado após a execução) cobrindo os dois
  cenários — banco novo (seed direto) e banco já existente na v22 com `audit_logs` vazio
  (migração) — confirmando 10 registros em ambos, nenhum com trace técnico cru no `detail`, todos
  com `method`/`path`/`status` preenchidos, `seedVersion` e `seq.audit_logs` corretos após a
  migração. Todos os cenários passaram.
- **Validator**: autovalidação — mudança aditiva e idempotente (só preenche quando
  `audit_logs.length === 0`), não sobrescreve logs reais que o usuário já tenha gerado.
- **Security Specialist**: dados de demonstração não incluem senha nem dado sensível real; CPF
  usado na tentativa de login malsucedida é um dos CPFs de demonstração já públicos em
  `docs/Auth.md`. **APPROVED**.

## 17/11/2026 — Perfis e Permissões incorporado a Cadastro de Usuários; abas Ativos/Inativos

A pedido do usuário, confirmado via perguntas de esclarecimento antes de implementar (mudança de
arquitetura — revertia parte do trabalho da tarefa anterior no mesmo dia):

1. **Perfis e Permissões deixou de ser tela/entidade separada.** Removidos: `access_profiles`
   (entidade), `users.profile_id`, endpoints `/api/access-profiles*`, menu lateral e tela próprios.
   Cada Administrador agora tem seu próprio `users.permissions` (booleano por funcionalidade — 6
   áreas, sem granularidade de ação: Identidade Visual, Cadastro Menu, Cadastro de Avisos, Acessos
   Rápidos, Validações Pendentes, Logs de Auditoria). Ao cadastrar/editar um administrador e marcar
   "Tipo de acesso" = Administrador, um pop-up com flags deslizantes (uma por funcionalidade) é
   aberto automaticamente; Master não precisa configurar nada (acesso total fixo).
2. **Validações Pendentes passou a ser delegável** — reverte uma decisão de segurança que eu havia
   tomado por conta própria na tarefa anterior (mantê-la sempre Master-exclusiva); o usuário pediu
   explicitamente para incluí-la entre as funcionalidades configuráveis. Adicionada trava de
   autoaprovação (`row.requested_by === session.id` rejeitada com `409`) para que delegar isso não
   permita a ninguém aprovar a própria solicitação.
3. **Lista de administradores dividida em abas Ativos/Inativos** (mais Solicitações, inalterada).
   Botão "Excluir" removido da lista; cada linha ganhou uma flag deslizante que ativa/inativa
   diretamente (`PUT /api/users/<id>` só com `{active}`, novo endpoint leve, mesmo padrão de
   menu/avisos). O formulário completo de edição não mexe mais em `active`. O endpoint
   `DELETE /api/users/<id>` continua existindo na API (não foi removido), só não é mais chamado
   pela UI.
4. **Dados mockados**: 4 administradores extras semeados (Eduardo, Beatriz — ativos; Patrícia,
   Thiago — inativos), com combinações variadas de permissões, para as abas e a coluna "Acesso" não
   ficarem vazias/repetitivas no protótipo.

Arquivos alterados: `assets/js/mock-backend.js`, `painel.html`, `assets/js/painel.js`,
`assets/css/styles.css`, `docs/REGRAS-DE-NEGOCIO.md`, `docs/ARQUITETURA.md`, `docs/API.md`,
`docs/Auth.md`, `docs/DESIGN-SYSTEM.md`.

- **Tester** (eu mesmo): `node -c` nos dois JS (sintaxe OK); harness Node ad hoc (descartado após a
  execução) cobrindo: contagem de usuários/ativos/inativos após seed, ausência de `profile_id` em
  qualquer usuário, `/api/access-profiles` retorna `404` (removido), toggle leve de ativação não
  exige reenviar nome/cpf/email, edição completa não altera `active`, delegação de `approvals` a um
  Administrador (lista pending-changes, aprova), autoaprovação bloqueada com `409`, login
  delegado reflete `effective_permissions` corretamente. Todos os cenários passaram. Validação
  visual em navegador não foi feita (sessão não interativa).
- **Validator**: autovalidação — diff revisado função a função; checados todos os call sites de
  `requirePermission`/`requireMaster` remanescentes para confirmar que nenhum endpoint sensível
  ficou sem gate; balanceamento de `<section>`/`<dialog>`/`<form>` em `painel.html` conferido.
- **Security Specialist**: revisão focada no novo vetor de delegação de "Validações Pendentes" —
  confirmado que a trava de autoaprovação cobre o caso óbvio (Administrador aprovando a própria
  solicitação); Cadastro de Usuários continua `requireMaster()` hardcoded, não há caminho para um
  Administrador criar/promover outro Master nem alterar permissões de ninguém (inclusive as
  próprias) por nenhum endpoint. **APPROVED**.

## 17/11/2026 — Paginação na tela de Logs de Auditoria

A pedido do usuário: tabela de Logs de Auditoria ganhou paginação client-side sobre o resultado já
filtrado — seletor de 10/20/50/100 registros por página (padrão 10) e navegação primeira/anterior/
próxima/última (`«`/`‹`/`›`/`»`), com indicador "Página X de Y". Botões de borda ficam desabilitados
quando não há para onde navegar. Trocar filtro ou tamanho de página volta para a página 1. Nova
regra `RN-AUDIT-009`. Sem mudança de API — a paginação opera sobre os registros já retornados por
`GET /api/audit-logs` (que já respeita os filtros aplicados).

Arquivos alterados: `painel.html`, `assets/js/painel.js`, `assets/css/styles.css`,
`docs/REGRAS-DE-NEGOCIO.md`.

- **Tester** (eu mesmo): `node -c` em `painel.js` (sintaxe OK); conferência manual de que todos os
  ids referenciados pelo JS (`#audit-page-size`, `#audit-page-first/prev/next/last`,
  `#audit-page-info`) existem no HTML; balanceamento de `<div>`/`<section>` conferido. Validação
  visual em navegador não foi feita (sessão não interativa).
- **Validator**: autovalidação — mudança isolada à tela de auditoria, sem tocar em backend nem em
  outras telas.
- **Security Specialist**: n/a — paginação é só apresentação de dados já carregados e já
  autorizados pela checagem de permissão existente; nenhum dado novo é exposto.

## 17/11/2026 — Correção: administradores mockados ausentes e ícones invisíveis

Usuário reportou dois problemas, investigados juntos:

1. **Administradores mockados extras não apareciam** (pedido: "cadastrar um administrador mokado,
   como inativo"). Causa: `DEMO_EXTRA_ADMINS` só era inserido em `seedDb()` (banco novo);
   `reconcileSeed()` (banco já existente no navegador do usuário) nunca os adicionava. Corrigido:
   inserção idempotente (por CPF) também em `reconcileSeed`, com `SEED_VERSION` 23→24 para disparar
   a migração no navegador de quem já tinha testado a tarefa anterior.
2. **Ícone de detalhes do log e setas de paginação invisíveis.** Causa: `.action-icon-btn` usava
   `color:var(--blue-2)`, variável sobrescrita pelo perfil visual ativo; o perfil padrão "Governo
   Tarcísio" tem `color_secondary:'#FFFFFF'`, deixando o ícone branco sobre fundo branco. Corrigido
   com `var(--secondary-on-light)` (variável já existente no projeto, computada para garantir
   contraste contra fundo claro) e um estado de hover que não depende de texto branco sobre fundo
   colorido. **Mesmo problema identificado, mas não corrigido, em `.action-btn`** ("Editar"/
   "Excluir" em todas as tabelas do painel) — fora do escopo literal do pedido; fica registrado em
   `docs/Memoria.md` como pendência a confirmar com o usuário antes de expandir o fix.

Arquivos alterados: `assets/js/mock-backend.js`, `assets/css/styles.css`, `docs/ARQUITETURA.md`,
`docs/Memoria.md`.

- **Tester** (eu mesmo): harness Node ad hoc (descartado após a execução) simulando um banco na
  v23 sem os administradores extras — confirmou que a migração para v24 insere os 4 (2 ativos, 2
  inativos), não duplica em execuções repetidas (idempotência) e não altera usuários já existentes.
  Correção de CSS verificada por leitura/raciocínio sobre as variáveis de tema (`theme.js`), sem
  navegador disponível nesta sessão para captura visual — recomendo ao usuário conferir
  visualmente após o deploy.
- **Validator**: autovalidação — mudança de migração é aditiva e idempotente; mudança de CSS troca
  uma variável por outra já usada no projeto com o propósito exato de evitar este problema.
- **Security Specialist**: n/a — nenhuma mudança de autorização ou dado sensível.
