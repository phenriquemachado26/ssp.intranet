# Arquitetura

Atualizado em: 11/11/2026.

## Estado atual

Aplicação multipágina em HTML5, CSS3 e JavaScript nativo, **100% estática, sem servidor e sem
banco de dados real**. Hospedada no GitHub Pages. Toda a persistência (usuários, perfis, menu,
avisos, fila de validação) é simulada no navegador por `assets/js/mock-backend.js`, que intercepta
`window.fetch('/api/...')` e guarda os dados em `localStorage` — por navegador/aba, sem
compartilhamento entre visitantes. Veja `docs/API.md` para o contrato simulado e `docs/Auth.md`
para o modelo de sessão e suas limitações de segurança.

## Páginas

- `index.html`: portal público, acessos institucionais e informações de contato.
- `admin.html`: autenticação e criação de solicitação de acesso.
- `painel.html`: visão geral e módulo Cadastro de Usuários.
- `avisos.html`: lista pública de todos os avisos ativos.

## Persistência e segurança

- `localStorage["sspIntranetDb"]`: usuários, solicitações, perfis visuais, `change_control`,
  `pending_changes`, `menu_items`, `notices` — mesmo modelo de dados do antigo SQLite, agora em JSON.
- `localStorage["sspIntranetSession"]`: sessão ativa (token conceitual embutido no próprio objeto,
  já que não há servidor para emitir cookie), expira em oito horas.
- Tanto a reordenação por arraste quanto a edição manual da ordem de um item (menu e avisos)
  impedem posições duplicadas — checagem replicada em todos os pontos de escrita, inclusive na
  aprovação de alterações pendentes (equivalente aos antigos índices únicos do SQLite).
- `change_control.carousel_enabled` / `notices_page_blocked`: mesmas regras de antes.
- Senhas: PBKDF2-HMAC-SHA256 (Web Crypto `crypto.subtle`), salt individual, 210 mil iterações —
  mantido por fidelidade ao desenho original, mas **sem valor de segurança real**: qualquer
  visitante tem acesso total ao código-fonte e aos dados no próprio navegador.
- A API simulada nunca devolve hashes de senha nas respostas.
- Logomarca de perfil visual: enviada por upload (`<input type="file">` + `FileReader`), guardada
  como data URL dentro do próprio registro do perfil em `localStorage` (limite de ~300 KB por
  imagem, validado tanto no navegador quanto em `profileValues`). `window.sspResolveImageSrc`
  resolve o valor correto tanto para perfis com logo enviada (data URL) quanto para perfis
  semeados com arquivo estático (ex.: `logo-ssp.svg`).
- `quick_access`: entidade própria para os acessos rápidos do cabeçalho público (título, URL,
  `active`, `display_order`), independente de `menu_items`. Mesmas regras de ordenação única e
  fila de validação das demais entidades administrativas; limite de 5 itens.
- `footer_settings`: objeto único (não é lista) com endereço, telefone, e-mail de suporte,
  "desenvolvido por" e URLs de redes sociais (Facebook/Instagram/YouTube/WhatsApp), exibidos no
  rodapé público. Exclusivo do Administrador Master — sem fila de validação, ao contrário das
  demais entidades administrativas, porque não há papel de Administrador do Site envolvido aqui.
- Resolução de banner (`resolveBanner`) usa um manifesto estático de nomes de arquivo
  (`BANNER_FILES` em `mock-backend.js`), já que não existe mais servidor para listar o diretório
  `images_banner/` dinamicamente — precisa ser atualizado manualmente a cada novo arquivo.

Reiniciar o navegador não apaga os dados (ficam em `localStorage`); o botão "Restaurar dados de
demonstração" em `admin.html` limpa tudo e reaplica a semente inicial.

## Próxima arquitetura recomendada (quando sair de protótipo)

- Backend real (serverless ou dedicado) com banco gerenciado mínimo (ex.: Postgres/Neon free tier,
  como no PortalCGI) ou um KV leve (ex.: Upstash Redis), conforme a necessidade de persistência
  compartilhada entre usuários.
- Hashing de senha com Argon2id no servidor (PBKDF2 client-side não deve ser tratado como controle
  de acesso real).
- Sessões com token revogável emitido e validado no servidor, com TLS.
- Banco de dados relacional com restrições únicas para CPF e e-mail.
- Registro imutável de quem aprovou, recusou ou alterou cada acesso.
- Variáveis de ambiente para configurações e dados de contato.

## Convenções

- Arquivos e URLs em minúsculas, sem espaços.
- Um arquivo JavaScript por contexto de página.
- Tokens visuais centralizados em `:root` no CSS.
- Conteúdo, estilos, scripts, imagens e documentação em diretórios próprios.
- Alterações de regra de negócio e design devem acompanhar a atualização da documentação no mesmo conjunto de mudanças.

## Histórico

- 11/11/2026: removido o backend Python (`app.py`) e o SQLite (`data/intranet.db`); toda a
  persistência passou a ser simulada em `localStorage` via `assets/js/mock-backend.js`. Projeto
  publicado como protótipo estático no GitHub Pages, sem banco de dados real.
- 11/11/2026: logomarca de perfil visual passou a ser upload de imagem (data URL em
  `localStorage`, até 300 KB) em vez de nome de arquivo estático; título da página fixado em
  "Intranet SSP" para todos os perfis.
- 11/11/2026: adicionado o campo `locked` em `header_profiles` (perfil protegido: sem edição nem
  exclusão por ninguém) e semeados 2 perfis extras (`Período Eleitoral`, protegido; `Governo
  Tarcísio`, não protegido), com logos embutidas como data URL diretamente em
  `assets/js/mock-backend.js` a partir de `assets/images/BrasaoEstadoSP.png` e
  `assets/images/GovTarcisio.png`. Perfil ativo por padrão no seed passou a ser `Governo Tarcísio`.
- 11/11/2026: nova entidade `quick_access` (acessos rápidos do cabeçalho, até 5, com
  ocultar/exibir); os 4 links antes fixos no HTML de `index.html` viraram renderização dinâmica
  via `GET /api/quick-access`, inseridos em `#quick-access-anchor` por `assets/js/main.js`.
- 11/11/2026: tela "Gestão do Cabeçalho" renomeada para "Cabeçalho e Rodapé"; nova entidade
  singleton `footer_settings` (endereço, contato, redes sociais), exclusiva do Master, renderizada
  no rodapé público por `assets/js/theme.js` (`window.applySspFooter`).
- 11/11/2026: dados de demonstração do rodapé atualizados (endereço/telefone/horário de
  atendimento da sede da SSP-SP, fornecidos como mock); reconciliação ganhou lógica de "upgrade"
  para quem já tinha o placeholder antigo sem perder customizações reais do Master.
- 11/11/2026: acessos rápidos passaram a usar os links externos reais dos órgãos (abrindo em
  nova aba); mesma lógica de "upgrade" aplicada a quem ainda tinha as âncoras internas antigas.
  Corrigidos dois bugs de responsividade mobile (sidebar do painel presa aberta por sobreposição
  de z-index; nav de `avisos.html` sobrepondo o título por herdar `position:absolute` do
  breakpoint), encontrados com Playwright + Chromium headless.
- 11/11/2026: `menu_items` ("Instituições e serviços") ganhou `DEFAULT_MENU_ITEMS` com 15 itens
  extras de demonstração (sistemas internos reais da SSP-SP); link de "Polícia Civil" nos
  acessos rápidos simplificado. SEED_VERSION 7->8.
- 11/11/2026: os 4 acessos institucionais removidos de `menu_items` (seguem só em `quick_access`),
  SEED_VERSION 8->9. Rodapé: Facebook/Instagram/YouTube semeados com perfis oficiais reais,
  SEED_VERSION 9->10. Corrigido bug de contraste (borda de campo em foco usando `--blue-2` cru em
  vez de `--secondary-on-light`) que ficava invisível com perfis de cor secundária clara.
- 11/11/2026: campo de upload de logomarca (perfis visuais) redesenhado como área de
  arrastar-e-soltar (`setupImageDropzone`, reaproveitada também pelo banner de avisos). Banner de
  aviso passou de campo de texto (nome-base) para upload de imagem (até 800 KB, `validateBannerFile`
  + `MAX_BANNER_DATA_URL_LENGTH`); `resolveBanner` agora retorna a própria data URL sem passar pelo
  manifesto estático quando o valor já é uma imagem enviada. Semeados 4 avisos de demonstração
  (`DEMO_NOTICES`) com banner por nome-base, já ativos e no carrossel. SEED_VERSION 10->11.
- 11/11/2026: botões de Hospitalidades e São Paulo por Todas ganharam `button_url` específico
  (antes usavam o mesmo link genérico de todos os avisos); reconciliação ganhou upgrade por valor
  antigo conhecido, igual ao já usado para o link de Polícia Civil. SEED_VERSION 11->12.
- 11/11/2026: descrições de Arrecadação/São Paulo por Todas ampliadas, botão removido de
  Arrecadação, ordem de `DEMO_NOTICES` invertida (São Paulo por Todas primeiro). Reconciliação
  ganhou upgrade de descrição (por texto antigo conhecido), upgrade de botão por par
  nome+URL (em vez de só URL) e reordenação condicional — só reordena se os 4 títulos ainda
  estiverem exatamente na sequência antiga, preservando qualquer reordenação manual do Master.
  Loop de "adicionar item semeado faltante" passou de inserir-no-topo-e-empurrar para anexar no
  fim, evitando inversão de ordem ao adicionar múltiplos itens de uma vez. SEED_VERSION 12->13.
- 11/11/2026: novo aviso de demonstração "Consulta ao Conselho de Usuários" semeado como primeiro
  da ordem (`images_banner/banner_ConselhoUsuarios.png`), para também aparecer no pop-up de
  destaque da página inicial. Reaproveitada a reordenação condicional já existente (reassinala
  `display_order` de todos os avisos pela ordem atual de `DEMO_NOTICES` quando os 4 avisos
  originais ainda estão intocados) para posicioná-lo em primeiro sem precisar de lógica nova de
  "inserir no topo" na reconciliação. SEED_VERSION 13->14.
- 11/11/2026: nova função `applyElectoralCascade(db, profile, wasElectoralActive)` chamada tanto
  no `PUT /api/profiles/<id>` (ação `activate`) quanto em `applyPendingChange` (mesma ação, via
  fila de aprovação): ao ativar o perfil `Período Eleitoral`, força
  `change_control.notices_page_blocked=true`, `change_control.carousel_enabled=false` e
  `active=false`/`active_carousel=false` em todos os avisos; ao sair dele (ativar qualquer outro
  perfil), restaura só as duas flags globais (`notices_page_blocked=false`,
  `carousel_enabled=true`), sem mexer nas flags individuais dos avisos — mesmo padrão já usado em
  `PUT /api/change-control` para o bloqueio geral de alterações. `DELETE /api/profiles/<id>` (e o
  branch `delete` de `applyPendingChange`) ganharam checagem de quantidade mínima
  (`db.header_profiles.length <= 2` bloqueia a exclusão), redundante na prática com a proteção já
  existente da Paleta Padrão, mas mantida como regra genérica e explícita.
- 11/11/2026: rodapé reestruturado — `#footer-address-line`/`#footer-hours-line` agora têm um
  `<span class="footer-info-text">` interno (o texto é escrito ali, não mais direto no elemento
  com `hidden`, para não apagar o ícone ao lado); e-mail e telefone viraram
  `#footer-email-item`/`#footer-phone-item` (wrappers com ícone + link, visibilidade controlada no
  wrapper) dentro de um único `.footer-contact-line`, colocando-os na mesma linha. `developed_by`
  teve o texto padrão alterado para "CGI - Coordenadoria de Gestão da Informação", com upgrade de
  reconciliação para quem ainda tinha o texto genérico anterior. SEED_VERSION 14->15.
- 11/11/2026: organização de arquivos de imagem. Criada `assets/images/social/` com 8 logomarcas
  de redes sociais fornecidas pelo usuário (Facebook/Instagram/WhatsApp/YouTube, temas claro e
  escuro, 512px) — **ainda não usadas por nenhum código**; o rodapé público continua exibindo os
  ícones-letra gerados em `theme.js` (`SOCIAL_NETWORKS`) até que uma tarefa futura troque por essas
  imagens. Removidos `docs/logo/BrasaoEstadoSP.png` e `docs/logo/GovTarcisio.png` (duplicatas
  binárias exatas dos arquivos já existentes em `assets/images/`, confirmado por hash). Removidos
  de `images_banner/` e do manifesto `BANNER_FILES`: `Teste.png`, `MuralhaPaulista.png` e
  `banner_periodoeleitoral.png` — herdados do protótipo Python original, sem vínculo com nenhum
  aviso ou perfil semeado nesta versão estática.
- 11/11/2026: corrigido `applyElectoralCascade` — ao sair do perfil `Período Eleitoral`, além de
  restaurar `change_control.notices_page_blocked=false`/`carousel_enabled=true`, agora também
  reativa todos os avisos em massa (`active=true`, `active_carousel=true`), a pedido do usuário.
  Substitui o comportamento anterior (flags individuais preservadas, exigindo reativação manual).
- 11/11/2026: nova função `queueProfileChange(db, session, action, entityId, payload)` substitui
  `queueIfRequired` nos 3 pontos de escrita de perfis (POST/PUT/DELETE `/api/profiles`): enfileira
  SEMPRE para Administrador do Site (ignora `change_control.locked`), diferente de todas as outras
  entidades administrativas. Mensagens de retorno (202) customizadas por ação, orientando contato
  com um Master. Validação de payload (`profileValues`, limite de 5, nome duplicado) movida para
  ANTES do enfileiramento nos endpoints de criação/edição, para rejeitar dados inválidos
  imediatamente em vez de só falhar na aprovação; `applyPendingChange` ganhou a mesma checagem de
  nome duplicado nos branches `create`/`update` de perfil, que não existia antes.
- 11/11/2026: `applySspFooter()` passou a buscar também `/api/theme` (além de `/api/footer-settings`)
  para calcular a luminância da cor primária do perfil ativo (`themeLum`, já existente no arquivo)
  e escolher a variante `tema-claro`/`tema-escuro` de cada logomarca em `assets/images/social/`.
  `SOCIAL_NETWORKS` trocou a 3ª coluna de letra (`f`/`I`/`Y`/`W`) para slug de arquivo
  (`facebook`/`instagram`/`youtube`/`whatsapp`); o `<a>` do rodapé agora contém um `<img>` em vez
  de texto puro.
- 11/11/2026: adicionado `<link id="site-favicon" rel="icon">` ao `<head>` das 4 páginas
  (index/avisos/admin/painel); `applySspTheme()` em `theme.js` passou a atualizar seu `href`/`type`
  junto com a logomarca do cabeçalho, reaproveitando `window.sspResolveImageSrc` (já usado para a
  logo) e um novo helper `faviconType(src)` (deduz o MIME a partir do prefixo `data:...` ou da
  extensão do arquivo estático).
- 11/11/2026: `#approvals-badge` (classe `.side-badge`) adicionado ao item de menu "Validações
  pendentes" em `painel.html`; populado em `render()` (`assets/js/painel.js`) reaproveitando
  `pendingChanges.length`, já calculado ali como `changePending`. `hidden` quando zero.
- 11/11/2026: `theme.js` ganhou `isNearBlack(hex)` (todas as 3 componentes RGB ≤16) e
  `faviconOnBlackBacking(src)` (desenha a logo resolvida sobre um canvas 64x64 com fundo preto,
  "contain" com ~12% de margem, exporta via `canvas.toDataURL('image/png')`). `applySspTheme()`
  usa essa composição quando `color_primary` do perfil ativo é preto/quase-preto; caso contrário
  mantém o comportamento anterior (favicon = logo resolvida direto, com `faviconType` deduzindo o
  MIME). Fallback silencioso para a logo original se o canvas falhar (ex.: tainted canvas).
- 11/11/2026: novo aviso de demonstração "Agência SP" semeado como último da ordem
  (`images_banner/ssp-agenciaSP.png`). Nenhum campo/flag novo foi criado para "ativo só no
  carrossel": a arquitetura já reaproveita a regra existente de `homeNotices = notices.slice(0,5)`
  em `assets/js/main.js` — por ficar na 6ª posição, o item sai da home mas continua elegível para
  `setupCarousel(notices, ...)`, que opera sobre a lista completa de avisos ativos, não só os
  cinco primeiros. SEED_VERSION 15->16.
- 11/11/2026: revertido `isNearBlack`/`faviconOnBlackBacking` (commit anterior de composição de
  favicon com fundo preto) via `git revert` — usuário não gostou do resultado. `applySspTheme()`
  volta a atribuir a logo resolvida direto ao favicon (`favicon.href=resolvedLogo`), sem canvas.
- 11/11/2026: novo aviso "Hospitalidade-banner" (carrossel-only) semeado como último da ordem,
  mesmo mecanismo do Agência SP (reaproveita o corte de "5 primeiros" em `main.js`, sem flag nova).
  `seedDb()`'s mapeamento de notices passou a respeitar `item.active_carousel` por item quando
  definido (antes sempre forçava `true`), para permitir um item semeado já nascer com o carrossel
  desligado (o aviso original de Hospitalidade). Reconciliação ganhou upgrade dedicado: desliga
  `active_carousel` do aviso original de Hospitalidade se ainda estiver no valor padrão (`true`),
  sem tocar em customização real do Master. SEED_VERSION 16->17.
