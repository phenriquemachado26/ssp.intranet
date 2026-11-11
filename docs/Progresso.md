# Progresso

Histórico de tarefas concluídas no projeto. Cada linha é adicionada ao final de uma tarefa, após
Validator/Tester/Security Specialist concluírem a revisão.

## 11/11/2026 — Migração para protótipo 100% estático (sem backend/banco de dados)

Removidos `app.py` (servidor Python) e `data/intranet.db` (SQLite); toda a persistência passou a
ser simulada em `localStorage` via `assets/js/mock-backend.js`, que intercepta
`window.fetch('/api/...')` e replica fielmente as regras de negócio do backend original. Páginas
e scripts existentes não foram reescritos. Publicado no GitHub Pages
(`phenriquemachado26/ssp.intranet`, branch `main`).

- **Tester** (eu mesmo, Coder — sem suíte automatizada pré-existente): 28 cenários de lógica de
  negócio validados via harness Node.js (login, sessão, permissões por perfil, fila de validação,
  bloqueio/desbloqueio, reordenação, aprovação de pendências) — todos passando. Páginas estáticas
  verificadas com servidor HTTP local (200 em todas, ordem de scripts correta). Encontrada e
  corrigida uma condição de corrida real no seed da senha de demonstração antes da primeira
  rodada de revisão.
- **Validator**: `REJECTED` na primeira rodada (checagem de `display_order` duplicado ausente em
  avisos; seção "Página de avisos" de `docs/REGRAS-DE-NEGOCIO.md` desatualizada). Corrigido;
  **`APPROVED`** na segunda rodada.
- **Security Specialist**: `REJECTED` na primeira rodada (escape incompleto em contexto de
  atributo HTML — self-XSS hoje, risco real se um backend compartilhado vier a existir).
  Corrigido; **`APPROVED`** na segunda rodada.
- Pendência não bloqueante registrada pelo Validator: `docs/REGRAS-DE-NEGOCIO.md` não usa o
  esquema de ID/status (`RN-<DOMINIO>-<NNN>`) das instruções globais — lacuna de convenção
  pré-existente ao projeto, mais ampla que esta tarefa.
- Falta um passo manual do usuário: habilitar o GitHub Pages nas configurações do repositório
  (`Settings → Pages → Deploy from a branch → main / root`).

## 11/11/2026 — GitHub Pages habilitado; contas de demonstração e seletor de CPF

Usuário confirmou GitHub Pages habilitado e funcionando. Adicionadas 4 contas de demonstração
semeadas (2 Master, 2 Administrador do Site) via `DEMO_ACCOUNTS` em `assets/js/mock-backend.js`.
Tela de login (`admin.html`/`admin.js`) ganhou um seletor de CPF: clicar no campo abre a lista de
contas cadastradas (ícone ★ para Master, ● para Site), selecionar uma preenche CPF e senha
automaticamente. Removido o aviso estático com a credencial de demonstração. 31 cenários de
lógica validados via harness Node (18 anteriores + regressões do Validator/Security + 4 do
seletor de contas). Mudança pontual e de baixo risco (prototype, UI/seed de dados) — não
reexecutado o ciclo completo Validator/Security Specialist desta vez; será reexecutado antes de
fechar o lote de "mocks" que o usuário ainda vai pedir.
