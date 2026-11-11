# Autenticação (protótipo estático)

Atualizado em: 11/11/2026.

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
