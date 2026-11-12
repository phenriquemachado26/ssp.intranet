# Regras de Negócio

Atualizado em: 12/11/2026.

> Protótipo 100% estático, sem servidor nem banco de dados real: todas as regras abaixo são
> simuladas no navegador (`assets/js/mock-backend.js`) e persistidas em `localStorage`, por
> navegador/aba — sem compartilhamento entre visitantes. Ver `docs/Auth.md`.

## Perfis administrativos

### Administrador Master

- Possui acesso completo ao painel.
- Pode cadastrar Administradores do Site e outros Administradores Master.
- É o único perfil autorizado a aprovar ou recusar solicitações de acesso.
- Pode remover administradores, exceto o cadastro Master principal da demonstração.
- Pode editar nome, CPF, e-mail, perfil, status e senha dos administradores.

### Administrador do Site

- Perfil destinado à manutenção futura de conteúdo do portal.
- Pode autenticar e acessar a visão geral do painel.
- Não pode conceder acesso, cadastrar administradores nem analisar solicitações.
- Não visualiza nem acessa o módulo Cadastro de Usuários.
- Pode acessar a Gestão do Cabeçalho e solicitar alterações.
- As permissões de conteúdo serão detalhadas quando os respectivos módulos forem criados.

## Solicitação de acesso

1. O solicitante informa nome, CPF, e-mail institucional e unidade/setor.
2. A solicitação é criada com status `Pendente`.
3. Um Administrador Master pode aprovar ou recusar.
4. Ao aprovar, o sistema cria um usuário com perfil `Administrador do Site`.
5. A promoção para Master deve ocorrer por uma ação explícita de um Master.

## Cadastro direto

- Apenas Master pode usar “Novo administrador”.
- Nome, CPF, e-mail institucional, perfil e senha temporária são obrigatórios.
- A senha temporária deve possuir no mínimo oito caracteres nesta demonstração.
- Em produção, CPF e e-mail devem ser únicos e validados no servidor.

## Cabeçalho e Rodapé

- Podem existir no máximo cinco perfis visuais.
- Apenas um perfil pode ficar em uso por vez.
- Cada perfil contém nome, logomarca e três cores. O título da página é fixo
  (“Intranet SSP”) em todos os perfis, para preservar a identidade institucional, e não é
  editável no cadastro.
- A logomarca é enviada por upload de imagem (PNG, JPG, SVG, WebP ou AVIF, até 300 KB); não é
  mais um campo de texto com o nome de um arquivo em `assets/images`. A imagem enviada fica salva
  somente no navegador de quem a cadastrou (ver `docs/Auth.md`/`docs/ARQUITETURA.md`); perfis
  semeados (como a Paleta Padrão) continuam usando o arquivo estático `logo-ssp.svg`.
- O perfil ativo é aplicado à marca, ao cabeçalho, ao rodapé, aos detalhes do site e ao favicon
  (ícone da aba do navegador) — a troca de perfil também troca o favicon para a mesma logomarca.
- ⚠ `revogada` (11/11/2026): o favicon exibia a logo sobre um fundo preto composto via canvas
  quando a cor primária do perfil era preto puro/quase puro (Governo Tarcísio, Período Eleitoral).
  O usuário não gostou do resultado; revertido. O favicon volta a exibir a logo diretamente em
  todos os perfis, como antes dessa tentativa.
- A `Paleta Padrão` é criada automaticamente e não pode ser excluída.
- Um perfil em uso não pode ser excluído; primeiro deve-se ativar outro.
- Perfis podem ser criados, editados, ativados e excluídos pelo Master, com aplicação imediata.
- Um Administrador do Site também pode acessar "Cabeçalho e Rodapé" e solicitar criação, edição,
  exclusão ou ativação de perfil, mas a ação **nunca** é aplicada diretamente: entra sempre na fila
  de aprovação do Master, **mesmo com o bloqueio geral de alterações desligado** (diferente das
  demais entidades administrativas, cuja fila só existe com o bloqueio ativo). Ao confirmar, o
  Administrador do Site recebe uma mensagem orientando a entrar em contato com um Administrador
  Master para solicitar a aprovação; a mudança só passa a valer no site depois que um Master
  aprovar a solicitação pendente.
- Um perfil pode ser marcado como **protegido**: não pode ser editado nem excluído por ninguém,
  nem mesmo pelo Administrador Master (continua podendo ser ativado normalmente). O perfil
  `Período Eleitoral` é semeado como protegido nesta demonstração; os demais perfis (inclusive a
  Paleta Padrão e o Governo Tarcísio) podem ser editados e excluídos normalmente pelo Master,
  respeitada a regra de quantidade mínima abaixo.
- Ao semear os dados de demonstração (primeira visita ou "Restaurar dados de demonstração"), o
  perfil ativo por padrão é `Governo Tarcísio`, não a Paleta Padrão.
- **Quantidade mínima de perfis**: além do `Período Eleitoral`, é obrigatório manter ao menos mais
  um perfil cadastrado (mínimo de 2 perfis no total). Uma exclusão que deixaria menos de 2 perfis
  é rejeitada. Na prática esse piso já é garantido pela própria Paleta Padrão (que também nunca
  pode ser excluída), mas a regra vale de forma genérica para qualquer combinação de perfis.
- **Cascata do período eleitoral**: ao ativar o perfil `Período Eleitoral`, automaticamente (a)
  a página de avisos é bloqueada (mesmo efeito do bloqueio manual em "Visão Geral": nav oculto e
  acesso direto a `avisos.html` redireciona para a página inicial); (b) o pop-up de destaque da
  página inicial deixa de aparecer; (c) o carrossel de imagens é desativado; (d) todos os avisos
  são inativados (removidos também do carrossel individualmente). Nenhum aviso, destaque ou
  carrossel fica visível ao público enquanto esse perfil estiver ativo, mesmo que um Administrador
  tenha ativado algum item individualmente antes. Ao sair do perfil `Período Eleitoral` (ativar
  qualquer outro perfil), a página de avisos, o carrossel e os avisos da página inicial **voltam a
  ser exibidos automaticamente**: todos os avisos são reativados em massa (`active` e
  `active_carousel` voltam a `true`) e as duas flags globais são restauradas. A partir daí, cada
  aviso volta a poder ser ativado/desativado individualmente pelo Master normalmente, como em
  qualquer outro momento.

### Acessos Rápidos

- No máximo cinco acessos rápidos podem existir, exibidos no cabeçalho público antes do botão
  "Avisos". Cada um tem título, URL e ordem de exibição.
- Administradores Master e Administradores do Site podem incluir, editar, excluir e reordenar
  (arrastar e soltar) os acessos rápidos — mesma regra de acesso do Cadastro Menu.
- Cada acesso rápido pode ser **ocultado** do cabeçalho público sem ser excluído (flag `Ativo`).
- URLs aceitas seguem a mesma regra do Cadastro Menu: `https://`, `http://`, `/` ou `#`.
- Não pode haver dois acessos rápidos com a mesma ordem de exibição.
- Com o bloqueio de alterações ativo, mudanças feitas por um Administrador do Site entram na fila
  de validação do Master, como nas demais funcionalidades administrativas.
- Esta é uma entidade própria (`quick_access`), independente do Cadastro Menu/"Instituições e
  serviços": editar um não afeta o outro, mesmo que os 4 itens semeados tenham os mesmos títulos.
- Os 4 acessos rápidos semeados apontam para os sites oficiais reais (Polícia Civil, Polícia
  Militar, Polícia Científica, Conseg) e abrem em nova aba (`target="_blank"`) — URLs internas
  (`#`, usadas para rolar até "Instituições e serviços") continuam abrindo na mesma aba.

### Rodapé

- Exclusivo do Administrador Master: Administrador do Site não acessa nem altera estas
  configurações (sem fila de validação — a alteração é direta e imediata, como em "Visão Geral").
- Campos de endereço: logradouro, número, bairro, cidade, estado e CEP. Todos opcionais; a linha
  de endereço só aparece no rodapé público quando pelo menos um campo estiver preenchido.
- Campos de contato: telefone, e-mail de suporte, horário de atendimento e "Desenvolvido por"
  (todos texto livre).
- E-mail de suporte é validado no formato `usuario@dominio`.
- Redes sociais: Facebook, Instagram, YouTube e WhatsApp, cada uma com um campo de URL. Uma rede
  com URL vazia tem seu ícone ocultado no rodapé público; URLs informadas devem começar com
  `http://` ou `https://`. Facebook, Instagram e YouTube já vêm semeados com os perfis oficiais
  reais da SSP-SP (mock fornecido pelo usuário); WhatsApp permanece vazio/oculto até ser definido.
- O ícone de cada rede social é a logomarca real (`assets/images/social/`), não um badge de letra.
  A variante clara/escura é escolhida automaticamente pelo contraste do fundo do rodapé (cor
  primária do perfil visual ativo): fundo escuro usa a logo "tema-escuro" (clara, legível sobre
  fundo escuro); fundo claro usa a logo "tema-claro".
- No rodapé público, e-mail e telefone ficam lado a lado na mesma linha (não mais em linhas
  separadas); endereço, e-mail/telefone e horário de atendimento exibem um pequeno ícone (pino,
  envelope, telefone e relógio) ao lado do texto.
- "Desenvolvido por" vem semeado com `CGI - Coordenadoria de Gestão da Informação`.
- As informações são exibidas no rodapé de todas as páginas públicas (`index.html`, `avisos.html`).

## Cadastro Menu

- Administradores Master e Administradores do Site podem acessar a funcionalidade.
- Cada item possui título, URL e ordem de exibição; a descrição é opcional.
- É possível incluir, editar, excluir e alterar a ordem numérica dos itens.
- A tabela administrativa permite arrastar e soltar os itens para reordená-los.
- Após a confirmação da ordenação, as posições são renumeradas sequencialmente.
- Não podem existir dois itens com a mesma ordem; a regra é garantida também por índice único no SQLite.
- URLs aceitas devem iniciar com `https://`, `http://`, `/` ou `#`.
- Os quatro acessos institucionais originais permanecem no cabeçalho.
- Na página inicial, “Instituições e serviços” permanece recolhido e só exibe os itens após um clique.
- Todos os cartões de “Instituições e serviços” abrem em nova aba, independentemente do destino.
- Com o bloqueio ativo, alterações feitas por Administradores do Site entram na fila de validação do Master.
- São semeados 17 sistemas internos reais da SSP-SP como demonstração (Lista Ramais, Infocrim,
  Expedição de Documentos, RH, FISP, Placas Reservadas, SICON, Consulta Jurídica, CLC, Protocolo,
  Infoseg, RDO, WIKI, Informativos, Sala de Reuniões, Resoluções SSP, Almoxarifado), cada um com
  URL e breve descrição. Os 4 acessos institucionais (Polícia Civil/Militar/Científica/Conseg)
  **não fazem mais parte** de "Instituições e serviços" — continuam existindo apenas nos Acessos
  Rápidos do cabeçalho.

## Cadastro de Avisos

- Master e Administrador do Site podem incluir, editar, excluir e ordenar avisos por arraste.
- Avisos podem ser ativados ou inativados individualmente, por seleção múltipla ou por seleção de todos.
- A participação no carrossel também pode ser ativada ou desativada individualmente, por seleção múltipla ou por seleção de todos.
- Alterações de status em lote feitas por Administradores do Site seguem o fluxo de validação quando o bloqueio estiver ativo.
- Título e descrição são obrigatórios; a descrição aceita texto longo.
- Banner é enviado por upload de imagem (PNG, JPG, WebP, GIF, SVG ou AVIF, até 800 KB), no mesmo
  padrão de arrastar-e-soltar usado na logomarca dos perfis visuais; fica salvo somente no
  navegador de quem o cadastrou. Avisos semeados com banner por nome-base (arquivo já existente em
  `images_banner`, sem upload) continuam funcionando normalmente — o sistema resolve os dois casos.
- Extensões aceitas para banners: PNG, JPG/JPEG, WebP, GIF, SVG e AVIF.
- Nome e URL do botão são opcionais, mas a URL torna-se obrigatória quando houver nome de botão.
- As flags controlam se o aviso está ativo e se participa da área de banners.
- Na página pública, até cinco avisos ativos para carrossel são exibidos primeiro, respeitando a ordem cadastrada.
- Demais avisos ativos são exibidos em lista abaixo.
- Textos longos oferecem “Ver mais” e “Ver menos”; botão de link fica à esquerda e expansão à direita.
- Quebras de linha na descrição são preservadas visualmente no site (`.notice-description` usa
  `white-space: pre-line`): parágrafos e itens de lista digitados com `\n` no texto aparecem como
  linhas separadas de verdade, não como um bloco único.
- A cada carregamento da página pública, o primeiro aviso ativo da ordenação que possua um arquivo de banner localizado é exibido em um pop-up de destaque com botão para fechar; avisos sem banner são ignorados nessa escolha.
- Com bloqueio ativo, ações do Administrador do Site aguardam validação do Master.
- Ao ativar o bloqueio, o servidor desativa `Aviso Ativo` e `Aviso Ativo no Carrossel` de todos os avisos, ocultando-os imediatamente.
- Ao ativar o bloqueio, todos os avisos são inicialmente ocultados; depois disso, um Master pode reativar ou aprovar avisos, que voltam a ser exibidos mesmo com o bloqueio ligado.
- Ao desativar o bloqueio, as flags não são alteradas: permanecem ativos somente os avisos que já estavam ativos.
- A página inicial exibe somente os cinco primeiros avisos ativos na ordem; os demais ficam disponíveis na página `avisos.html`.
- Ao expandir um aviso, qualquer outro aviso aberto é recolhido automaticamente.
- São semeados 6 avisos de demonstração, nesta ordem: Consulta ao Conselho de Usuários (primeiro,
  também é o que aparece no pop-up de destaque), São Paulo por Todas, Programa Casa Paulista, O
  que é uma Hospitalidade no Serviço Público, Campanha de Arrecadação de Prendas e Agência SP (por
  último). Todos com banner e descrição longa o bastante para exibir "Ver mais"; todos já ativos e
  no carrossel. O Conselho de Usuários tem botão "Participe"; São Paulo por Todas, Casa Paulista,
  Hospitalidade e Agência SP têm botão "Acesse Aqui"; o de Arrecadação não tem botão.
- Com 6 avisos ativos, o Agência SP (último na ordem) fica de fora dos "cinco primeiros avisos"
  exibidos como cards na página inicial (regra já existente acima), mas continua aparecendo no
  carrossel (que considera todos os avisos ativos com banner, não só os cinco primeiros) e na
  listagem completa de `avisos.html` — na prática, "ativo só no carrossel" a pedido do usuário.
- Os banners do Conselho de Usuários e de Hospitalidade usam imagens largas (2560x397,
  `avaliacao-seguranca-publica-banner-2560x397.png` e `hospitalidade-banner-2560x397.png`),
  formato pensado para o carrossel.

## Carrossel de imagens

- O Master controla a exibição pelo seletor “Não / Sim” na Visão Geral.
- O carrossel usa somente avisos ativos, marcados para carrossel e com banner localizado.
- Sem banners elegíveis, o carrossel permanece oculto mesmo quando a configuração global estiver em “Sim”.
- O carrossel ocupa toda a largura da página, respeita a proporção dos banners e aparece acima do menu.
- Com carrossel visível, a área superior institucional tem altura reduzida.
- Ao bloquear alterações, o carrossel global muda automaticamente para “Não”; ao desbloquear, muda para “Sim”, respeitando as flags individuais dos avisos.

## Página de avisos

- O cabeçalho público possui o botão “Avisos”, que abre `avisos.html`.
- A página segue o perfil visual ativo e lista todos os avisos ativos.
- Cada item mostra inicialmente apenas título e resumo; “Ver mais” revela o texto completo e o banner, fechando qualquer outro item aberto.
- O Master pode bloquear a página pelo seletor na Visão Geral.
- O bloqueio é verificado no próprio navegador: `avisos.html` carrega normalmente e, assim que o
  JavaScript consulta `/api/site-settings`, redireciona para `index.html` se a página estiver
  bloqueada. **Sem valor de controle de acesso real** — não existe mais um servidor para recusar a
  requisição com HTTP 403 antes de entregar a página; quem desabilitar JavaScript ou inspecionar a
  resposta simulada da API ainda vê o HTML. Ver `docs/Auth.md` para o mesmo caveat aplicado à
  autenticação.
- Quando a página estiver bloqueada, o botão “Avisos” também permanece oculto no cabeçalho público.

## Bloqueio e validação de alterações

- O Administrador Master pode ativar a flag “Exigir validação do Master”.
- O controle é apresentado como seletor “Não / Sim”, sem campo de observação ou botão para salvar.
- Ao alterar o seletor, o sistema pede confirmação e aplica a mudança imediatamente; cancelamentos restauram o estado anterior.
- Ao selecionar “Sim”, o pop-up "Regras do bloqueio de alterações" exibe apenas a regra principal
  ("Ao ativar o bloqueio: Todas as alterações feitas por Administradores do Site precisarão da
  validação de um Administrador Master.") seguida de "Deseja continuar?". As demais consequências
  (ocultação/desativação dos avisos, desativação do carrossel, ausência do destaque, exigência de
  resolver pendências antes do desbloqueio) continuam ocorrendo de fato, apenas não são mais
  detalhadas no texto do pop-up.
- Com o bloqueio ativo, ações do Administrador do Site são registradas como pendentes e não alteram o site imediatamente.
- Um Master pode aprovar, aplicando a alteração, ou recusar a solicitação.
- Alterações feitas diretamente por um Master continuam sendo aplicadas imediatamente.
- O item "Validações pendentes" do menu do Master exibe um indicador numérico (badge vermelho,
  com destaque visual) com a quantidade de solicitações pendentes; fica oculto quando não há
  nenhuma pendente.
- O bloqueio não pode ser desativado enquanto existir qualquer alteração pendente; o sistema informa isso em pop-up.
- Com o bloqueio desativado, alterações autorizadas do Administrador do Site são aplicadas imediatamente.

## Confirmações e avisos

- Exclusões, aprovações, recusas, troca de perfil e encerramento de sessão exigem confirmação com “Sim” e “Não”.
- Toda conclusão ou falha administrativa apresenta pop-up informativo.
- Após a confirmação, listas, indicadores, estados e o perfil visual são atualizados imediatamente, sem recarregar a página.

## Visão Geral administrativa

- Exibe indicadores de usuários e solicitações conforme a permissão do administrador.
- Exibe quantidade de itens do menu, quantidade de perfis visuais, tema ativo e suas cores.
- Informa se as alterações estão em publicação direta ou sob validação, incluindo o total pendente.
- Os indicadores são carregados diretamente do SQLite e atualizados após as ações administrativas.

## Autenticação

- O login consulta usuários ativos na base simulada em `localStorage` (sem servidor).
- Senhas nunca são enviadas de volta à interface; apenas hashes com salt ficam armazenados.
- O encerramento invalida a sessão local e retorna ao login.
- **Aviso de protótipo**: como toda a lógica roda no navegador do próprio visitante, esta
  autenticação não tem valor de segurança real — qualquer pessoa com acesso ao código-fonte
  (sempre visível no navegador) pode inspecionar ou contornar a verificação. Não usar senhas
  reais nem tratar este login como controle de acesso de produção. Detalhes em `docs/Auth.md`.

## Estados

- Usuário: `Ativo` ou `Inativo` (a interface atual cria usuários ativos).
- Solicitação: `Pendente`, `Aprovado` ou `Recusado`.

## Dados institucionais pendentes

- Confirmar e substituir o logotipo provisório pela marca oficial.
- Confirmar e-mail, telefone, endereço e horário de atendimento oficiais exibidos no rodapé —
  os valores atuais (endereço da sede da SSP-SP) são dados de demonstração fornecidos pelo
  usuário como mock, não confirmados como definitivos.
- Definir destinos reais dos acessos Polícia Civil, Polícia Militar, Polícia Científica e Conseg.

## Histórico

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
