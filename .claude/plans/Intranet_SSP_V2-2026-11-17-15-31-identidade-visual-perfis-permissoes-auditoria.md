# Plano: Identidade Visual + Perfis e Permissões + Logs de Auditoria

## Objetivo

1. Renomear o menu "Cabeçalho e Rodapé" para "Identidade Visual" (mesma view, mesmas regras de
   bloqueio eleitoral).
2. Substituir o papel fixo "Administrador do Site" por um cadastro dinâmico de perfis de acesso,
   com matriz de permissões por área × ação, administrado pelo Master. Master continua com acesso
   total fixo (não configurável).
3. Criar tela de Logs de Auditoria (somente leitura) registrando ações, acessos, negações e
   alterações de permissão.

## Decisões já confirmadas com o usuário

- Master sempre tem acesso total a tudo, de forma fixa (não é um perfil editável). "Administrador"
  (todo usuário não-Master) só acessa o que o Master conceder via perfil de acesso.
- A matriz de permissões cobre **todas** as áreas administrativas: Usuários, Identidade Visual,
  Menu, Avisos, Validações Pendentes, Perfis e Permissões, Logs de Auditoria.
- A trava de "último Master" é generalizada: bloqueia excluir, desativar ou rebaixar o papel de
  qualquer usuário sempre que ele for o único Master ativo restante. Isso **revoga** `RN-USR-005b`
  (que protegia só o CPF fixo de demonstração) substituindo-a por uma regra mais ampla.

## Contexto

Protótipo estático sem backend real (`assets/js/mock-backend.js` simula a API via `localStorage`).
Hoje só existem 2 papéis fixos no código (`role: 'master'|'site'`, `RN-PERM-001`..`004`). Toda
escrita de Administrador do Site passa por fila de aprovação do Master (`RN-PERFIL-009`,
`RN-BLOQ-003`), e só Master aprova (`RN-SOLIC-003`, `RN-BLOQ-005`) — regras `confirmada` que **não**
serão contrariadas: os toggles "aprovar" e "publicar direto sem fila" na matriz de permissões ficam
disponíveis na UI para uso futuro, mas o backend mock continua exigindo Master para aprovar
fila e para editar Rodapé (`RN-RODAPE-001`), independente do que o toggle do perfil disser. Isso vai
para "Riscos e decisões pendentes" — não é um bloqueio, é uma limitação assumida e documentada.

## Arquivos envolvidos

- `painel.html` — sidebar, renomeação de rótulo, novas views (`#profiles-access-view`,
  `#audit-logs-view`), novo formulário de perfil de acesso, filtros de auditoria.
- `assets/js/painel.js` — renderização das novas views, matriz de permissões (checkboxes),
  filtros de log, esconder/mostrar itens de menu conforme permissão do usuário logado.
- `assets/js/mock-backend.js` — entidade `access_profiles` (CRUD), entidade `audit_logs`
  (somente leitura, sem endpoint de escrita externo), `users.profile_id`, wrapper central de log
  em volta do dispatcher de rotas, trava de último Master generalizada, checagem de permissão
  por área/ação substituindo a checagem fixa de `role === 'site'`.
- `assets/css/styles.css` — estilos da grade de permissões e da tabela de logs, reaproveitando
  tokens existentes.
- `docs/REGRAS-DE-NEGOCIO.md`, `docs/ARQUITETURA.md`, `docs/API.md`, `docs/Auth.md`,
  `docs/Organograma.md`, `docs/Progresso.md`, `docs/Memoria.md` — sincronização obrigatória.

## Etapas

1. **Identidade Visual**: renomear rótulo no sidebar e título da view (manter id interno
   `headers-view` para reduzir blast radius); atualizar `docs/REGRAS-DE-NEGOCIO.md` (mapa de telas
   T-06, histórico) sem alterar o conteúdo funcional da regra de bloqueio eleitoral.
2. **Modelo de dados de permissões**: criar `access_profiles` em `mock-backend.js` (seed migrando
   as capacidades atuais do "Administrador do Site" para um perfil semeado "Administrador do
   Site", editável mas protegido contra exclusão enquanto houver usuário vinculado); adicionar
   `profile_id` em `users` para usuários não-Master; manter `role: 'master'` fixo e sem perfil.
3. **Checagem de permissão**: criar `requirePermission(area, ação)` em `mock-backend.js`,
   substituindo os pontos hoje gated só por `role !== 'site'`/fila manual, preservando as
   exceções já confirmadas que exigem Master mesmo sem relação direta com a matriz
   (`requireMaster()` em Rodapé, aprovação de fila, gestão de usuários e de perfis de acesso).
4. **Tela Perfis e Permissões**: novo menu e view master-only (`T-10`) com CRUD de perfis e grade
   de permissões por área × ação (visualizar/incluir/editar/excluir/publicar/aprovar); cadastro de
   usuário passa a escolher perfil de acesso (ou "Administrador Master") em vez de um papel fixo.
5. **Trava de último Master**: generalizar a validação (excluir, desativar, rebaixar) para
   qualquer usuário Master quando for o último ativo; revogar `RN-USR-005b` com data/motivo e
   registrar a nova regra.
6. **Logs de auditoria**: entidade `audit_logs` alimentada por um wrapper central no dispatcher de
   rotas do mock backend (login/logout, escrita em qualquer entidade, aprovações, negações 403,
   alterações de permissão); sem endpoint de escrita/edição exposto pela API mock.
7. **Tela Logs de Auditoria**: novo menu e view master-only (`T-11`), somente leitura, com filtros
   por usuário, período e tipo de ação.
8. **Sincronização de documentação**: atualizar os documentos da tabela de gatilhos conforme
   seção abaixo, incluindo IDs novos de regra em `docs/REGRAS-DE-NEGOCIO.md` com status `confirmada`
   (comportamento pedido explicitamente pelo usuário) e a revogação formal de `RN-USR-005b`.
9. **Validação independente**: Validator (sonnet), Tester (haiku) e Security Specialist (sonnet)
   em paralelo após a implementação ficar testável.

## Sincronização de documentação

Estado **previsto** de cada documento ao fim desta tarefa.

| Documento                | Previsto    | Motivo                                                                 |
| ------------------------ | ----------- | ----------------------------------------------------------------------- |
| `docs/REGRAS-DE-NEGOCIO.md` | atualizado | Novo T-10/T-11, novas entidades, novas regras RN-PERFILACESSO-*/RN-AUDIT-*, revogação de RN-USR-005b, reescrita da tabela Master × Administrador do Site |
| `docs/ARQUITETURA.md`    | atualizado  | Novas entidades (`access_profiles`, `audit_logs`), novo fluxo de checagem de permissão e de log |
| `docs/Organograma.md`    | atualizado  | Duas novas telas/fluxos administrativos (Perfis e Permissões, Logs de Auditoria) |
| `docs/Infraestrutura.md` | sem alteração | Nenhuma mudança de deploy/Docker/ambiente |
| `docs/API.md`            | atualizado  | Novos endpoints `access-profiles` e `audit-logs`, campo `profile_id` em `/api/users` |
| `docs/DESIGN-SYSTEM.md`  | a confirmar na implementação | `atualizado` se a grade de permissões/tabela de logs introduzir padrão visual novo; `sem alteração` se reaproveitar componentes existentes |
| `docs/Auth.md`           | atualizado  | Modelo de autorização passa de papel fixo para papel + perfil com matriz de permissões |
| `docs/Progresso.md`      | atualizado  | sempre |
| `docs/Memoria.md`        | atualizado  | Decisões de arquitetura tomadas nesta tarefa (Master fixo, trava de último Master generalizada) |
| `docs/Harness.md`        | n/a         | Projeto sem harness multiagente persistente configurado |

## Validação

- [ ] Validator aprovou.
- [ ] Tester aprovou.
- [ ] Security Specialist aprovou.
- [ ] Tabela de sincronização preenchida com o estado real e conferida contra o diff.
- [ ] Documentos condicionais cujo gatilho disparou foram criados.
- [ ] `docs/Progresso.md` atualizado.

## Riscos e decisões pendentes

- Toggles "aprovar" e "publicar direto" na matriz de permissões ficam disponíveis na UI mas não
  têm efeito sobre as regras hoje `confirmada` que restringem aprovação de fila e edição de
  Rodapé ao Master — contradizer essas regras exigiria nova confirmação explícita do usuário, que
  não foi pedida aqui.
- "Registrar acessos" nos logs de auditoria foi interpretado como eventos de login/logout e
  chamadas de API (GET incluído), não como cada clique de navegação de UI sem chamada ao backend
  mock — se o usuário quiser granularidade de navegação pura, é um ajuste futuro.
- Protótipo sem persistência compartilhada entre visitantes/abas: os logs de auditoria herdam essa
  limitação conhecida do projeto (ficam no `localStorage` do navegador, não em um banco real).
