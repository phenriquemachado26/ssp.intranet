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
