# API (simulada, client-side)

Atualizado em: 17/11/2026.

Não existe servidor real. As rotas abaixo são atendidas por `assets/js/mock-backend.js`, que
intercepta `window.fetch` para qualquer caminho iniciado por `/api/` e responde com dados de
`localStorage`. Mantido com o mesmo contrato (rota, método, payload, código HTTP) do antigo
backend Python, para que o frontend (`main.js`, `admin.js`, `painel.js`, `avisos.js`,
`theme.js`) não precisasse ser reescrito.

## Autenticação

- `POST /api/login` — `{cpf, password}` → `200 {user}` ou `401 {error}`.
- `POST /api/logout` → `200 {message}`.
- `GET /api/session` → `200 {user}` ou `401 {error}`.
- `user` agora inclui `profile_id`, `profile_name` (`null` quando `role==='master'`) e
  `effective_permissions` — matriz resolvida `{<área>: {view,create,edit,delete,publish}}` já
  pronta para a UI decidir o que mostrar, sem replicar a lógica de resolução de perfil de acesso.

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
- `GET /api/profiles` — requer permissão `identity:view` (Master sempre tem).
- `GET /api/change-control`, `GET /api/pending-changes` (lista exclusiva Master).
- `POST/PUT/DELETE /api/users/<id>` — exclusivo Master. Payload aceita `role` (`"master"` ou
  qualquer outro valor vira `"custom"`) e `profile_id` (obrigatório quando `role!=="master"`,
  precisa referenciar um `access_profiles` existente).
- `POST/PUT/DELETE /api/profiles/<id>` — requer permissão `identity:create/edit/delete` (ativar usa
  `identity:publish`); fica pendente de validação quando `change_control.locked=true` e o
  solicitante não é Master (perfis visuais sempre ficam em fila para não-Master, RN-PERFIL-009).
- `POST/PUT/DELETE /api/menu/<id>`, `PUT /api/menu/reorder` — requer permissão `menu:*`; mesma regra
  de fila acima.
- `POST/PUT/DELETE /api/quick-access/<id>`, `PUT /api/quick-access/reorder` — requer permissão
  `quick_access:*`; mesma regra de fila acima; limite de 5 itens.
- `POST/PUT/DELETE /api/notices/<id>`, `PUT /api/notices/reorder`,
  `PUT /api/notices/bulk-status`, `PUT /api/notices/bulk-carousel` — requer permissão `notices:*`;
  mesma regra de fila acima.
- `PUT /api/change-control`, `PUT /api/site-settings`, `PUT /api/footer-settings` — exclusivo Master, sem fila de validação.
- `PUT /api/pending-changes/<id>` — `{decision: "approved"|"rejected"}` — exclusivo Master.
- `PUT /api/requests/<id>` — `{status: "approved"|"rejected"}` — exclusivo Master.
- `GET/POST/PUT/DELETE /api/access-profiles`, `/api/access-profiles/<id>` — exclusivo Master
  (Perfis e Permissões, decisão de segurança — não é gatilhável via matriz de permissões, evita
  escalonamento de privilégio). Payload: `{name, description, permissions}`, onde `permissions` é a
  matriz `{<área>: {view,create,edit,delete,publish}}`. `GET` inclui `user_count` por perfil.
  `DELETE` rejeita com `409` perfis `is_system` ou com usuários vinculados.
- `GET /api/audit-logs?user_id=&area=&action=&date_from=&date_to=` — requer permissão
  `audit_logs:view` (Master sempre tem; delegável a um perfil de acesso). Retorna
  `{logs: [{id, timestamp, user_id, user_name, role, area, action, entity, entity_id, detail,
  result, method, path, status, message}]}`, mais recentes primeiro. `detail` é uma frase breve e
  legível em PT (nunca inclui senha/hash); `method`/`path`/`status`/`message` são os campos
  técnicos brutos da chamada, usados só no pop-up de detalhes da UI. Sem `PUT`/`DELETE` — registro
  imutável pela API.

## Limitações do mock

- Sem persistência compartilhada: cada navegador tem sua própria cópia dos dados.
- `banner_resolved` depende do manifesto estático `BANNER_FILES` em `mock-backend.js` — não há
  listagem dinâmica de diretório, pois não existe servidor.
- Sem rate limiting, sem TLS, sem proteção real de sessão — ver `docs/Auth.md`.
