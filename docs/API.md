# API (simulada, client-side)

Atualizado em: 11/11/2026.

Não existe servidor real. As rotas abaixo são atendidas por `assets/js/mock-backend.js`, que
intercepta `window.fetch` para qualquer caminho iniciado por `/api/` e responde com dados de
`localStorage`. Mantido com o mesmo contrato (rota, método, payload, código HTTP) do antigo
backend Python, para que o frontend (`main.js`, `admin.js`, `painel.js`, `avisos.js`,
`theme.js`) não precisasse ser reescrito.

## Autenticação

- `POST /api/login` — `{cpf, password}` → `200 {user}` ou `401 {error}`.
- `POST /api/logout` → `200 {message}`.
- `GET /api/session` → `200 {user}` ou `401 {error}`.

## Público

- `GET /api/health` → `200 {status, application}`.
- `GET /api/theme` → `200 {profile}` (perfil visual ativo).
- `GET /api/site-settings` → `200 {settings:{carousel_enabled, notices_page_blocked}}`.
- `GET /api/menu` → `200 {items}` (somente ativos se não autenticado).
- `GET /api/quick-access` → `200 {items}` (acessos rápidos do cabeçalho; somente ativos se não autenticado).
- `GET /api/footer-settings` → `200 {settings}` (endereço, contato e redes sociais do rodapé; público, sem autenticação).
- `GET /api/notices` → `200 {notices}` (somente ativos se não autenticado; inclui `banner_resolved`).
- `POST /api/access-requests` — `{name, cpf, email, unit}` → `201 {message}` ou `400 {error}`.

## Administrativo (requer sessão)

- `GET /api/users`, `GET /api/requests` — exclusivo Master.
- `GET /api/profiles`, `GET /api/change-control`, `GET /api/pending-changes` (lista exclusiva Master).
- `POST/PUT/DELETE /api/users/<id>` — exclusivo Master.
- `POST/PUT/DELETE /api/profiles/<id>` — qualquer administrador autenticado; fica pendente de
  validação quando `change_control.locked=true` e o solicitante não é Master.
- `POST/PUT/DELETE /api/menu/<id>`, `PUT /api/menu/reorder` — mesma regra de fila acima.
- `POST/PUT/DELETE /api/quick-access/<id>`, `PUT /api/quick-access/reorder` — mesma regra de fila
  acima; limite de 5 itens.
- `POST/PUT/DELETE /api/notices/<id>`, `PUT /api/notices/reorder`,
  `PUT /api/notices/bulk-status`, `PUT /api/notices/bulk-carousel` — mesma regra de fila acima.
- `PUT /api/change-control`, `PUT /api/site-settings`, `PUT /api/footer-settings` — exclusivo Master, sem fila de validação.
- `PUT /api/pending-changes/<id>` — `{decision: "approved"|"rejected"}` — exclusivo Master.
- `PUT /api/requests/<id>` — `{status: "approved"|"rejected"}` — exclusivo Master.

## Limitações do mock

- Sem persistência compartilhada: cada navegador tem sua própria cópia dos dados.
- `banner_resolved` depende do manifesto estático `BANNER_FILES` em `mock-backend.js` — não há
  listagem dinâmica de diretório, pois não existe servidor.
- Sem rate limiting, sem TLS, sem proteção real de sessão — ver `docs/Auth.md`.
