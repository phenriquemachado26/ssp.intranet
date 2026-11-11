# CLAUDE.md — Intranet SSP

## Objetivo do projeto

Protótipo de portal institucional e painel administrativo da Secretaria de Segurança Pública,
para demonstrar fluxo de navegação pública, autenticação, gestão de menu/avisos/perfis visuais e
fila de aprovação de alterações. Publicado como link compartilhável para acompanhamento por
terceiros, sem infraestrutura de servidor.

## Stack principal

- HTML5, CSS3 e JavaScript nativo (sem framework, sem build step).
- **Sem backend e sem banco de dados real.** `assets/js/mock-backend.js` simula a API
  (`fetch('/api/...')`) e persiste tudo em `localStorage` do navegador.
- Hospedagem: GitHub Pages, repositório `phenriquemachado26/ssp.intranet`, branch `main`.

## Banco de dados

Não há banco de dados. Dados de demonstração vivem em `localStorage["sspIntranetDb"]`, por
navegador/aba, sem compartilhamento entre visitantes. Ver `docs/ARQUITETURA.md` e `docs/Auth.md`.

## Autenticação

Simulada inteiramente no navegador (sem valor de segurança real). Ver `docs/Auth.md` antes de
qualquer alteração relacionada a login, sessão ou permissões.

## Convenções de código

- Um arquivo JavaScript por contexto de página (`main.js`, `admin.js`, `painel.js`, `avisos.js`,
  `theme.js`), mais `mock-backend.js` como camada de simulação de API.
- Tokens visuais centralizados em `:root` no CSS (`assets/css/styles.css`).
- Arquivos e URLs em minúsculas, sem espaços.

## Estrutura de diretórios

Ver `README.md` → seção "Estrutura".

## Comandos úteis

```powershell
npx serve .
# ou
python -m http.server 8088
```

Não há comando de build, lint ou teste automatizado configurado (protótipo estático simples).

## Estratégia de testes

Sem suíte automatizada. Validação manual: servir os arquivos localmente, percorrer os fluxos de
`docs/REGRAS-DE-NEGOCIO.md` (login, CRUD de menu/avisos/perfis, fila de validação, bloqueio) e
conferir ausência de erros no console do navegador.

## Decisões arquiteturais relevantes

Ver `docs/ARQUITETURA.md`.

## Restrições conhecidas

- Sem persistência compartilhada entre visitantes.
- Sem segurança real na autenticação (ver `docs/Auth.md`).
- Banner precisa estar listado manualmente em `BANNER_FILES` (`assets/js/mock-backend.js`).

## Regras de negócio

`docs/REGRAS-DE-NEGOCIO.md` (equivalente ao `docs/RegrasNegocio.md` das instruções globais —
nome preservado por ser a convenção já estabelecida neste projeto antes da adoção da governança
global).

## Mapeamento para os onze documentos de governança global

Este projeto usa nomes de arquivo próprios, definidos antes da adoção do `~/.claude/CLAUDE.md`
global. Mapeamento:

| Documento global          | Equivalente neste projeto      | Observação |
| -------------------------- | ------------------------------- | ---------- |
| `docs/RegrasNegocio.md`     | `docs/REGRAS-DE-NEGOCIO.md`     | — |
| `docs/Arquitetura.md`       | `docs/ARQUITETURA.md`           | — |
| `docs/Organograma.md`       | `docs/Organograma.md`           | criado |
| `docs/Infraestrutura.md`    | `docs/Infraestrutura.md`        | criado |
| `docs/API.md`               | `docs/API.md`                   | criado (contrato do mock) |
| `docs/Frontend.md`          | — | `n/a`: coberto por `docs/DESIGN-SYSTEM.md` |
| `docs/Auth.md`              | `docs/Auth.md`                  | criado |
| `docs/RAG.md`               | — | `n/a`: projeto sem corpus indexado ou capacidade de RAG |
| `docs/Progresso.md`         | `docs/Progresso.md`             | criado |
| `docs/Memoria.md`           | `docs/Memoria.md`               | criado |
| `docs/Harness.md`           | — | `n/a`: execução em sessão única, sem harness multiagente persistente configurado neste repositório |

## Ordem de leitura local

1. `~/.claude/CLAUDE.md` (global)
2. Este arquivo
3. `docs/REGRAS-DE-NEGOCIO.md`
4. `docs/ARQUITETURA.md`
5. `docs/Organograma.md`
6. `docs/Infraestrutura.md`
7. `docs/API.md`
8. `docs/DESIGN-SYSTEM.md`
9. `docs/Auth.md`
10. `docs/Progresso.md`
11. `docs/Memoria.md`
