# Infraestrutura

Atualizado em: 11/11/2026.

## Hospedagem

- **GitHub Pages**, a partir do repositório `https://github.com/phenriquemachado26/ssp.intranet`,
  branch `main`, raiz do repositório (sem pasta `docs/` como fonte — os arquivos estáticos ficam
  na raiz do projeto).
- Link público: `https://phenriquemachado26.github.io/ssp.intranet/`.
- Deploy automático: todo push em `main` atualiza o site publicado (GitHub Pages reconstrói em
  até alguns minutos).
- Sem variáveis de ambiente, sem build step, sem CI — são arquivos estáticos servidos como estão.

## Por que não há banco de dados

O usuário optou explicitamente por um protótipo sem backend e sem banco de dados real, para
poder publicar no GitHub Pages e compartilhar um link de acompanhamento sem custo e sem
infraestrutura de servidor. Toda a persistência é simulada no navegador
(`assets/js/mock-backend.js` + `localStorage`) — ver `docs/ARQUITETURA.md` e `docs/Auth.md`.

## Se um dia precisar de backend real

Ver "Próxima arquitetura recomendada" em `docs/ARQUITETURA.md`. Opções de menor pegada de
recursos, já usadas em outros projetos do mesmo usuário: Neon Postgres (free tier, usado no
PortalCGI) ou Upstash Redis (KV). Qualquer uma delas mudaria a hospedagem de GitHub Pages para
Vercel (ou GitHub Pages para o frontend + função serverless à parte).

## GitHub Pages — build/deploy

- 11/11/2026: adicionado `.nojekyll` na raiz do repositório. O GitHub Pages processa o conteúdo via
  Jekyll por padrão quando esse arquivo não existe; como este é um protótipo 100% estático sem
  nenhuma dependência de Jekyll, o arquivo evita esse processamento desnecessário — builds mais
  rápidos e mais previsíveis. Adicionado após observar o site publicado travado em uma versão
  antiga (~7 commits atrás) por tempo bem além do esperado para um deploy normal.
- Se o site publicado ficar visivelmente desatualizado por mais de alguns minutos após um push,
  verificar em `Settings → Pages` (banner de erro) e em `Settings → Environments → github-pages`
  (histórico de deployments) no GitHub — não há como diagnosticar isso só por fora (curl), pois
  requer acesso autenticado ao painel do repositório.
