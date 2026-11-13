# Plano: Reescrita completa de docs/REGRAS-DE-NEGOCIO.md

## Objetivo

Reescrever do zero `docs/REGRAS-DE-NEGOCIO.md`, organizado por telas (`T-NN`) e entidades
(`E-NOME`), com regras detalhadas, destacadas visualmente e com ID estável (`RN-<DOMINIO>-NNN`) e
status (`confirmada` / `⚠ inferida` / `a definir` / `revogada`), cobrindo todas as funcionalidades
públicas e administrativas do protótipo, a partir da leitura integral do código-fonte atual.

## Contexto

O arquivo anterior (382 linhas) já cobria boa parte das regras, mas em formato narrativo por
seção solta, sem IDs nem status formais exigidos pela governança global. O usuário pediu reescrita
do zero, "detalhando, destacando, separando as funcionalidades, as regras, mencionando telas".

Nesta sessão foram lidos integralmente: `assets/js/mock-backend.js` (1107 linhas, única fonte de
verdade do comportamento simulado), `assets/js/main.js`, `assets/js/avisos.js`, `assets/js/theme.js`,
`assets/js/admin.js`, `assets/js/painel.js`, `index.html`, `avisos.html`, `admin.html`,
`painel.html`, além de `docs/ARQUITETURA.md`, `docs/Auth.md`, `docs/API.md`, `docs/Organograma.md`
e o próprio `docs/REGRAS-DE-NEGOCIO.md` anterior (para não perder decisões já confirmadas pelo
usuário ao longo do histórico, como a cascata do Período Eleitoral, a fila de perfis sempre
obrigatória, etc.).

## Arquivos envolvidos

- `docs/REGRAS-DE-NEGOCIO.md` (reescrita completa)
- `docs/Progresso.md` (linha da tarefa)

## Etapas

1. Definir estrutura por telas: `T-01` Portal público (`index.html`), `T-02` Página de Avisos
   (`avisos.html`), `T-03` Login/Solicitação de acesso (`admin.html`), `T-04`...`T-09` sub-telas do
   Painel Administrativo (`painel.html`: Visão Geral, Cadastro de Usuários, Cabeçalho e Rodapé,
   Acessos Rápidos, Cadastro Menu, Cadastro de Avisos, Validações pendentes) e por entidades
   (`E-USUARIO`, `E-SOLICITACAO_ACESSO`, `E-PERFIL_VISUAL`, `E-ACESSO_RAPIDO`, `E-MENU_ITEM`,
   `E-AVISO`, `E-RODAPE`, `E-CONTROLE_ALTERACAO`, `E-ALTERACAO_PENDENTE`).
2. Atribuir ID `RN-<DOMINIO>-NNN` e status a cada regra. A maioria entra como `confirmada` (já
   implementada e validada pelo usuário ao longo do histórico anterior do documento); regras que só
   aparecem no código, sem rastro de decisão explícita, entram como `⚠ inferida`.
3. Redigir o documento completo, preservando a seção "Histórico" já existente (decisões datadas) e
   "Dados institucionais pendentes".
4. Autovalidar o novo texto contra o código-fonte lido e contra o arquivo anterior, item a item,
   para não perder nenhuma regra já confirmada.
5. Atualizar `docs/Progresso.md` com a linha da tarefa.

## Sincronização de documentação

Estado **previsto** de cada documento ao fim desta tarefa.

| Documento                                     | Previsto                         | Motivo                                                             |
| ---------------------------------------------- | --------------------------------- | -------------------------------------------------------------------- |
| `docs/REGRAS-DE-NEGOCIO.md` (=`RegrasNegocio.md`) | atualizado (reescrita completa) | pedido explícito do usuário                                        |
| `docs/ARQUITETURA.md`                          | sem alteração                     | nenhuma mudança de camada/módulo/schema/fluxo de dados             |
| `docs/Organograma.md`                          | sem alteração                     | nenhuma mudança de fluxo entre módulos                              |
| `docs/Infraestrutura.md`                       | sem alteração                     | nenhuma mudança de deploy/infraestrutura                            |
| `docs/API.md`                                  | sem alteração                     | nenhuma mudança de rota/payload/contrato                            |
| `docs/DESIGN-SYSTEM.md` (=`Frontend.md`)       | sem alteração                     | nenhuma mudança de componente/tela/token visual                    |
| `docs/Auth.md`                                 | sem alteração                     | nenhuma mudança de autenticação/sessão                              |
| `docs/RAG.md`                                  | n/a                                | projeto sem corpus indexado (já declarado `n/a` no CLAUDE.md local) |
| `docs/Progresso.md`                            | atualizado                        | sempre                                                               |
| `docs/Memoria.md`                               | sem alteração                     | nenhum aprendizado novo não coberto pela memória já existente       |
| `docs/Harness.md`                               | n/a                                | sem harness multiagente configurado neste repositório (já declarado no CLAUDE.md local) |

## Validação

- [ ] Autovalidação (Validator inline, sessão única — ver `docs/Harness.md` = n/a neste projeto):
      conferida regra a regra contra `mock-backend.js` e demais arquivos-fonte.
- [ ] Tester: n/a — tarefa puramente documental, sem alteração de comportamento/código; nada a
      executar além da leitura comparativa já feita.
- [ ] Security Specialist: nenhum segredo novo incluído; senhas de demonstração já são públicas em
      `docs/Auth.md` e no próprio `mock-backend.js` (exposição intencional documentada).
- [ ] Tabela de sincronização conferida contra o diff real.
- [ ] `docs/Progresso.md` atualizado.

## Riscos e decisões pendentes

- Risco: ao reorganizar por telas, alguma nuance fina do histórico anterior (382 linhas) poderia se
  perder. Mitigação: a seção "Histórico" é preservada integralmente, só reposicionada.
- Regras encontradas somente no código-fonte, sem menção no documento anterior nem no histórico,
  serão marcadas `⚠ inferida` e listadas nas pendências da resposta final, para confirmação do
  usuário.
