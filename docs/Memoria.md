# Memória do projeto

Decisões técnicas, convenções e armadilhas não óbvias.

## Decisões

- **11/11/2026 — Protótipo estático, sem backend/banco.** Decisão explícita do usuário: publicar
  no GitHub Pages (`phenriquemachado26/ssp.intranet`), sem servidor nem banco de dados real.
  Motivo: é um protótipo para outras pessoas acompanharem via link, sem custo de infraestrutura.
  Toda a lógica de `app.py` (Python + SQLite) foi portada para `assets/js/mock-backend.js`,
  que intercepta `window.fetch('/api/...')` e persiste em `localStorage`, para que as páginas e
  scripts existentes (`main.js`, `admin.js`, `painel.js`, `avisos.js`) não precisassem ser
  reescritos — eles continuam chamando `fetch('/api/...')` normalmente.

## Armadilhas / pontos não óbvios

- **Resolução de banner é um manifesto estático**, não mais uma listagem de diretório: o antigo
  servidor lia `images_banner/` em tempo real; o mock usa a constante `BANNER_FILES` em
  `mock-backend.js`. Ao adicionar um novo arquivo de banner, é preciso incluir o nome nessa lista
  manualmente, senão o aviso correspondente nunca resolve o banner.
- **Sem persistência compartilhada**: cada navegador/aba tem sua própria cópia de
  `localStorage["sspIntranetDb"]`. Isso não é um bug — é a natureza da opção "estático puro"
  escolhida pelo usuário. Quem acompanha o link vê os dados de demonstração iniciais até mexer
  no próprio painel.
- **Autenticação sem valor de segurança real**: PBKDF2 client-side via `crypto.subtle` foi mantido
  por fidelidade ao desenho original, mas qualquer visitante pode inspecionar ou contornar via
  DevTools. Nunca usar senhas reais neste protótipo. Ver `docs/Auth.md`.
- **Logo de perfil visual: data URL vs. arquivo estático.** `p.logo` pode ser um nome de arquivo
  em `assets/images` (perfis semeados, ex.: `logo-ssp.svg`) OU uma data URL base64 (perfis com
  logo enviada por upload). Qualquer lugar que renderize a logo deve usar
  `window.sspResolveImageSrc(logo, 'assets/images')` — nunca montar o `src` manualmente, senão
  perfis com upload quebram. Limite de 300 KB por imagem (validado no navegador e em
  `profileValues`) existe para não estourar a cota de `localStorage` do navegador (tipicamente
  5-10 MB por origem) com poucos perfis.
- **Logos de perfil visual embutidas como base64 direto no código.** Os perfis de demonstração
  `Período Eleitoral` e `Governo Tarcísio` têm a logo codificada em base64 dentro de
  `assets/js/mock-backend.js` (`DEMO_EXTRA_PROFILES`), gerada a partir de
  `assets/images/BrasaoEstadoSP.png`/`GovTarcisio.png` por um script Node pontual (fora do
  repositório) que fez a substituição de um placeholder de texto pelo conteúdo real — nunca
  colado à mão. Por isso o arquivo `mock-backend.js` ficou com ~400 KB: é esperado, não é bug.
  Se precisar trocar essas imagens no futuro, repita o mesmo processo (ler o PNG, gerar
  `data:image/png;base64,...`, substituir a string no arquivo) em vez de editar o base64 à mão.
- **Ao mostrar a pré-visualização de um banner existente, usar `banner_resolved`, nunca
  `banner_file` direto.** `banner_file` guarda o nome-base sem extensão (ex.: `"CasaPaulista"`,
  convenção antiga de quando o admin digitava o nome) ou uma data URL (upload novo). Só
  `banner_resolved` (calculado no servidor/mock por `resolveBanner`) tem o nome do arquivo REAL
  com extensão (`"CasaPaulista.png"`) ou, se já for upload, a própria data URL. Ao abrir "Editar
  aviso" e popular a pré-visualização do dropzone, usar `item.banner_resolved || item.banner_file`
  — usar só `banner_file` quebra a imagem para qualquer aviso com banner por nome-base (sem
  extensão não há arquivo para carregar). Esse foi um bug real encontrado e corrigido nesta tarefa,
  só visível testando de verdade a tela de edição com Playwright, não apenas lendo o código.
- **Bug visual: borda do campo ficava branca/invisível ao focar, dependendo do perfil ativo.**
  `.auth-card input:focus`, `dialog input:focus/select:focus`, `dialog textarea:focus` e
  `.footer-form input:focus` usavam `border-color:var(--blue-2)` direto — `--blue-2` é a cor
  secundária do perfil visual ATIVO, sem garantia de contraste contra o fundo branco do próprio
  campo. Como o perfil "Governo Tarcísio" (ativo por padrão) tem `color_secondary:#FFFFFF`, a
  borda em foco ficava branca sobre fundo branco, efetivamente invisível — foi assim que o usuário
  percebeu o bug no formulário de rodapé. Corrigido trocando para `var(--secondary-on-light)`, a
  variável que `theme.js` já calcula especificamente para ter contraste garantido contra fundo
  claro (`themeVisibleOn(color_secondary,'#FFFFFF')`, com fallback automático para uma cor escura
  quando a cor do perfil não tem contraste suficiente). Ao adicionar qualquer novo estilo de foco/
  destaque sobre fundo claro, usar `--secondary-on-light` (ou `--primary-on-light`/
  `--detail-on-light`, conforme a cor), nunca `--blue-2`/`--navy`/`--gold` crus.
- **Os 4 itens "Polícia Civil/Militar/Científica/Conseg" só existem em `quick_access`
  (Acessos Rápidos do cabeçalho) — não existem mais em `menu_items` ("Instituições e
  serviços").** Eles chegaram a existir nos dois lugares (histórico: primeiro só em `menu_items`,
  depois adicionados também a `quick_access` com link real; por fim, removidos de `menu_items` a
  pedido do usuário). `reconcileSeed` tem um passo explícito de remoção por título
  (`REMOVED_MENU_TITLES`) para quem já tinha os 4 em `menu_items` de uma versão anterior. Não
  reintroduzir esses 4 em `DEFAULT_MENU_ITEMS` sem confirmar com o usuário.
- **Upgrade de URL "por valor antigo conhecido", não só por padrão (`#`).** Quando o link de
  "Polícia Civil" em `quick_access` foi simplificado (de uma URL longa com parâmetros ADF para
  `https://www.policiacivil.sp.gov.br/`), a heurística de upgrade existente (só trocava URLs que
  começassem com `#`) não pegava esse caso, porque a URL antiga já não era mais uma âncora interna.
  Foi necessário adicionar uma checagem extra comparando com o valor antigo literal
  (`OLD_POLICIA_CIVIL_URL`) em `reconcileSeed`. Ao trocar um valor de demonstração que já não é
  mais o placeholder genérico (`#x` ou vazio), lembrar de fazer o mesmo: checar o valor antigo
  específico, não só os padrões genéricos de "nunca customizado".
- **Playwright já está disponível neste ambiente via `npx` (cache em
  `AppData/Local/npm-cache/_npx/<hash>/node_modules/playwright`), com Chromium funcional —
  mesmo sem `chromium-cli`.** Para rodar um script `.mjs`, importar com caminho absoluto
  `file:///C:/...` (ESM no Windows exige URL de arquivo, não caminho puro). Foi assim que se
  encontrou e corrigiu, nesta tarefa, dois bugs reais de responsividade mobile (ver itens abaixo)
  — sem isso, o CSS teria sido revisado só "de olho", sem confirmação visual real.
- **Bug de responsividade: sidebar do painel travava aberta no celular.** `.dashboard-header`
  não tinha `position`/`z-index` definidos, então o `<aside class="sidebar open">` (z-index:10,
  fixed) ficava por cima do botão `#sidebar-toggle` quando aberto — o toque no botão não
  alcançava mais o botão, só o próprio sidebar. Corrigido dando `position:relative;z-index:11`
  ao `.dashboard-header` dentro do breakpoint de 950px.
- **Bug de responsividade: nav de `avisos.html` sobrepunha o título da página no celular.**
  `.main-nav.open-static{display:flex}` é uma regra fora de qualquer media query (para a navzinha
  simples de `avisos.html` ficar sempre visível), mas ela só define `display`, não `position` —
  então, abaixo de 950px, essa nav herdava `position:absolute;top:80px` da regra genérica
  `.main-nav` do breakpoint mobile e flutuava por cima do conteúdo em vez de empurrá-lo para
  baixo. Corrigido com `.main-nav.open-static{position:static;...}` dentro do mesmo breakpoint.
- **Autofill do navegador pode sobrescrever o formulário de rodapé antes de salvar.** Campos
  rotulados "Logradouro", "Número", "Bairro", "Cidade", "Estado", "CEP" são reconhecidos pelo
  Chrome/Edge como endereço e podem ser preenchidos automaticamente com dados salvos do perfil do
  usuário, substituindo os valores corretos antes do clique em "Salvar rodapé" — o usuário salva
  sem perceber a substituição. Por isso todos os campos do `#footer-form` têm
  `autocomplete="off"` (no `<form>` e em cada `<input>`); como o rodapé então passa a ser tratado
  como "customizado" pela lógica de reconciliação (ver item abaixo), um autofill indevido que já
  foi salvo não se autocorrige sozinho — é preciso editar os campos manualmente ou usar
  "Restaurar dados de demonstração".
- **Atualizar os valores padrão de `FOOTER_DEFAULTS` não basta — é preciso tratar quem já
  reconciliou.** Quando os dados de demonstração do rodapé mudaram (endereço/telefone/horário
  reais da sede da SSP-SP), `reconcileSeed` não podia simplesmente pular por já existir
  `footer_settings` (como faz com contas/perfis novos), senão quem já tinha visitado o site
  ficaria preso nos placeholders antigos (`(00) 0000-0000`) para sempre. A regra adotada: se o
  rodapé salvo ainda parece "intocado" (telefone igual ao placeholder antigo E sem endereço
  preenchido), ele é substituído pelos novos `FOOTER_DEFAULTS` inteiros; caso contrário (o Master
  já customizou algo), só os campos novos que ainda não existem no objeto salvo (ex.:
  `business_hours` quando o campo foi criado depois) são preenchidos, sem tocar no resto. Ao
  adicionar mais campos de demonstração no futuro, replicar esse cuidado — nunca sobrescrever
  dado que pode ter sido editado de verdade pelo Master.
- **Os 4 banners de demonstração (`Arrecadacao.png`, `CasaPaulista.png`, `Hospitalidades.png`,
  `SPTodas.gif`) NÃO foram embutidos como data URL no seed, ao contrário das logos de perfil.**
  Eles pesam entre 700 KB e 2 MB cada (~6 MB juntos) — embutir isso em `mock-backend.js` inflaria
  o arquivo em megabytes e arriscaria estourar a cota de `localStorage` do navegador (tipicamente
  5-10 MB) sozinho. Por isso `DEMO_NOTICES` usa `banner_file` por nome-base (arquivo físico já
  existente em `images_banner/`, servido como estático via HTTP, fora do `localStorage`), não
  upload. O limite de 800 KB em `validateBannerFile`/`MAX_BANNER_DATA_URL_LENGTH` existe
  justamente para impedir que um upload futuro repita esse problema.
- **`footer_settings` é Master-exclusivo, sem fila de validação — decisão deliberada, não
  esquecimento.** Ao contrário de `quick_access`/`menu_items`/`notices`/`header_profiles` (onde
  Administrador do Site também atua, sujeito a aprovação quando o bloqueio está ativo), o usuário
  pediu explicitamente que o rodapé fosse gerenciado só pelo Master. Por isso `PUT
  /api/footer-settings` usa `requireMaster()` direto, sem passar por `queueIfRequired`. Se um dia
  o Site admin precisar editar o rodapé, replicar o padrão de fila das outras entidades.
- **`quick_access` é uma entidade própria, não reaproveita `menu_items`.** Os 4 links do
  cabeçalho público tinham o mesmo título dos itens semeados em "Cadastro Menu" (Polícia Civil,
  Militar, etc.), mas sempre foram HTML fixo, nunca ligados a `menu_items` de fato. Em vez de
  conectar o cabeçalho a `menu_items` (o que mudaria o comportamento do "Instituições e
  serviços"), foi criada uma entidade nova e independente — editar um acesso rápido nunca deve
  afetar o Cadastro Menu, e vice-versa, mesmo que o conteúdo inicial coincida.
- **Renderização do cabeçalho é via âncora, não wrapper `<div>`.** `index.html` tem um
  `<span id="quick-access-anchor" hidden>` dentro de `.main-nav`; `main.js` insere os `<a>` de
  acesso rápido com `insertAdjacentHTML('beforebegin', ...)` para que fiquem como filhos diretos
  de `.main-nav` (a CSS `.main-nav>a` depende disso). Um `<div>` teria quebrado o estilo. O bind
  do clique em links `#` (que abre a seção "Instituições e serviços") também precisou ser movido
  para dentro do `.then()` do fetch, já que os links não existem no DOM até a resposta chegar.
- **Dados de demonstração (`DEMO_ACCOUNTS`/`DEMO_ACCESS_REQUESTS`) usam reconciliação por
  `SEED_VERSION`, não resseed total**: navegadores que já tinham `localStorage` salvo de uma
  versão anterior do protótipo recebem automaticamente as contas/solicitações novas que ainda não
  existem (comparando por CPF), sem apagar nada que o visitante já tenha criado, editado ou
  excluído. Ao adicionar um novo item em `DEMO_ACCOUNTS`/`DEMO_ACCESS_REQUESTS` em
  `assets/js/mock-backend.js`, é obrigatório incrementar `SEED_VERSION` no mesmo arquivo —
  senão o item novo nunca chega a quem já visitou o site antes.
