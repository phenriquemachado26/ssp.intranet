# Memória do projeto

Decisões técnicas, convenções e armadilhas não óbvias.

## Decisões

- **11/11/2026 — Protótipo estático, sem backend/banco.** Decisão explícita do usuário: publicar
  no GitHub Pages (`phenriquemachado26/ssp.intranet`), sem servidor nem banco de dados real.
  Motivo: é um protótipo para outras pessoas acompanharem via link, sem custo de infraestrutura.
  Toda a lógica de `app.py` (Python + SQLite) foi portada para `assets/js/mock-backend.js`,
  que intercepta `window.fetch('/api/...')` e persiste em `localStorage`, para que as páginas e
  scripts existentes (`main.js`, `admin.js`, `painel.js`, `avisos.js`) não precisassem ser
  reescritos — eles continuam chamando `fetch('/api/...')` normalmente.

## Armadilhas / pontos não óbvios

- **Resolução de banner é um manifesto estático**, não mais uma listagem de diretório: o antigo
  servidor lia `images_banner/` em tempo real; o mock usa a constante `BANNER_FILES` em
  `mock-backend.js`. Ao adicionar um novo arquivo de banner, é preciso incluir o nome nessa lista
  manualmente, senão o aviso correspondente nunca resolve o banner.
- **Sem persistência compartilhada**: cada navegador/aba tem sua própria cópia de
  `localStorage["sspIntranetDb"]`. Isso não é um bug — é a natureza da opção "estático puro"
  escolhida pelo usuário. Quem acompanha o link vê os dados de demonstração iniciais até mexer
  no próprio painel.
- **Autenticação sem valor de segurança real**: PBKDF2 client-side via `crypto.subtle` foi mantido
  por fidelidade ao desenho original, mas qualquer visitante pode inspecionar ou contornar via
  DevTools. Nunca usar senhas reais neste protótipo. Ver `docs/Auth.md`.
- **Dados de demonstração (`DEMO_ACCOUNTS`/`DEMO_ACCESS_REQUESTS`) usam reconciliação por
  `SEED_VERSION`, não resseed total**: navegadores que já tinham `localStorage` salvo de uma
  versão anterior do protótipo recebem automaticamente as contas/solicitações novas que ainda não
  existem (comparando por CPF), sem apagar nada que o visitante já tenha criado, editado ou
  excluído. Ao adicionar um novo item em `DEMO_ACCOUNTS`/`DEMO_ACCESS_REQUESTS` em
  `assets/js/mock-backend.js`, é obrigatório incrementar `SEED_VERSION` no mesmo arquivo —
  senão o item novo nunca chega a quem já visitou o site antes.
