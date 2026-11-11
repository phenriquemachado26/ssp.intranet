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
