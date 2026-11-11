# Organograma (fluxo de módulos)

Atualizado em: 11/11/2026.

Protótipo estático: não há mais camada de servidor/banco de dados. O "backend" é simulado dentro
do próprio navegador.

```mermaid
flowchart TD
    Visitante((Visitante / Administrador))

    subgraph Navegador [Navegador do visitante]
        Paginas[Páginas HTML\nindex · admin · painel · avisos]
        Mock[assets/js/mock-backend.js\nintercepta fetch('/api/...')]
        LS[(localStorage\nusuários · perfis · menu · avisos · fila)]
        Paginas -- fetch('/api/...') --> Mock
        Mock -- lê/grava --> LS
        Mock -- Response simulada --> Paginas
    end

    Visitante --> Paginas
    GH[GitHub Pages\nhospedagem estática] --> Paginas
```

## Leitura do diagrama

- Não existe comunicação de rede para `/api/*`: é uma interceptação local de `fetch`.
- `localStorage` não é compartilhado entre visitantes — cada navegador tem sua própria cópia.
- O GitHub Pages serve apenas arquivos estáticos (HTML/CSS/JS/imagens); não executa nenhuma
  lógica de servidor.
