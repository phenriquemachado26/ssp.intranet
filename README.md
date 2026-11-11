# Intranet SSP

Protótipo de portal institucional e administrativo da Secretaria de Segurança Pública.

**Este é um protótipo 100% estático**, sem servidor e sem banco de dados real. Toda a
"administração" (login, cadastro de usuários, menu, avisos, perfis visuais, fila de validação)
roda inteiramente no navegador e é persistida em `localStorage` — não há dado compartilhado
entre visitantes, e a autenticação não tem nenhum valor de segurança real. Veja
`docs/Auth.md` para os detalhes e limitações desse modelo.

## Acompanhar o protótipo

Link público (GitHub Pages): `https://phenriquemachado26.github.io/ssp.intranet/`

A tela de login (`admin.html`) já vem com 4 contas de demonstração semeadas (2 Administradores
Master, 2 Administradores do Site). Clique no campo CPF para abrir a lista de contas cadastradas
— cada linha mostra um ícone (★ Master, ● Administrador do Site) e, ao selecionar uma, o CPF e a
senha são preenchidos automaticamente.

Se os dados de demonstração ficarem inconsistentes neste navegador, use o botão
**"Restaurar dados de demonstração"** na página `admin.html` (apaga o `localStorage` e recarrega).

## Executar localmente

Não é necessário Python nem qualquer backend. Basta um servidor estático qualquer na raiz do
projeto (abrir `index.html` direto no navegador também funciona, mas alguns navegadores
restringem `localStorage`/módulos em `file://`; um servidor local é mais confiável):

```powershell
# qualquer servidor estático serve; exemplos:
npx serve .
# ou, se preferir Python só como servidor de arquivos (sem a lógica antiga):
python -m http.server 8088
```

Acesse `http://localhost:8088` (ou a porta exibida pelo servidor escolhido).

## Estrutura

```text
/
├── index.html                 Página institucional
├── admin.html                 Login e solicitação de acesso
├── painel.html                Painel administrativo
├── avisos.html                Lista pública de avisos
├── images_banner/             Arquivos de banner cadastrados nos avisos
├── assets/
│   ├── css/styles.css         Design system e layouts responsivos
│   ├── images/logo-ssp.svg    Símbolo visual provisório
│   └── js/
│       ├── mock-backend.js    "Backend" client-side: intercepta fetch('/api/...'), persiste em localStorage
│       ├── main.js            Navegação pública
│       ├── admin.js           Login e solicitação de acesso
│       ├── painel.js          Gestão de usuários, perfis e permissões
│       └── theme.js           Aplicação do perfil visual ativo
└── docs/
    ├── DESIGN-SYSTEM.md        Paleta, tipografia e componentes
    ├── REGRAS-DE-NEGOCIO.md    Perfis e fluxos do sistema
    ├── ARQUITETURA.md          Organização e decisões técnicas
    ├── Infraestrutura.md       Hospedagem (GitHub Pages)
    ├── API.md                  Contrato do mock de API
    ├── Auth.md                 Modelo de sessão client-side e suas limitações
    ├── Organograma.md          Diagrama dos módulos do protótipo
    ├── Progresso.md            Histórico de tarefas concluídas
    └── Memoria.md               Decisões e aprendizados não óbvios
```

## Documentação

Toda mudança visual deve atualizar `docs/DESIGN-SYSTEM.md`. Toda nova funcionalidade, perfil ou
condição de acesso deve atualizar `docs/REGRAS-DE-NEGOCIO.md`. Decisões de estrutura e
integrações devem ser registradas em `docs/ARQUITETURA.md`. Novos arquivos de banner adicionados
a `images_banner/` precisam ser incluídos manualmente no manifesto `BANNER_FILES` em
`assets/js/mock-backend.js` (não há mais listagem dinâmica de diretório, pois não existe servidor).
