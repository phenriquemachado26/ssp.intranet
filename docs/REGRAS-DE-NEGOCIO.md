# Regras de Negócio — Intranet SSP (protótipo)

Atualizado em: 13/11/2026. Reescrita completa, organizada por tela e por entidade, a partir da
leitura integral do código-fonte atual (`assets/js/mock-backend.js`, `main.js`, `avisos.js`,
`theme.js`, `admin.js`, `painel.js`, `index.html`, `avisos.html`, `admin.html`, `painel.html`).

> Protótipo 100% estático, sem servidor nem banco de dados real: todas as regras abaixo são
> simuladas no navegador (`assets/js/mock-backend.js`) e persistidas em `localStorage`, por
> navegador/aba — sem compartilhamento entre visitantes. Ver `docs/Auth.md` e `docs/ARQUITETURA.md`.

## Como ler este documento

- Cada regra tem um ID estável `RN-<DOMÍNIO>-NNN` e um status entre parênteses:
  `confirmada` (já validada pelo usuário, em uso), `⚠ inferida` (extraída só do código, ainda sem
  confirmação explícita do usuário — pode ser bug, não regra), `a definir` ou `revogada`.
- Telas usam `T-NN`; entidades de dados (tabelas do `localStorage["sspIntranetDb"]`) usam `E-NOME`.
- Este documento descreve o **comportamento real implementado hoje**, não um desenho ideal. Onde o
  comportamento divergia do que um documento anterior já havia descrito, a divergência foi
  resolvida com o usuário e registrada no "Histórico", em vez de silenciada.

## Mapa de telas e entidades

| Tela   | Nome                                   | Arquivo(s)                              |
| ------ | --------------------------------------- | ---------------------------------------- |
| `T-01` | Portal público                          | `index.html`, `assets/js/main.js`       |
| `T-02` | Página de avisos                        | `avisos.html`, `assets/js/avisos.js`    |
| `T-03` | Login e solicitação de acesso           | `admin.html`, `assets/js/admin.js`      |
| `T-04` | Painel — Visão Geral                    | `painel.html` (`#overview-view`)        |
| `T-05` | Painel — Cadastro de Usuários           | `painel.html` (`#users-view`)           |
| `T-06` | Painel — Identidade Visual (ex-"Cabeçalho e Rodapé") | `painel.html` (`#headers-view`)         |
| `T-07` | Painel — Cadastro Menu                  | `painel.html` (`#menu-view`)            |
| `T-08` | Painel — Cadastro de Avisos             | `painel.html` (`#notices-view`)         |
| `T-09` | Painel — Validações pendentes           | `painel.html` (`#approvals-view`)       |
| `T-10` | ~~Painel — Perfis e Permissões~~ (revogada, mesclada em T-05) | — |
| `T-11` | Painel — Logs de Auditoria              | `painel.html` (`#audit-view`)           |

| Entidade        | Nome                         | Tabela em `localStorage["sspIntranetDb"]` |
| ---------------- | ----------------------------- | -------------------------------------------- |
| `E-USUARIO`      | Administrador (inclui permissões próprias, campo `permissions`) | `users`      |
| `E-SOLICITACAO`  | Solicitação de acesso        | `access_requests`                            |
| `E-PERFIL`       | Perfil visual                 | `header_profiles`                            |
| ~~`E-PERFILACESSO`~~ | revogada (17/11/2026) — era perfil de acesso nomeado/reutilizável; ver `RN-PERM-005` | — |
| `E-ACESSO`       | Acesso rápido                 | `quick_access`                               |
| `E-MENU`         | Item de menu                  | `menu_items`                                 |
| `E-AVISO`        | Aviso                         | `notices`                                    |
| `E-RODAPE`       | Configurações do rodapé (singleton) | `footer_settings`                      |
| `E-CONTROLE`     | Controle de alterações (singleton)  | `change_control`                       |
| `E-PENDENCIA`    | Alteração pendente            | `pending_changes`                            |
| `E-LOG`          | Registro de auditoria (somente leitura) | `audit_logs`                       |

## Perfis administrativos

- **RN-PERM-001** `revogada` (17/11/2026): Existem dois perfis de administrador: **Administrador
  Master** (`role: "master"`) e **Administrador do Site** (`role: "site"`). Não há outros papéis.
  **Motivo da revogação**: substituída por `RN-PERM-005`.
- **RN-PERM-002** `confirmada`: Administrador Master tem acesso completo e fixo: cadastra
  administradores e define suas permissões, concede ou retira o papel de Master (`RN-USR-004`),
  gerencia Cadastro de Usuários, e gerencia perfis visuais/rodapé/acessos rápidos/menu/avisos
  diretamente (sem fila).
- **RN-PERM-003** `revogada` (17/11/2026): O perfil de acesso semeado "Administrador do Site"
  replica o antigo papel fixo... **Motivo da revogação**: Perfis e Permissões deixou de ser uma
  entidade nomeada/reutilizável (ver `RN-PERM-005`); os dois administradores de demonstração
  (Rafael, Juliana) continuam semeados com as mesmas permissões de antes, só que gravadas
  diretamente no próprio usuário, sem um perfil nomeado intermediário.
- **RN-PERM-004** `confirmada`: Toda ação administrativa de um Administrador não-Master sobre
  perfis visuais, itens de menu, acessos rápidos e avisos passa pelas regras de fila descritas em
  **T-09**, desde que suas permissões concedam a funcionalidade necessária (`RN-PERM-009`); um
  Administrador não-Master nunca aplica essas mudanças diretamente no site público.
- **RN-PERM-005** `confirmada`: Cada Administrador não-Master tem suas próprias permissões,
  configuradas individualmente no cadastro (**T-05**, não mais um perfil nomeado e reutilizável).
  São 6 funcionalidades, cada uma com um único toggle (liberado ou não, sem granularidade de ação):
  Identidade Visual, Cadastro Menu, Cadastro de Avisos, Acessos Rápidos, Validações Pendentes e
  Logs de Auditoria.
- **RN-PERM-006** `confirmada`: **Cadastro de Usuários** continua de uso **exclusivo do
  Administrador Master no backend**, de forma fixa — não é uma funcionalidade configurável via
  toggle (é a própria tela onde as permissões são definidas). Isso evita que um Administrador
  ganhe o poder de criar/promover outros Masters ou alterar as permissões de qualquer um,
  incluindo as próprias (escalonamento de privilégio).
- **RN-PERM-007** `confirmada`: Somente o Administrador Master pode conceder ou retirar o papel de
  Master de um usuário (`RN-USR-004`) e cadastrar/editar/ativar/inativar administradores (**T-05**).
  **Validações Pendentes** pode ser delegada a um Administrador através do toggle correspondente
  (diferente da decisão anterior deste projeto, que mantinha essa área sempre fixa no Master —
  revisto nesta tarefa a pedido do usuário); um Administrador delegado não pode, porém, aprovar ou
  recusar uma alteração que ele mesmo solicitou (`RN-BLOQ-013`).
- **RN-PERM-008** `revogada` (17/11/2026): O perfil de acesso semeado "Administrador do Site" não
  pode ser excluído... **Motivo da revogação**: não existe mais perfil de acesso como entidade.
- **RN-PERM-009** `confirmada`: A permissão de funcionalidade do Administrador é checada **antes**
  das regras de fila (`RN-BLOQ-003`, `RN-PERFIL-009`): sem a funcionalidade liberada, a ação é
  rejeitada (`403`) e nem chega a entrar na fila de validação do Master.

## T-01 — Portal Público (`index.html`)

### Cabeçalho e navegação

- **RN-PORTAL-001** `confirmada`: O cabeçalho exibe marca (logomarca + "Intranet SSP"), menu
  responsivo (`menu-toggle`), acessos rápidos, botão "Avisos" (oculto quando a página de avisos
  está bloqueada — ver `RN-BLOQ-006`) e o link "Adm" para `admin.html`.
- **RN-PORTAL-002** `E-ACESSO` `confirmada`: Os acessos rápidos são carregados de `GET
  /api/quick-access` e inseridos antes do botão "Avisos". Links internos (`#` ou `/`) abrem na
  mesma aba; demais URLs abrem em nova aba (`target="_blank" rel="noopener noreferrer"`).
- **RN-PORTAL-003** `confirmada`: "Instituições e serviços" inicia recolhida; um clique expande o
  conteúdo e rola suavemente até a seção.
- **RN-PORTAL-004** `E-MENU` `confirmada`: Os itens de "Instituições e serviços" vêm de `GET
  /api/menu` (somente itens ativos para quem não está autenticado) e são renderizados como cartões
  que **sempre** abrem em nova aba, independentemente do destino da URL.

### Carrossel de imagens

- **RN-PORTAL-005** `E-AVISO` `confirmada`: O carrossel só é exibido quando
  `change_control.carousel_enabled = true` **e** existe ao menos um aviso ativo (`active`),
  marcado para carrossel (`active_carousel`) e com banner resolvido. Sem slides elegíveis, o
  carrossel permanece oculto mesmo com a configuração geral em "Sim".
- **RN-PORTAL-006** `confirmada`: O carrossel ocupa toda a largura da página; quando visível, a
  área institucional superior reduz de altura (classe `carousel-enabled` no `body`). Possui
  setas anterior/próximo e indicadores (dots); com apenas 1 slide, setas e dots ficam ocultos;
  com 2 ou mais, avança automaticamente a cada 6 segundos.

### Avisos na página inicial

- **RN-PORTAL-007** `E-AVISO` `confirmada`: Até 5 avisos ativos (ordenados por `display_order`) são
  exibidos como cartões ("destaque") na home. O 6º aviso ativo em diante não aparece como cartão na
  home, mas continua elegível para o carrossel (que considera todos os avisos ativos com
  `active_carousel` e banner, não só os 5 primeiros) e para a listagem completa em `avisos.html`.
- **RN-PORTAL-008** `confirmada`: Sem nenhum aviso ativo, a seção inteira de avisos da home fica
  oculta (`hidden`).
- **RN-PORTAL-009** `confirmada`: Textos longos de aviso mostram "Ver mais"/"Ver menos" (calculado
  comparando a altura do texto renderizado); ao expandir um cartão, qualquer outro cartão expandido
  na mesma página é recolhido automaticamente. O botão de link (quando houver) fica à esquerda; o
  controle de expansão, à direita.
- **RN-PORTAL-010** `confirmada`: Quebras de linha digitadas na descrição (`\n`) são preservadas
  visualmente como linhas/parágrafos distintos (`white-space: pre-line` em `.notice-description`).

### Pop-up de destaque

- **RN-PORTAL-011** `E-AVISO` `confirmada`: A cada carregamento da home, abre um pop-up modal
  (`#highlight-dialog`) com o **primeiro** aviso, na ordem de `display_order`, que possua banner
  resolvido, entre os avisos retornados por `GET /api/notices` (que já filtra só ativos para quem
  não está autenticado). Avisos sem banner são ignorados nessa escolha; sem nenhum aviso com
  banner, o pop-up não aparece. Fecha por botão dedicado.

### Rodapé público

- **RN-PORTAL-012** `E-RODAPE` `confirmada`: O rodapé é exibido em todas as páginas públicas
  (`index.html`, `avisos.html`) com: marca + nome da intranet; linha de endereço (só aparece se ao
  menos um campo de endereço estiver preenchido); e-mail e telefone lado a lado na mesma linha
  (cada um some individualmente se vazio); horário de atendimento; ícones de redes sociais (ocultos
  individualmente quando a URL está vazia); texto "Desenvolvido por".
- **RN-PORTAL-013** `confirmada`: O ícone de cada rede social é a logomarca real
  (`assets/images/social/<rede>-tema-<claro|escuro>-512.png`), escolhida automaticamente pelo
  contraste da cor primária do perfil visual ativo (fundo escuro → variante "tema-escuro"; fundo
  claro → "tema-claro").
- **RN-PORTAL-015** `E-RODAPE` `E-PERFIL` `confirmada`: Enquanto o perfil visual "Período Eleitoral"
  está ativo, os ícones de redes sociais do rodapé ficam completamente ocultos (bloco
  `#footer-social` com `hidden=true`), independente de haver URL cadastrada para cada rede. Ao
  ativar qualquer outro perfil, os ícones voltam a ser exibidos normalmente, seguindo a regra
  individual de ocultação por URL vazia (RN-PORTAL-012).

### Perfil visual aplicado (tema)

- **RN-PORTAL-014** `E-PERFIL` `confirmada`: O perfil visual ativo (`GET /api/theme`) define, em
  toda página pública e administrativa: cores primária/secundária/detalhe (com variações de hover e
  contraste calculadas em tempo real), fonte (se diferente de "Padrão institucional"), logomarca
  (todo elemento marcado `data-theme-logo` ou cujo `src` termine em `logo-ssp.svg`), o texto da
  marca (título fixo "Intranet SSP") e o favicon — a mesma imagem da logomarca, com tipo MIME
  deduzido do prefixo `data:` (upload) ou da extensão do arquivo estático.

## T-02 — Página de Avisos (`avisos.html`)

- **RN-AVISO-001** `confirmada`: Lista todos os avisos ativos (`GET /api/notices`), cada um com
  banner (se houver), título, descrição completa e "Ver mais"/"Ver menos" (mesma lógica de
  expansão única do T-01, incluindo o caso de aviso sem banner mas com texto longo).
- **RN-AVISO-002** `E-CONTROLE` `confirmada`: A verificação de bloqueio é **inteiramente
  client-side**: a página carrega normalmente e, assim que o JavaScript consulta `GET
  /api/site-settings`, redireciona para `index.html` se `notices_page_blocked = true`. **Não há
  valor de controle de acesso real** — sem servidor para recusar a entrega do HTML com um 403 real;
  quem desabilitar JavaScript ou inspecionar a resposta simulada ainda vê a página. Ver `docs/Auth.md`.
- **RN-AVISO-003** `confirmada`: Sem nenhum aviso ativo, exibe o estado vazio "Nenhum aviso ativo no
  momento."

## T-03 — Login e Solicitação de Acesso (`admin.html`)

### Autenticação

- **RN-LOGIN-001** `confirmada`: O login (`POST /api/login`) busca um usuário **ativo** cujo CPF
  bata com o informado e valida a senha com PBKDF2-HMAC-SHA256 (salt próprio, 210 mil iterações,
  Web Crypto API). CPF/senha inválidos ou usuário inativo retornam sempre a mesma mensagem genérica
  "CPF ou senha inválidos." (sem indicar qual campo errou).
- **RN-LOGIN-002** `confirmada`: Sessão válida por 8 horas, salva em
  `localStorage["sspIntranetSession"]` como `{ id, name, cpf, email, role, active, created_at,
  expires }`. Sem cookie `HttpOnly` real (não há servidor para emiti-lo). Ver `docs/Auth.md`.
- **RN-LOGIN-003** `confirmada`: Login bem-sucedido redireciona para `painel.html`. Qualquer chamada
  autenticada que receba `401` do mock redireciona de volta para `admin.html` (sessão expirada).
- **RN-LOGIN-004** `confirmada`: O campo CPF oferece um seletor com as contas de demonstração
  (`window.sspDemoAccounts()`); escolher uma preenche CPF e senha automaticamente. Exposição
  intencional da senha em texto puro, documentada em `docs/Auth.md` — sem valor de segurança real.
- **RN-LOGIN-005** `confirmada`: Botão "Restaurar dados de demonstração" apaga todo o
  `localStorage` do navegador e recarrega a página, resemeando os dados iniciais. Usa o `confirm()`
  nativo do navegador (não o diálogo estilizado `#confirm-dialog` usado no restante do protótipo).

### Solicitação de acesso (`E-SOLICITACAO`)

- **RN-SOLIC-001** `confirmada`: O solicitante informa nome, CPF, e-mail institucional e
  unidade/setor; todos obrigatórios (`POST /api/access-requests`), sem validação de formato de CPF
  ou e-mail além da obrigatoriedade (ver "Restrições conhecidas").
- **RN-SOLIC-002** `confirmada`: A solicitação é criada com status `pending`. Não há limite de
  solicitações por CPF nem checagem de duplicidade na criação.
- **RN-SOLIC-003** `confirmada`: Somente um Administrador Master pode aprovar (`approved`) ou
  recusar (`rejected`) uma solicitação (`PUT /api/requests/<id>`, `requireMaster()`).
- **RN-SOLIC-004** `E-USUARIO` `confirmada`: Ao aprovar, se ainda não existir um usuário com aquele
  CPF, o sistema cria um usuário **ativo** com perfil `Administrador do Site` e uma senha temporária
  aleatória (18 caracteres hexadecimais), devolvida uma única vez na mensagem de sucesso para o
  Master repassar ao solicitante. Se já existir um usuário com aquele CPF, a solicitação só muda de
  status — nenhum usuário duplicado é criado nem senha é gerada.
- **RN-SOLIC-005** `confirmada`: A promoção de um Administrador do Site para Master não acontece
  automaticamente pela aprovação da solicitação; exige uma ação explícita e posterior de edição do
  usuário por um Master (ver `RN-USR-004`).

## T-04 — Painel: Visão Geral

- **RN-OVERVIEW-001** `confirmada`: Mostra nome, perfil (Master/Administrador do Site) e iniciais
  do administrador logado.
- **RN-OVERVIEW-002** `confirmada`: Indicadores "Usuários cadastrados" e "Solicitações pendentes"
  ficam como "Restrito" para Administrador do Site (ele não tem acesso a `GET /api/users` nem `GET
  /api/requests`); no primeiro login da sessão, recebe um aviso informando que o Cadastro de
  Usuários permanece restrito ao Master.
- **RN-OVERVIEW-003** `confirmada`: Indicadores de conteúdo (itens de menu, avisos cadastrados e
  ativos, perfis visuais e limite de 5, tema ativo com suas 3 cores, situação de publicação —
  direta ou com validação — e total de alterações pendentes) são visíveis para **ambos** os
  perfis, lidos diretamente do `localStorage` via as rotas GET públicas/autenticadas.
- **RN-OVERVIEW-004** `E-CONTROLE` `confirmada`: Três controles exclusivos do Master, cada um
  apresentado como seletor "Não/Sim" com confirmação antes de aplicar (cancelar restaura o estado
  anterior): "Exigir validação do Master" (ver **T-09**), "Exibir carrossel" e "Bloquear página de
  avisos". Os dois últimos também podem ser alterados automaticamente por outras regras (cascata do
  bloqueio geral e cascata do Período Eleitoral — ver `RN-BLOQ-008` e `RN-BLOQ-012`), mas continuam
  editáveis manualmente pelo Master a qualquer momento.
- **RN-OVERVIEW-005** `confirmada`: Ao marcar "Sim" em "Exigir validação do Master", um pop-up
  mostra apenas a regra principal ("Todas as alterações feitas por Administradores do Site
  precisarão da validação de um Administrador Master.") seguida de "Deseja continuar?" — as demais
  consequências de fato ocorrem (ver `RN-BLOQ-008`), só não são mais detalhadas no texto do pop-up.

## T-05 — Painel: Cadastro de Usuários (`E-USUARIO`, `E-SOLICITACAO`)

Exclusivo do Administrador Master — item oculto no menu lateral e view inacessível para
Administrador do Site.

### Cadastro e edição

- **RN-USR-001** `confirmada`: Somente Master pode usar "Novo administrador" (`POST /api/users`,
  `requireMaster()`).
- **RN-USR-002** `confirmada`: Nome, CPF, e-mail institucional, tipo de acesso e senha temporária
  são obrigatórios na criação; a senha deve ter ao menos 8 caracteres.
- **RN-USR-003** `confirmada`: CPF e e-mail devem ser únicos entre os administradores cadastrados
  **no mock daquele navegador** (checado tanto na criação quanto na edição, excluindo o próprio
  registro) — sem equivalente real entre navegadores/visitantes diferentes, já que não há banco
  compartilhado.
- **RN-USR-004** `confirmada`: Master pode editar nome, CPF, e-mail, tipo de acesso (Administrador
  Master ou Administrador — é assim que a promoção/rebaixamento de Master acontece, ver
  `RN-SOLIC-005`) e senha (campo de senha em branco na edição mantém a senha atual). O status
  ativo/inativo **não** faz parte deste formulário — é alterado pela flag deslizante da lista
  (`RN-USR-009`), não pelo cadastro completo.
- **RN-USR-005** `confirmada`: Um administrador **não pode excluir a própria conta**
  (`DELETE /api/users/<id>` rejeita com 409 quando `id === session.id`) — endpoint mantido na API
  para uso avançado, mas não é mais chamado pela interface (ver `RN-USR-009`).
- **RN-USR-005b** `revogada` (17/11/2026): O cadastro "Administrador Master" principal da
  demonstração (CPF `000.000.000-00`) não pode ser excluído por ninguém, nem mesmo por outro Master
  logado — checagem por CPF (`MASTER_PRINCIPAL_CPF`), independente do `id` do registro. **Motivo da
  revogação**: generalizada por `RN-USR-007`, que protege qualquer conta Master (não só a de
  demonstração) quando for a última ativa, e cobre também desativação e rebaixamento de papel, não
  só exclusão.
- **RN-USR-007** `confirmada`: Não é possível **excluir, desativar ou rebaixar** (remover o papel
  de Master) a **última conta de Administrador Master ativa** do sistema — a ação é rejeitada com
  `409`, qualquer que seja o Master autenticado executando-a. Uma conta Master inativa, ou quando
  existe outro Master ativo, não é protegida por esta regra.
- **RN-USR-008** `confirmada`: Ao escolher "Tipo de acesso" = **Administrador** no cadastro, um
  pop-up é exibido com um toggle (flag deslizante) por funcionalidade — Identidade Visual, Cadastro
  Menu, Cadastro de Avisos, Acessos Rápidos, Validações Pendentes, Logs de Auditoria (`RN-PERM-005`).
  Ao escolher **Administrador Master**, nada precisa ser configurado — acesso total e fixo
  (`RN-PERM-002`). O pop-up pode ser reaberto a qualquer momento pelo botão "Configurar permissões",
  inclusive ao editar um administrador já cadastrado.
- **RN-USR-009** `confirmada`: A lista de administradores é dividida em duas abas, **Ativos** e
  **Inativos** (mais a aba "Solicitações", inalterada). Cada linha tem uma flag deslizante que
  ativa/inativa o administrador diretamente (`PUT /api/users/<id>` só com `{active}`), sem precisar
  abrir o formulário de edição — substitui o antigo botão "Excluir" nesta tela. Um administrador não
  pode inativar a própria conta (flag desabilitada na própria linha); a trava de último Master ativo
  (`RN-USR-007`) se aplica independentemente de quem estiver executando a ação.
- **RN-USR-010** `confirmada`: A coluna "Acesso" da lista mostra "Administrador Master" ou a
  contagem de funcionalidades liberadas (ex.: "3 de 6 funcionalidades liberadas") para um
  Administrador — não há mais nome de perfil, já que permissões não são mais um perfil nomeado.

### Aba Solicitações

- **RN-USR-006** `confirmada`: Lista todas as solicitações de acesso (`E-SOLICITACAO`), mais
  recentes primeiro, com contador de pendentes na aba. Ver regras completas em **T-03** →
  "Solicitação de acesso".

## T-06 — Painel: Identidade Visual (ex-"Cabeçalho e Rodapé")

### Perfis visuais (`E-PERFIL`)

- **RN-PERFIL-001** `confirmada`: No máximo 5 perfis visuais podem existir simultaneamente.
- **RN-PERFIL-002** `confirmada`: Apenas um perfil pode estar em uso (`active = true`) por vez.
- **RN-PERFIL-003** `confirmada`: Cada perfil contém nome, logomarca, 3 cores
  (primária/secundária/detalhe, hexadecimais `#RRGGBB`) e fonte (uma de 8 opções fixas, incluindo
  "Padrão institucional"). O título da página é fixo ("Intranet SSP") em todos os perfis, somente
  leitura no formulário, para preservar a identidade institucional.
- **RN-PERFIL-004** `confirmada`: A logomarca é enviada por upload de imagem (PNG, JPG, SVG, WebP
  ou AVIF, até ~300 KB já em base64) e fica salva como *data URL* somente no navegador de quem a
  cadastrou; perfis semeados (Paleta Padrão, Período Eleitoral, Governo Tarcísio) continuam
  referenciando arquivos estáticos (`logo-ssp.svg` ou imagem embutida como *data URL* no próprio
  `mock-backend.js`).
- **RN-PERFIL-005** `confirmada`: O perfil ativo é aplicado à marca, cabeçalho, rodapé, detalhes do
  site e favicon (ver `RN-PORTAL-014`).
- **RN-PERFIL-006** `confirmada`: A `Paleta Padrão` é criada automaticamente no seed e nunca pode
  ser excluída (checagem por nome).
- **RN-PERFIL-007** `confirmada`: Um perfil em uso não pode ser excluído; é preciso ativar outro
  primeiro.
- **RN-PERFIL-008** `confirmada`: Perfis podem ser criados, editados, ativados e excluídos pelo
  Master, com aplicação imediata.
- **RN-PERFIL-009** `confirmada`: **Regra própria, independente do bloqueio geral**: toda
  criação/edição/exclusão/ativação de perfil feita por um Administrador do Site entra **sempre** na
  fila de aprovação do Master, mesmo com "Exigir validação do Master" desligado — diferente de
  todas as outras entidades administrativas, cuja fila só existe com o bloqueio geral ativo. Ao
  confirmar a ação, o Administrador do Site recebe uma mensagem orientando a contatar um Master para
  solicitar a aprovação; a mudança só vale no site depois que um Master aprovar.
- **RN-PERFIL-010** `confirmada`: Um perfil pode ser marcado como **protegido** (`locked: true`):
  não pode ser editado nem excluído por ninguém, nem mesmo pelo Master (continua podendo ser
  ativado normalmente por qualquer administrador autenticado, sujeito à regra de fila acima). O
  perfil `Período Eleitoral` é semeado como protegido; os demais (inclusive Paleta Padrão e Governo
  Tarcísio) podem ser editados/excluídos normalmente pelo Master, respeitada a quantidade mínima.
- **RN-PERFIL-011** `confirmada`: Ao semear os dados de demonstração (primeira visita ou "Restaurar
  dados de demonstração"), o perfil ativo por padrão é `Governo Tarcísio`, não a Paleta Padrão.
- **RN-PERFIL-012** `confirmada`: **Quantidade mínima de perfis**: uma exclusão é rejeitada se o
  total de perfis já estiver em 2 ou menos. Como o `Período Eleitoral` é protegido e nunca pode ser
  excluído, e a Paleta Padrão também não, essa checagem garante na prática "além do Período
  Eleitoral, ao menos mais um perfil cadastrado".
- **RN-PERFIL-013** `confirmada`: **Cascata do Período Eleitoral**: ao ativar esse perfil,
  automaticamente (a) a página de avisos é bloqueada; (b) o pop-up de destaque deixa de aparecer
  (consequência de (d)); (c) o carrossel é desativado; (d) todos os avisos são inativados
  (`active = false`) e removidos do carrossel (`active_carousel = false`) individualmente. Nenhum
  aviso, destaque ou carrossel fica visível ao público enquanto esse perfil estiver ativo. Ao sair
  dele (ativar qualquer outro perfil), a página de avisos, o carrossel e os avisos da home voltam a
  ser exibidos **automaticamente**: todos os avisos são reativados em massa (`active` e
  `active_carousel` voltam a `true`) e as duas flags globais (`notices_page_blocked`,
  `carousel_enabled`) são restauradas. A partir daí, cada aviso volta a poder ser
  ativado/desativado individualmente pelo Master, como em qualquer outro momento. Esta cascata roda
  tanto na ativação direta quanto na aprovação de uma ativação de perfil enfileirada.
- **RN-PERFIL-014** `confirmada`: Quando um Master aprova (`decision: "approved"`) uma alteração
  pendente de **exclusão de perfil** que, no momento da aprovação, deixaria de respeitar alguma das
  invariantes acima (perfil ativo, Paleta Padrão, quantidade mínima), a aprovação **falha** com o
  mesmo erro genérico usado para as demais entidades ("A alteração não pode mais ser aplicada;
  atualize a fila e verifique ordens ou dados duplicados.") e a solicitação **permanece pendente**
  — mesmo comportamento de uma exclusão direta que violaria essas invariantes, em vez de um
  sucesso silencioso sem efeito real.

### Acessos Rápidos (`E-ACESSO`)

- **RN-ACESSO-001** `confirmada`: No máximo 5 acessos rápidos podem existir, exibidos no cabeçalho
  público antes do botão "Avisos". Cada um tem título, URL e ordem de exibição.
- **RN-ACESSO-002** `confirmada`: Master e Administrador do Site podem incluir, editar, excluir e
  reordenar (arrastar e soltar) os acessos rápidos.
- **RN-ACESSO-003** `confirmada`: Cada acesso rápido pode ser **ocultado** do cabeçalho público sem
  ser excluído (flag `active`, alternada por um botão dedicado "Exibir/Ocultar" — não há campo de
  status no formulário de edição).
- **RN-ACESSO-004** `confirmada`: URLs aceitas seguem a mesma regra do Cadastro Menu: devem começar
  com `https://`, `http://`, `/` ou `#`.
- **RN-ACESSO-005** `confirmada`: Não pode haver dois acessos rápidos com a mesma ordem de exibição
  (checado em memória a cada escrita, inclusive na aprovação de alterações pendentes).
- **RN-ACESSO-006** `E-CONTROLE` `confirmada`: Com "Exigir validação do Master" ativo, mudanças
  feitas por um Administrador do Site entram na fila de validação (regra padrão — diferente da
  regra sempre-em-fila dos perfis visuais).
- **RN-ACESSO-007** `confirmada`: Entidade própria (`quick_access`), independente do Cadastro
  Menu/"Instituições e serviços": editar um não afeta o outro.
- **RN-ACESSO-008** `confirmada`: Os 4 acessos rápidos semeados apontam para os sites oficiais reais
  (Polícia Civil, Polícia Militar, Polícia Científica, Conseg) e abrem em nova aba; URLs internas
  (`#`) continuam abrindo na mesma aba.

### Rodapé (`E-RODAPE`)

- **RN-RODAPE-001** `confirmada`: Exclusivo do Administrador Master — Administrador do Site não
  acessa nem altera estas configurações; sem fila de validação, a alteração é sempre direta e
  imediata (`requireMaster()` em `PUT /api/footer-settings`, sem passar por `queueIfRequired`).
- **RN-RODAPE-002** `confirmada`: Campos de endereço (logradouro, número, bairro, cidade, estado,
  CEP) são todos opcionais; a linha de endereço só aparece no rodapé público quando pelo menos um
  campo estiver preenchido.
- **RN-RODAPE-003** `confirmada`: Campos de contato: telefone, e-mail de suporte, horário de
  atendimento e "Desenvolvido por" — todos texto livre, exceto o e-mail.
- **RN-RODAPE-004** `confirmada`: E-mail de suporte é validado no formato `usuario@dominio`
  (`EMAIL_FORMAT`); é o único campo de texto do rodapé com validação de formato.
- **RN-RODAPE-005** `confirmada`: Redes sociais (Facebook, Instagram, YouTube, WhatsApp), cada uma
  com um campo de URL opcional. URL vazia oculta o ícone daquela rede no rodapé público; URL
  informada deve começar com `http://` ou `https://`.
- **RN-RODAPE-006** `confirmada`: Facebook, Instagram e YouTube já vêm semeados com os perfis
  oficiais reais da SSP-SP; WhatsApp permanece vazio/oculto até ser definido.
- **RN-RODAPE-007** `confirmada`: "Desenvolvido por" vem semeado com "CGI - Coordenadoria de Gestão
  da Informação".

## T-07 — Painel: Cadastro Menu (`E-MENU`)

- **RN-MENU-001** `confirmada`: Administradores Master e do Site podem acessar a funcionalidade.
- **RN-MENU-002** `confirmada`: Cada item possui título, URL e ordem de exibição; a descrição é
  opcional.
- **RN-MENU-003** `confirmada`: É possível incluir, editar, excluir e alterar a ordem numérica dos
  itens; a tabela também permite arrastar e soltar para reordenar (após confirmação, as posições
  são renumeradas sequencialmente).
- **RN-MENU-004** `confirmada`: Não podem existir dois itens com a mesma ordem de exibição —
  checado em memória pelo mock a cada escrita (criação, edição e aprovação de pendência); **não há
  mais SQLite nem índice único de banco** desde a migração para protótipo estático (ver
  `docs/ARQUITETURA.md`).
- **RN-MENU-005** `confirmada`: URLs aceitas devem iniciar com `https://`, `http://`, `/` ou `#`.
- **RN-MENU-006** `confirmada`: Cada item de menu também possui uma flag de status (`active`),
  alternável individualmente por um botão dedicado "Ativar/Inativar" na tabela — não há essa opção
  no formulário de criação/edição. Todo item novo é criado **ativo** por padrão. A home (`GET
  /api/menu`, para visitante não autenticado) só lista itens ativos; administradores autenticados
  veem todos, ativos e inativos.
- **RN-MENU-007** `confirmada`: Na página inicial, "Instituições e serviços" permanece recolhido e
  só exibe os itens após um clique (ver `RN-PORTAL-003`).
- **RN-MENU-008** `confirmada`: Todos os cartões de "Instituições e serviços" abrem em nova aba,
  independentemente do destino.
- **RN-MENU-009** `E-CONTROLE` `confirmada`: Com o bloqueio ativo, alterações feitas por
  Administradores do Site entram na fila de validação do Master.
- **RN-MENU-010** `confirmada`: São semeados 17 sistemas internos reais da SSP-SP como demonstração
  (Lista Ramais, Infocrim, Expedição de Documentos, RH, FISP, Placas Reservadas, SICON, Consulta
  Jurídica, CLC, Protocolo, Infoseg, RDO, WIKI, Informativos, Sala de Reuniões, Resoluções SSP,
  Almoxarifado), cada um com URL e breve descrição. Os 4 acessos institucionais
  (Polícia Civil/Militar/Científica/Conseg) **não fazem parte** deste menu — existem apenas em
  Acessos Rápidos (`E-ACESSO`).

## T-08 — Painel: Cadastro de Avisos (`E-AVISO`)

- **RN-AVISO-004** `confirmada`: Master e Administrador do Site podem incluir, editar, excluir e
  ordenar avisos por arraste.
- **RN-AVISO-005** `confirmada`: Avisos podem ser ativados ou inativados individualmente, por
  seleção múltipla ou por seleção de todos (checkbox por linha + "selecionar todos", com contador
  de selecionados). O mesmo vale para a participação no carrossel.
- **RN-AVISO-006** `E-CONTROLE` `confirmada`: Alterações de status em lote feitas por
  Administradores do Site seguem o fluxo de validação quando o bloqueio estiver ativo (mesma regra
  padrão de fila usada para criação/edição/exclusão/reordenação).
- **RN-AVISO-007** `confirmada`: Título e descrição são obrigatórios; a descrição aceita texto
  longo, com quebras de linha preservadas na exibição pública (`RN-PORTAL-010`).
- **RN-AVISO-008** `confirmada`: Banner é enviado por upload de imagem (PNG, JPG, WebP, GIF, SVG ou
  AVIF, até ~800 KB já em base64), mesmo padrão de arrastar-e-soltar da logomarca dos perfis; fica
  salvo somente no navegador de quem o cadastrou. Avisos semeados com banner por nome-base (arquivo
  já existente em `images_banner/`, listado no manifesto `BANNER_FILES`) continuam funcionando
  normalmente — o sistema resolve os dois casos (`resolveBanner`).
- **RN-AVISO-009** `confirmada`: Nome e URL do botão são opcionais, mas a URL torna-se obrigatória
  quando houver nome de botão.
- **RN-AVISO-010** `confirmada`: As flags `active` e `active_carousel` controlam, respectivamente,
  se o aviso está ativo e se participa da área de banners/carrossel; ambas ficam disponíveis
  diretamente no formulário de criação/edição (diferente de Menu e Acessos Rápidos, cujo status só
  é alternado por botão dedicado).
- **RN-AVISO-011** `confirmada`: Não pode haver dois avisos com a mesma ordem de exibição
  (checado em memória, inclusive na aprovação de pendências).
- **RN-AVISO-012** `E-CONTROLE` `confirmada`: Ao ativar o bloqueio geral de alterações, o mock
  desativa `active` e `active_carousel` de **todos** os avisos, ocultando-os imediatamente; a partir
  daí, um Master pode reativar/aprovar avisos individualmente mesmo com o bloqueio ligado. Ao
  desativar o bloqueio, as flags não são alteradas — permanecem ativos somente os avisos que já
  estavam ativos.
- **RN-AVISO-013** `confirmada`: São semeados 6 avisos de demonstração, nesta ordem: Consulta ao
  Conselho de Usuários (primeiro — também o escolhido para o pop-up de destaque), São Paulo por
  Todas, Programa Casa Paulista, O que é uma Hospitalidade no Serviço Público, Campanha de
  Arrecadação de Prendas e Agência SP (por último). Todos com banner; todos ativos e no carrossel.
  Com 6 avisos ativos, o Agência SP fica de fora dos "5 primeiros" da home (`RN-PORTAL-007`), mas
  continua no carrossel e na listagem completa de `avisos.html`.
- **RN-AVISO-014** `confirmada`: Os banners do Conselho de Usuários e de Hospitalidade usam imagens
  largas (2560×397), formato pensado para o carrossel.

## T-09 — Painel: Validações Pendentes (`E-PENDENCIA`, `E-CONTROLE`)

Item e view ocultos para Administrador do Site — exclusivo do Master.

### Bloqueio geral de alterações

- **RN-BLOQ-001** `confirmada`: O Administrador Master pode ativar a flag "Exigir validação do
  Master" (`change_control.locked`), apresentada como seletor "Não/Sim", sem campo de observação.
- **RN-BLOQ-002** `confirmada`: Ao alterar o seletor, o sistema pede confirmação (ver
  `RN-OVERVIEW-005`) e aplica a mudança imediatamente; cancelar restaura o estado anterior do
  seletor.
- **RN-BLOQ-003** `confirmada`: Com o bloqueio ativo, ações do Administrador do Site sobre
  **menu, acessos rápidos e avisos** são registradas como pendentes e não alteram o site
  imediatamente (`queueIfRequired`). Perfis visuais seguem a regra própria e sempre-em-fila
  descrita em `RN-PERFIL-009`, independente deste bloqueio.
- **RN-BLOQ-004** `confirmada`: Alterações feitas diretamente por um Master continuam sendo
  aplicadas imediatamente, bloqueio ativo ou não.
- **RN-BLOQ-005** `confirmada`: Um Master, ou um Administrador com a funcionalidade "Validações
  Pendentes" liberada (`RN-PERM-005`, `RN-PERM-007`), pode aprovar (aplicando a alteração) ou
  recusar cada solicitação pendente (`PUT /api/pending-changes/<id>`).
- **RN-BLOQ-006** `confirmada`: O item "Validações Pendentes" do menu lateral exibe um indicador
  numérico (badge vermelho) com a quantidade de solicitações pendentes; fica oculto quando não há
  nenhuma pendente. Visível ao Master e a qualquer Administrador com a funcionalidade liberada.
- **RN-BLOQ-013** `confirmada`: Um usuário (Master ou Administrador delegado) **não pode aprovar
  nem recusar** uma alteração pendente que ele mesmo solicitou (`409`) — evita que um Administrador
  delegado em "Validações Pendentes" aprove a própria solicitação, esvaziando o propósito da fila.
- **RN-BLOQ-007** `confirmada`: O bloqueio **não pode ser desativado** enquanto existir qualquer
  alteração pendente; o sistema informa isso em pop-up com a contagem de pendências.
- **RN-BLOQ-008** `E-AVISO` `confirmada`: Ao **ativar** o bloqueio, o carrossel global muda
  automaticamente para "Não" e todos os avisos são desativados (ver `RN-AVISO-012`). Ao
  **desativar** o bloqueio (só possível sem pendências), o carrossel global volta para "Sim",
  respeitando as flags individuais dos avisos (que não foram alteradas na desativação).

### Fila de aprovação

- **RN-BLOQ-009** `confirmada`: Cada item pendente registra: solicitante, ação (`create`, `update`,
  `delete`, `reorder`, `status`, `activate`, `bulk_status`, `bulk_carousel`), entidade afetada,
  payload da alteração, data e, após decisão, quem revisou e quando.
- **RN-BLOQ-010** `confirmada`: Ao aprovar, o mock tenta reaplicar a alteração original; se os dados
  não forem mais válidos (ex.: ordem já ocupada por outro item criado nesse meio-tempo), a
  aprovação falha com uma mensagem orientando a conferir a fila e os dados duplicados — a
  solicitação pendente **permanece pendente** nesse caso (não é marcada como aprovada nem recusada
  automaticamente).
- **RN-BLOQ-011** `confirmada`: Ao recusar, a solicitação só muda de status; nenhuma alteração é
  aplicada ao site.

### Cascata do Período Eleitoral

- **RN-BLOQ-012**: ver `RN-PERFIL-013` (regra central documentada na seção de Perfis Visuais, por
  ser disparada pela ativação de um perfil específico, não pelo bloqueio geral).

## T-10 — Painel: Perfis e Permissões (revogada — mesclada em T-05, 17/11/2026)

Esta tela deixou de existir separadamente. As permissões não são mais um perfil nomeado e
reutilizável (`E-PERFILACESSO`) — cada Administrador configura as próprias permissões diretamente
no cadastro de usuário (ver **T-05** → `RN-USR-008`, `RN-PERM-005`). Motivo: pedido explícito do
usuário, para reduzir um nível de indireção na gestão de administradores.

- **RN-PERFILACESSO-001** a **005** `revogada` (17/11/2026): descreviam a tela e a entidade
  `access_profiles` (perfil de acesso nomeado, reutilizável entre usuários, com matriz de ações por
  área). **Motivo da revogação**: substituídas por `RN-USR-008`/`RN-USR-010` e `RN-PERM-005`
  (permissões diretas no usuário, um toggle por funcionalidade, sem nome nem reuso).

## T-11 — Painel: Logs de Auditoria (`E-LOG`)

- **RN-AUDIT-001** `confirmada`: Tela somente leitura — não existe endpoint de edição ou exclusão
  de registros na API simulada; os registros são imutáveis pela interface administrativa.
- **RN-AUDIT-002** `confirmada`: Acesso exclusivo do Administrador Master por padrão; pode ser
  delegado a um Administrador com a funcionalidade "Logs de Auditoria" liberada (`RN-PERM-005`) —
  diferente de Cadastro de Usuários, que é sempre Master-exclusivo (`RN-PERM-006`).
- **RN-AUDIT-003** `confirmada`: Cada registro guarda data/hora, usuário (nome e papel), área
  administrativa, ação, entidade/id afetado, um **detalhe textual breve e legível** (frase em PT
  descrevendo o que foi feito, ex.: `Criou Cadastro de Menu "Item Teste".`) e resultado
  (`sucesso`/`negado`). O detalhe nunca inclui senha ou hash, mesmo quando o payload original da
  requisição os contém (ex.: cadastro/edição de usuário) — só campos seguros de exibir
  (nome/título do registro afetado).
- **RN-AUDIT-007** `confirmada`: Cada linha da tabela tem um ícone ("ℹ", "Ver detalhes") que abre
  um pop-up com os dados estruturados completos do registro: id, data/hora, usuário, papel, área,
  ação, entidade/id, resultado, o detalhe legível e os campos técnicos da chamada (método HTTP,
  rota, status HTTP, mensagem de erro quando houver). Mesmo nesse pop-up, nunca são exibidos dados
  de payload bruto da requisição (ver `RN-AUDIT-003`) — só os campos já armazenados na entrada do
  log.
- **RN-AUDIT-004** `confirmada`: São registrados: login bem-sucedido e malsucedido (identificando o
  CPF da tentativa quando malsucedido), logout, toda mutação administrativa
  (criar/editar/excluir/publicar/aprovar) e toda tentativa negada por falta de permissão (`403`).
  Chamadas de leitura (`GET`) não são registradas, para não inundar o log com o tráfego público do
  portal (home, avisos, tema) — limitação assumida do protótipo; se for necessária granularidade de
  navegação/leitura no futuro, é um ajuste a ser pedido explicitamente.
- **RN-AUDIT-005** `confirmada`: A tela permite filtrar por usuário, área, tipo de ação e período
  (data inicial/final).
- **RN-AUDIT-009** `confirmada`: A tabela é paginada no cliente (sobre o resultado já filtrado):
  10, 20, 50 ou 100 registros por página (seletor, padrão 10), com navegação primeira/anterior/
  próxima/última página (`«`/`‹`/`›`/`»`) e indicador "Página X de Y". Trocar o tamanho de página ou
  aplicar/limpar um filtro volta para a primeira página.
- **RN-AUDIT-006** `confirmada`: O mock mantém apenas os últimos 2000 registros
  (`localStorage`, por navegador/aba) — limitação de armazenamento do protótipo, sem equivalente a
  uma política de retenção real de banco de dados.
- **RN-AUDIT-008** `confirmada`: São semeados 10 registros de demonstração (login/logout, criação e
  edição de conteúdo, uma tentativa de login malsucedida, uma tentativa negada por ação exclusiva
  do Master, uma aprovação de fila e uma edição de cadastro de usuário), para a tela não aparecer
  vazia na primeira visita. Navegadores com banco de uma versão anterior a esta regra (que já
  tinham a entidade `audit_logs` criada, porém vazia) recebem os mesmos 10 registros numa migração
  automática única.

## Matriz de permissões (resumo)

A coluna "Administrador (padrão semeado)" descreve as permissões dos dois administradores de
demonstração (Rafael, Juliana — ver `docs/Auth.md`). Cada Administrador tem seu próprio conjunto de
permissões (um toggle por funcionalidade, `RN-PERM-005`); esta tabela não é mais exaustiva para
todo Administrador não-Master, só ilustra o padrão semeado.

| Entidade / Funcionalidade                | Master                | Administrador (padrão semeado)                              |
| ----------------------------------------- | ---------------------- | ---------------------------------------------------------- |
| Usuários (`E-USUARIO`)                   | CRUD completo, direto  | Sem acesso — exclusivo do Master (`RN-PERM-006`)            |
| Solicitações de acesso (`E-SOLICITACAO`) | Aprova/recusa          | Sem acesso (só cria a própria, antes de ter login)         |
| Perfis visuais (`E-PERFIL`)               | CRUD + ativar, direto  | CRUD + ativar, **sempre** em fila (`RN-PERFIL-009`)        |
| Acessos rápidos (`E-ACESSO`)              | CRUD + reordenar, direto | CRUD + reordenar; em fila só com bloqueio ativo          |
| Itens de menu (`E-MENU`)                  | CRUD + reordenar + status, direto | CRUD + reordenar + status; em fila só com bloqueio ativo |
| Avisos (`E-AVISO`)                        | CRUD + reordenar + status em lote, direto | idem; em fila só com bloqueio ativo       |
| Rodapé (`E-RODAPE`)                       | Edita, direto          | Sem acesso                                                  |
| Bloqueio/configurações gerais (`E-CONTROLE`) | Único que altera    | Somente visualiza (read-only)                               |
| Fila de validação (`E-PENDENCIA`)         | Aprova/recusa          | Delegável via toggle "Validações Pendentes" (`RN-PERM-007`); nunca a própria solicitação (`RN-BLOQ-013`) |
| Logs de auditoria (`E-LOG`)               | Visualiza (somente leitura) | Sem acesso no padrão semeado; delegável via toggle (`RN-AUDIT-002`) |

## Estados e enumerações

- `E-USUARIO.active`: `Ativo` ou `Inativo` (a interface atual cria usuários sempre ativos).
- `E-SOLICITACAO.status`: `pending` (Pendente), `approved` (Aprovado) ou `rejected` (Recusado).
- `E-PENDENCIA.status`: `pending`, `approved` ou `rejected`.
- `E-PERFIL.active` / `.locked`: perfil em uso / perfil protegido (independentes entre si).
- `E-AVISO.active` / `.active_carousel`: ativo na listagem pública / ativo no carrossel
  (independentes entre si).
- `E-MENU.active`, `E-ACESSO.active`: ativo/oculto no portal público.
- `E-CONTROLE.locked`, `.carousel_enabled`, `.notices_page_blocked`: as três flags globais do
  bloqueio/validação e das áreas de destaque.

## Confirmações e feedback ao usuário

- **RN-UX-001** `confirmada`: Exclusões, aprovações, recusas, troca de perfil visual e encerramento
  de sessão exigem confirmação pelo diálogo estilizado `#confirm-dialog` ("Sim"/"Não"). A única
  exceção observada é "Restaurar dados de demonstração" em `admin.html`, que usa o `confirm()`
  nativo do navegador (ver `RN-LOGIN-005`).
- **RN-UX-002** `confirmada`: Toda conclusão ou falha administrativa mostra um pop-up informativo
  (`#notice-dialog`).
- **RN-UX-003** `confirmada`: Após a confirmação, listas, indicadores, estados e o perfil visual são
  atualizados imediatamente no painel, sem recarregar a página (`refreshData()`/`loadAll()`).

## Restrições e validações conhecidas

- Sem persistência compartilhada entre visitantes — cada navegador/aba tem sua própria cópia dos
  dados (ver `docs/ARQUITETURA.md`).
- Sem segurança real na autenticação — ver `docs/Auth.md`.
- CPF e e-mail não têm validação de **formato** em nenhum formulário (nem cadastro de
  administrador, nem solicitação de acesso) — só a obrigatoriedade de preenchimento, e, para
  administradores, a unicidade dentro do mock. O único campo de e-mail com validação de formato é o
  e-mail de suporte do rodapé (`RN-RODAPE-004`).
- Banner precisa estar listado manualmente em `BANNER_FILES`
  (`assets/js/mock-backend.js`) quando **não** for enviado por upload — arquivo "por nome-base"
  sem entrada no manifesto não é resolvido.

## Dados institucionais pendentes

- Confirmar e substituir o logotipo provisório pela marca oficial.
- Confirmar e-mail, telefone, endereço e horário de atendimento oficiais exibidos no rodapé — os
  valores atuais (endereço da sede da SSP-SP) são dados de demonstração fornecidos pelo usuário como
  mock, não confirmados como definitivos.
- Definir destinos reais dos acessos Polícia Civil, Polícia Militar, Polícia Científica e Conseg.

## Histórico

- 17/11/2026: nova regra **`RN-AUDIT-009`** — tabela de Logs de Auditoria paginada no cliente
  (10/20/50/100 por página, navegação primeira/anterior/próxima/última), a pedido do usuário.
  `painel.html`, `assets/js/painel.js`, `assets/css/styles.css`.
- 17/11/2026: a pedido do usuário, "Perfis e Permissões" deixou de ser uma tela/entidade separada
  (`T-10`, `E-PERFILACESSO`, ambas revogadas) e passou a viver dentro de **T-05** (Cadastro de
  Usuários): cada Administrador configura suas próprias permissões (um toggle por funcionalidade,
  sem perfil nomeado nem reutilizável) direto no cadastro, via pop-up quando "Administrador" é
  escolhido em "Tipo de acesso". Revogadas: `RN-PERM-001`, `RN-PERM-003`, `RN-PERM-008`,
  `RN-PERFILACESSO-001..005`. Novas: `RN-USR-008`, `RN-USR-009`, `RN-USR-010`, `RN-BLOQ-013`
  (trava de autoaprovação). `RN-PERM-005`-`007`/`009` reescritas para o novo modelo — inclusive
  `RN-PERM-007`, que agora permite delegar "Validações Pendentes" a um Administrador (antes
  Master-exclusivo por decisão interna; revisto a pedido do usuário). Também: lista de
  administradores dividida em abas Ativos/Inativos, com flag deslizante por linha substituindo o
  antigo botão "Excluir" (endpoint `DELETE` mantido na API, só não é mais chamado pela UI); 4
  administradores de demonstração extras semeados (2 ativos, 2 inativos) para popular as novas
  abas. Implementado em `assets/js/mock-backend.js`, `painel.html`, `assets/js/painel.js`,
  `assets/css/styles.css`.
- 17/11/2026: nova regra **`RN-AUDIT-008`** — Log de Auditoria passou a vir com 10 registros de
  demonstração semeados (`buildDemoAuditLogs()`), cobrindo login/logout, criação/edição de
  conteúdo, login malsucedido, ação negada e aprovação de fila; navegadores que já tinham
  `audit_logs` vazio (versão anterior) recebem os mesmos registros numa migração automática
  (`SEED_VERSION` 22→23). Motivo: tela aparecia vazia para quem via o protótipo pela primeira vez
  (nenhuma ação havia sido registrada ainda), a pedido do usuário.
- 17/11/2026: dois ajustes na tela de Logs de Auditoria (`T-11`), a pedido do usuário: (1) o campo
  `detail` deixou de ser o trace técnico cru (`PUT /api/menu/3 -> 200`) e passou a ser uma frase
  legível em PT descrevendo a ação (nova regra em `RN-AUDIT-003`, função `describeAudit` em
  `assets/js/mock-backend.js`) — nunca inclui senha/hash, mesmo quando o payload original os
  contém; (2) nova regra **`RN-AUDIT-007`**: cada linha ganhou um ícone que abre um pop-up com os
  dados estruturados completos do registro, incluindo os campos técnicos (método/rota/status/
  mensagem), agora guardados separadamente na entrada do log em vez de concatenados em uma string
  só. Implementado em `assets/js/mock-backend.js`, `painel.html` (`#audit-detail-dialog`) e
  `assets/js/painel.js`. Reorganização do menu lateral do painel em três grupos (Geral/Conteúdo/
  Administração), também a pedido do usuário, sem mudança de regra de negócio — ver
  `docs/DESIGN-SYSTEM.md`.
- 17/11/2026: três funcionalidades novas na área administrativa, a pedido do usuário:
  1. **Identidade Visual**: renomeação de rótulo — "Cabeçalho e Rodapé" (menu lateral e título da
     tela, `T-06`) passa a se chamar "Identidade Visual". Nenhuma regra de comportamento mudou; o
     bloqueio do perfil "Período Eleitoral" (`RN-PERFIL-010`) continua idêntico.
  2. **Perfis e Permissões** (`T-10`, nova entidade `E-PERFILACESSO`): o antigo papel fixo único
     "Administrador do Site" (`role: "site"`) foi substituído por perfis de acesso configuráveis
     pelo Master, com matriz de permissões por área × ação. `RN-PERM-001` (`"não há outros papéis"`)
     foi **revogada**, substituída por `RN-PERM-005`–`RN-PERM-009`. O perfil semeado "Administrador
     do Site" replica exatamente o comportamento antigo, para não quebrar usuários já cadastrados
     (migração automática e não destrutiva em `assets/js/mock-backend.js`, `SEED_VERSION` 21→22).
     Por decisão de segurança (evitar escalonamento de privilégio), as áreas Usuários, Validações
     Pendentes e Perfis e Permissões continuam exclusivas do Master no backend, independentemente
     da matriz (`RN-PERM-006`) — registrado aqui como decisão de implementação, não pedido
     explícito do usuário sobre esse detalhe específico.
  3. **Trava de último Master generalizada** (`RN-USR-007`): `RN-USR-005b` (protegia só o CPF fixo
     de demonstração contra exclusão) foi **revogada** e substituída por uma regra mais ampla, que
     bloqueia excluir, desativar ou rebaixar qualquer conta Master quando for a última ativa.
  4. **Logs de Auditoria** (`T-11`, nova entidade `E-LOG`): tela somente leitura registrando login
     (sucesso/falha), logout, mutações administrativas e tentativas negadas por permissão, com
     filtros por usuário/área/ação/período. Não registra chamadas `GET` (decisão para não poluir o
     log com tráfego público do portal — ver `RN-AUDIT-004`).

  Validação: `node -c` em `assets/js/mock-backend.js` e `assets/js/painel.js` (sintaxe OK); harness
  Node ad hoc (descartado após a execução, mesmo padrão já usado em tarefas anteriores) cobrindo
  login/perm granular/negação de permissão/log de auditoria/trava de último Master/proteção do
  perfil semeado contra exclusão — todos os cenários passaram.

- 13/11/2026: nova regra **`RN-PORTAL-015`** — ícones de redes sociais do rodapé público agora
  ficam ocultos enquanto o perfil "Período Eleitoral" está ativo, voltando a ser exibidos ao ativar
  qualquer outro perfil (`window.applySspFooter` em `assets/js/theme.js`).
- 13/11/2026: reescrita completa do documento a pedido do usuário — reorganizado por tela (`T-NN`)
  e entidade (`E-NOME`), com ID estável e status (`confirmada`/`⚠ inferida`) em cada regra. Nenhuma
  regra de negócio de fato mudou nesta tarefa (documentação apenas); foram corrigidas duas
  referências desatualizadas a um antigo backend SQLite (seção "Cadastro Menu" e "Visão Geral
  administrativa", migração já registrada em `docs/ARQUITETURA.md` desde 11/11/2026) e adicionadas
  três regras implementadas no código, mas não documentadas antes. Todo o histórico de decisões
  anterior a esta data foi preservado abaixo.
- 13/11/2026: resolvidas com o usuário, uma a uma, as três divergências levantadas na reescrita
  acima (`RN-USR-005`, `RN-MENU-006`, `RN-PERFIL-014`), todas promovidas de `⚠ inferida` para
  `confirmada`:
  - **`RN-USR-005b`** (nova): restaurada em código a proteção ao cadastro "Administrador Master"
    principal da demonstração (CPF `000.000.000-00`) — não pode mais ser excluído por nenhum
    administrador, nem mesmo por outro Master (`MASTER_PRINCIPAL_CPF` em
    `assets/js/mock-backend.js`, checado em `DELETE /api/users/<id>`).
  - **`RN-MENU-006`**: confirmado como recurso intencional, sem alteração de código — itens de
    menu continuam com flag de status individual e botão dedicado no painel.
  - **`RN-PERFIL-014`**: corrigido em código — o branch `delete` de perfil em `applyPendingChange`
    (`assets/js/mock-backend.js`) deixou de ignorar silenciosamente a exclusão quando violaria uma
    invariante (perfil ativo, Paleta Padrão, quantidade mínima) e passou a lançar erro, fazendo a
    aprovação falhar com a mesma mensagem genérica das demais entidades e mantendo a solicitação
    pendente, em vez de reportar sucesso sem efeito real.
- 11/11/2026: seção Autenticação atualizada para refletir a migração para protótipo estático
  (sem servidor); demais regras de negócio permanecem válidas, apenas a camada de persistência mudou.
- 11/11/2026: seção "Página de avisos" corrigida — o bloqueio deixou de retornar HTTP 403 real
  (não há mais servidor) e passou a ser um redirecionamento client-side sem valor de segurança real.
- 11/11/2026: "Gestão do Cabeçalho" atualizada — logomarca passou de campo de texto (nome de
  arquivo) para upload de imagem; título da página passou a ser fixo ("Intranet SSP") em todos
  os perfis, não mais editável por perfil.
- 11/11/2026: adicionada a regra de perfil protegido (sem edição/exclusão por ninguém); semeados
  2 perfis visuais extras de demonstração: `Período Eleitoral` (protegido) e `Governo Tarcísio`
  (não protegido, pode ser editado/excluído pelo Master normalmente).
- 11/11/2026: perfil ativo por padrão no seed passou de `Paleta Padrão` para `Governo Tarcísio`.
- 11/11/2026: nova seção "Acessos Rápidos" — os 4 links fixos do cabeçalho público viraram uma
  entidade editável (até 5, com ocultar/exibir), gerenciada em Gestão do Cabeçalho.
- 11/11/2026: seção renomeada de "Gestão do Cabeçalho" para "Cabeçalho e Rodapé"; adicionada a
  subseção "Rodapé" (endereço, contato e redes sociais, exclusivo do Master).
- 11/11/2026: dados de demonstração do rodapé preenchidos com endereço/telefone/horário de
  atendimento (mock fornecido pelo usuário, sede da SSP-SP); adicionado o campo "Horário de
  atendimento".
- 11/11/2026: os 4 acessos rápidos passaram de âncoras internas (`#civil` etc.) para os links
  oficiais reais dos respectivos órgãos, abrindo em nova aba.
- 11/11/2026: "Instituições e serviços" ganhou 15 itens de demonstração com sistemas internos
  reais da SSP-SP (Lista Ramais, Infocrim, RH, FISP etc.), cada um com descrição e URL; o link
  de "Polícia Civil" nos acessos rápidos foi simplificado para `https://www.policiacivil.sp.gov.br/`.
- 11/11/2026: os 4 acessos institucionais foram removidos de "Instituições e serviços" a pedido
  do usuário (continuam só nos Acessos Rápidos). Rodapé: Facebook/Instagram/YouTube semeados com
  perfis oficiais reais; corrigido bug visual de borda branca/invisível ao focar campos quando o
  perfil ativo tem cor secundária clara (ver `docs/Memoria.md`).
- 11/11/2026: banner de aviso passou de campo de texto (nome-base) para upload de imagem, no
  mesmo padrão da logomarca; semeados 4 avisos de demonstração com banner, descrição longa e
  botão "Acesse Aqui", já ativos e no carrossel.
- 11/11/2026: botão "Acesse Aqui" dos avisos "O que é uma Hospitalidade no Serviço Público?" e
  "São Paulo por Todas" passou a usar links específicos fornecidos pelo usuário, em vez do link
  genérico da SSP; os demais avisos de demonstração continuam com o link genérico.
- 11/11/2026: descrições de "Campanha de Arrecadação de Prendas" e "São Paulo por Todas"
  ampliadas com mais detalhes; botão "Acesse Aqui" removido do aviso de Arrecadação; ordem dos 4
  avisos de demonstração invertida (São Paulo por Todas passou a ser o primeiro, Arrecadação o
  último).
- 11/11/2026: novo aviso de demonstração "Consulta ao Conselho de Usuários – Avalie os Serviços de
  Segurança Pública" adicionado como o primeiro da ordem (à frente de São Paulo por Todas), para
  também aparecer no pop-up de destaque da página inicial (primeiro aviso ativo com banner).
  Banner próprio (`banner_ConselhoUsuarios.png`), descrição baseada em conteúdo fornecido pelo
  usuário e botão "Participe" com link para o Portal Fala.SP.
- 11/11/2026: adicionada a regra de quantidade mínima de perfis (além do Período Eleitoral, ao
  menos mais um perfil é obrigatório) e a cascata de ativação do Período Eleitoral (bloqueia a
  página de avisos, suprime o pop-up de destaque, desativa o carrossel e inativa todos os avisos;
  ao sair do perfil, a página de avisos e o carrossel voltam a ficar disponíveis automaticamente,
  mas os avisos individuais continuam inativos até o Master reativá-los manualmente, um a um).
- 11/11/2026: rodapé público reorganizado — e-mail e telefone passaram a ficar na mesma linha;
  endereço, contato e horário de atendimento ganharam ícones; texto de "Desenvolvido por" alterado
  de "Desenvolvido pelo GTI" para "CGI - Coordenadoria de Gestão da Informação" (reconciliação
  atualiza quem ainda tinha o texto antigo, sem tocar em customização real do Master). SEED_VERSION
  14->15.
- 11/11/2026: corrigido o comportamento de saída do Período Eleitoral — o usuário esclareceu que
  página de avisos, carrossel e avisos da página inicial devem voltar a ser exibidos
  automaticamente ao ativar outro perfil (reativação em massa de todos os avisos), substituindo o
  comportamento anterior (flags preservadas, exigindo reativação manual item a item).
- 11/11/2026: simplificado o texto do pop-up de confirmação ao ativar "Bloqueio de alterações" —
  passou a exibir apenas a regra principal (validação obrigatória do Master para alterações de
  Administradores do Site), a pedido do usuário, em vez da lista completa de consequências. O
  comportamento de fato (avisos/carrossel desativados ao bloquear) não mudou, só o texto exibido.
- 11/11/2026: a pedido do usuário, criação/edição/exclusão/ativação de perfil por um Administrador
  do Site passou a exigir aprovação do Master sempre (não mais só quando o bloqueio geral de
  alterações está ligado). Ao confirmar a ação, o Administrador do Site recebe uma mensagem
  orientando a contatar um Administrador Master para solicitar a aprovação.
- 11/11/2026: ícones de redes sociais do rodapé trocados de badge de letra única para a logomarca
  real (`assets/images/social/`), com escolha automática entre tema claro/escuro conforme o
  contraste do fundo do rodapé (cor primária do perfil visual ativo).
- 12/11/2026: novo item "Resoluções SSP" adicionado como último de "Instituições e serviços"
  (`https://www.intranet.ssp.sp.gov.br/intranetV3/assets/resolucoes/`), a pedido do usuário.
  SEED_VERSION 19->20.
- 12/11/2026: novo item "Almoxarifado" adicionado como último de "Instituições e serviços"
  (`https://www.intranet.ssp.sp.gov.br/intranetV3/assets/almoxarifado/`), a pedido do usuário.
  SEED_VERSION 20->21.
- 11/11/2026: a pedido do usuário, o favicon do site passou a acompanhar a logomarca do perfil
  visual ativo — troca automaticamente junto com a troca de perfil.
- 11/11/2026: a pedido do usuário, adicionado indicador numérico destacado (badge vermelho,
  animação sutil de pulso) no item "Validações pendentes" do menu do Master, com a quantidade de
  solicitações pendentes; oculto quando a fila está vazia.
- 11/11/2026: a pedido do usuário, favicon de perfis com cor primária preta (ou quase) passou a
  compor a logo sobre um fundo preto (via canvas), em vez de exibi-la direto — logos pensadas para
  fundo escuro (traço claro/branco) ficavam ilegíveis sobre o fundo claro da aba do navegador.
- 11/11/2026: novo aviso de demonstração "Agência SP — Sua Fonte de Informações do Governo de São
  Paulo" cadastrado como o último da ordem (`images_banner/ssp-agenciaSP.png`), para ficar
  "ativo só no carrossel" a pedido do usuário: por ficar fora dos "5 primeiros avisos" da home
  (regra já existente), não aparece como card na página inicial, mas continua no carrossel e na
  listagem completa de avisos.html. Botão "Acesse Aqui" → agenciasp.sp.gov.br. SEED_VERSION 15->16.
- 11/11/2026: revertida a composição de favicon com fundo preto (perfis de cor primária preta) —
  usuário não gostou do resultado visual. Favicon volta a exibir a logo diretamente em todos os
  perfis, sem composição.
- 11/11/2026: novo aviso de demonstração "Hospitalidade no Serviço Público — Registre no
  SP-Agendas" cadastrado como o último da ordem (`images_banner/hospitalidade-banner-2560x397.png`),
  também "ativo só no carrossel" (mesmo mecanismo do Agência SP). O aviso original de Hospitalidade
  teve `active_carousel` desligado (substituído por este no carrossel), permanecendo ativo
  normalmente como card/listagem. SEED_VERSION 16->17.
- 11/11/2026: descrição do aviso "Consulta ao Conselho de Usuários" substituída por versão com
  parágrafos e itens de lista separados por quebra de linha, a pedido do usuário — já suportado
  pelo CSS existente (`white-space: pre-line`), sem necessidade de mudança de renderização.
  SEED_VERSION 17->18.
- 11/11/2026: usuário substituiu diretamente no disco os arquivos `banner_ConselhoUsuarios.png` e
  `Hospitalidades.png` por versões largas (2560x397): `avaliacao-seguranca-publica-banner-2560x397.png`
  (Conselho de Usuários) e `hospitalidade-banner-2560x397.png` (Hospitalidade). O aviso separado
  "Hospitalidade no Serviço Público — Registre no SP-Agendas" (criado na entrada anterior do
  histórico como item carrossel-only) foi consolidado de volta no aviso original de Hospitalidade,
  que passou a usar o novo banner largo e voltou a ficar ativo no carrossel — evitando duplicidade
  de avisos sobre o mesmo tema. `AcessoRapido.png` também foi removido do disco (não estava em uso
  por nenhum aviso) e retirado do manifesto. SEED_VERSION 18->19.
