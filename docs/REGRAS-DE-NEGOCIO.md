# Regras de Negócio

Atualizado em: 11/11/2026.

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

## Gestão do Cabeçalho

- Podem existir no máximo cinco perfis visuais.
- Apenas um perfil pode ficar em uso por vez.
- Cada perfil contém nome, logomarca e três cores. O título da página é fixo
  (“Intranet SSP”) em todos os perfis, para preservar a identidade institucional, e não é
  editável no cadastro.
- A logomarca é enviada por upload de imagem (PNG, JPG, SVG, WebP ou AVIF, até 300 KB); não é
  mais um campo de texto com o nome de um arquivo em `assets/images`. A imagem enviada fica salva
  somente no navegador de quem a cadastrou (ver `docs/Auth.md`/`docs/ARQUITETURA.md`); perfis
  semeados (como a Paleta Padrão) continuam usando o arquivo estático `logo-ssp.svg`.
- O perfil ativo é aplicado à marca, ao cabeçalho, ao rodapé e aos detalhes do site.
- A `Paleta Padrão` é criada automaticamente e não pode ser excluída.
- Um perfil em uso não pode ser excluído; primeiro deve-se ativar outro.
- Perfis podem ser criados, editados, ativados e excluídos pelo Master.
- Um perfil pode ser marcado como **protegido**: não pode ser editado nem excluído por ninguém,
  nem mesmo pelo Administrador Master (continua podendo ser ativado normalmente). O perfil
  `Período Eleitoral` é semeado como protegido nesta demonstração.

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
- Com o bloqueio ativo, alterações feitas por Administradores do Site entram na fila de validação do Master.

## Cadastro de Avisos

- Master e Administrador do Site podem incluir, editar, excluir e ordenar avisos por arraste.
- Avisos podem ser ativados ou inativados individualmente, por seleção múltipla ou por seleção de todos.
- A participação no carrossel também pode ser ativada ou desativada individualmente, por seleção múltipla ou por seleção de todos.
- Alterações de status em lote feitas por Administradores do Site seguem o fluxo de validação quando o bloqueio estiver ativo.
- Título e descrição são obrigatórios; a descrição aceita texto longo.
- Banner é informado pelo nome disponível em `images_banner`; o servidor ignora a extensão cadastrada e resolve o arquivo real pelo nome-base.
- Extensões aceitas para banners: PNG, JPG/JPEG, WebP, GIF, SVG e AVIF.
- Nome e URL do botão são opcionais, mas a URL torna-se obrigatória quando houver nome de botão.
- As flags controlam se o aviso está ativo e se participa da área de banners.
- Na página pública, até cinco avisos ativos para carrossel são exibidos primeiro, respeitando a ordem cadastrada.
- Demais avisos ativos são exibidos em lista abaixo.
- Textos longos oferecem “Ver mais” e “Ver menos”; botão de link fica à esquerda e expansão à direita.
- A cada carregamento da página pública, o primeiro aviso ativo da ordenação que possua um arquivo de banner localizado é exibido em um pop-up de destaque com botão para fechar; avisos sem banner são ignorados nessa escolha.
- Com bloqueio ativo, ações do Administrador do Site aguardam validação do Master.
- Ao ativar o bloqueio, o servidor desativa `Aviso Ativo` e `Aviso Ativo no Carrossel` de todos os avisos, ocultando-os imediatamente.
- Ao ativar o bloqueio, todos os avisos são inicialmente ocultados; depois disso, um Master pode reativar ou aprovar avisos, que voltam a ser exibidos mesmo com o bloqueio ligado.
- Ao desativar o bloqueio, as flags não são alteradas: permanecem ativos somente os avisos que já estavam ativos.
- A página inicial exibe somente os cinco primeiros avisos ativos na ordem; os demais ficam disponíveis na página `avisos.html`.
- Ao expandir um aviso, qualquer outro aviso aberto é recolhido automaticamente.

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
- Ao selecionar “Sim”, o pop-up detalha previamente todas as consequências: necessidade de validação, ocultação e desativação dos avisos, desativação do carrossel, ausência do destaque e exigência de resolver pendências antes do desbloqueio.
- Com o bloqueio ativo, ações do Administrador do Site são registradas como pendentes e não alteram o site imediatamente.
- Um Master pode aprovar, aplicando a alteração, ou recusar a solicitação.
- Alterações feitas diretamente por um Master continuam sendo aplicadas imediatamente.
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
- Confirmar e-mail e telefone oficiais exibidos no rodapé.
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
