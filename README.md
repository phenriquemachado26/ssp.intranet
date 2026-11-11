# Intranet SSP

Portal institucional e administrativo da Secretaria de Segurança Pública.

## Executar localmente

### Um clique no Windows

Dê duplo clique em `ABRIR_INTRANET.cmd`. O lançador verifica ou inicia o servidor, aguarda a aplicação responder e abre o navegador padrão. Erros ficam registrados em `logs/server-error.log`.

### Execução manual

É necessário Python 3. Execute na raiz do projeto:

```powershell
python app.py
```

Acesse `http://127.0.0.1:8088`. O banco `data/intranet.db` é criado automaticamente na primeira execução.

Credenciais de demonstração do Administrador Master:

- CPF: `000.000.000-00`
- Senha: `Master@123`

As senhas são armazenadas somente como hash PBKDF2-SHA256 no SQLite. As sessões usam cookies `HttpOnly` e expiram após oito horas. Para publicação externa, adicione HTTPS, proteção contra tentativas repetidas e uma chave/armazenamento persistente de sessões.

## Estrutura

```text
/
├── index.html                 Página institucional
├── admin.html                 Login e solicitação de acesso
├── painel.html                Painel administrativo
├── app.py                     Servidor HTTP, API e autenticação
├── data/intranet.db           Banco SQLite
├── images_banner/             Arquivos de banner cadastrados nos avisos
├── assets/
│   ├── css/styles.css         Design system e layouts responsivos
│   ├── images/logo-ssp.svg    Símbolo visual provisório
│   └── js/
│       ├── main.js            Navegação pública
│       ├── admin.js           Login e solicitação de acesso
│       ├── painel.js          Gestão de usuários, perfis e permissões
│       └── theme.js           Aplicação do perfil visual ativo
└── docs/
    ├── DESIGN-SYSTEM.md       Paleta, tipografia e componentes
    ├── REGRAS-DE-NEGOCIO.md   Perfis e fluxos do sistema
    └── ARQUITETURA.md         Organização e decisões técnicas
```

## Documentação

Toda mudança visual deve atualizar `docs/DESIGN-SYSTEM.md`. Toda nova funcionalidade, perfil ou condição de acesso deve atualizar `docs/REGRAS-DE-NEGOCIO.md`. Decisões de estrutura e integrações devem ser registradas em `docs/ARQUITETURA.md`.
