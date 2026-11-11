# Arquitetura

Atualizado em: 01/07/2026.

## Estado atual

Aplicação multipágina em HTML5, CSS3 e JavaScript nativo, servida por backend Python. A persistência utiliza SQLite sem dependências externas.

## Páginas

- `index.html`: portal público, acessos institucionais e informações de contato.
- `admin.html`: autenticação e criação de solicitação de acesso.
- `painel.html`: visão geral e módulo Cadastro de Usuários.

## Persistência e segurança

- `data/intranet.db`: usuários, solicitações e perfis visuais.
- `change_control`: estado e observação do bloqueio de alterações.
- `pending_changes`: fila de alterações submetidas por Administradores do Site, com solicitante, conteúdo, decisão e revisor.
- `menu_items`: itens do menu público, conteúdo, destino e ordem de exibição.
- `ux_menu_display_order`: índice único que impede posições duplicadas no menu.
- `notices`: avisos, banners, links, flags e ordem de exibição.
- `ux_notice_display_order`: índice único que impede posições duplicadas entre avisos.
- `change_control.carousel_enabled`: controla o carrossel público.
- `change_control.notices_page_blocked`: bloqueia `avisos.html` também no servidor.
- Senhas: PBKDF2-HMAC-SHA256 com salt individual e 210 mil iterações.
- Sessão: token aleatório em cookie `HttpOnly`, `SameSite=Strict`, duração de oito horas.
- A API nunca devolve hashes de senha.
- Operações de usuários e perfis validam o perfil Master no servidor.

O dicionário de sessões está em memória; reiniciar o servidor encerra as sessões, sem apagar dados.

## Próxima arquitetura recomendada

- Frontend mantido como aplicação modular ou migrado para framework conforme o crescimento.
- Migrar a API atual para um servidor de produção com TLS e armazenamento compartilhado de sessões.
- Banco de dados relacional com restrições únicas para CPF e e-mail.
- Serviço de identidade com senhas em hash, MFA opcional e sessões revogáveis.
- Registro imutável de quem aprovou, recusou ou alterou cada acesso.
- Variáveis de ambiente para configurações e dados de contato.

## Convenções

- Arquivos e URLs em minúsculas, sem espaços.
- Um arquivo JavaScript por contexto de página.
- Tokens visuais centralizados em `:root` no CSS.
- Conteúdo, estilos, scripts, imagens e documentação em diretórios próprios.
- Alterações de regra de negócio e design devem acompanhar a atualização da documentação no mesmo conjunto de mudanças.
