# Autenticação (protótipo estático)

Atualizado em: 17/11/2026.

## Modelo

Não existe servidor. Todo o fluxo de autenticação roda dentro de `assets/js/mock-backend.js`,
no navegador do próprio visitante:

- Senhas são hasheadas com PBKDF2-HMAC-SHA256 (`crypto.subtle`, Web Crypto API nativa do
  navegador), salt de 16 bytes, 210 mil iterações — mesma receita do antigo backend Python.
- O hash fica em `localStorage["sspIntranetDb"]`, junto com todos os demais dados.
- Uma sessão válida é um objeto `{ id, name, cpf, email, role, active, created_at, expires }`
  salvo em `localStorage["sspIntranetSession"]`, com expiração de 8 horas (`Date.now()`).
- Não há cookie `HttpOnly` real, porque não há servidor para emitir um. O "token" é o próprio
  objeto de sessão salvo no navegador.
- `window.sspDemoAccounts()` expõe as 4 contas de demonstração semeadas (nome, CPF, perfil e a
  senha em texto puro) — usado pelo seletor de CPF em `admin.html`/`admin.js` para preencher a
  senha automaticamente ao escolher uma conta. Exposição intencional: como a "senha" não protege
  nada real neste protótipo, listá-la explicitamente para quem for testar é mais útil do que
  escondê-la atrás de uma falsa sensação de sigilo.

## Autorização: Master × perfil de acesso

- Dois valores de `role`: `"master"` (acesso total e fixo, não configurável) e qualquer outro valor
  (tratado como administrador comum). Um usuário não-Master tem suas permissões definidas por um
  **perfil de acesso** vinculado (`users.profile_id` → `access_profiles`), administrado pelo Master
  em Perfis e Permissões — ver `docs/REGRAS-DE-NEGOCIO.md` → T-10.
- Cada perfil de acesso é uma matriz `{área: {view,create,edit,delete,publish}}`. A sessão
  (`GET /api/session`, `POST /api/login`) devolve essa matriz já resolvida em
  `user.effective_permissions`, para o frontend decidir o que exibir sem reimplementar a lógica de
  resolução.
- `requirePermission(db, area, action)` é o portão central de autorização para as áreas
  configuráveis (Identidade Visual, Cadastro Menu, Cadastro de Avisos, Acessos Rápidos). Três áreas
  continuam **sempre** exigindo Master no backend, independentemente da matriz de qualquer perfil
  de acesso: Cadastro de Usuários, Validações Pendentes e Perfis e Permissões — decisão de
  segurança para impedir que um perfil de acesso seja configurado para criar/promover outros
  Masters, aprovar a própria fila de validação ou alterar a própria matriz de permissões.
- Somente o Master pode conceder ou retirar o papel de Master de um usuário.
- Último Master ativo: o sistema rejeita (`409`) qualquer tentativa de excluir, desativar ou
  rebaixar a última conta de Administrador Master ativa, mesmo quando executada por outro Master.
- Logs de Auditoria (`audit_logs`) registram login/logout, toda mutação administrativa e toda
  tentativa negada por falta de permissão — imutáveis pela interface administrativa, sem endpoint
  de edição/exclusão na API simulada. Ver `docs/REGRAS-DE-NEGOCIO.md` → T-11.

## Por que isto NÃO é segurança real

- Todo o código-fonte (incluindo a lógica de validação de senha) é entregue ao navegador do
  visitante e pode ser lido, modificado ou contornado via DevTools.
- Qualquer pessoa pode editar `localStorage` diretamente e se autoproclamar `role: "master"`.
- Não existe um servidor de confiança para arbitrar o que é verdade — o "banco de dados" vive
  no próprio navegador de quem está olhando.

**Conclusão prática:** esta autenticação serve para demonstrar o fluxo de UX (telas de login,
permissões por perfil, fila de aprovação), não como controle de acesso real. Nunca reutilizar
senhas reais aqui, e nunca tratar este protótipo como ambiente de produção.

## Quando houver backend real

Ao sair da fase de protótipo (ver `docs/ARQUITETURA.md` → "Próxima arquitetura recomendada"):

- Mover toda a validação de senha e emissão de sessão para um servidor confiável.
- Trocar PBKDF2 por **Argon2id** no servidor (padrão exigido pelas instruções globais do projeto
  para armazenamento de senha em sistemas reais).
- Emitir sessões com token revogável e TLS obrigatório.
