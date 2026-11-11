# Design System — Intranet SSP

Atualizado em: 01/07/2026.

## Direção visual

Visual institucional, sóbrio e contemporâneo. Azul representa segurança e confiança; dourado marca autoridade e destaques. Fundos claros reduzem o peso visual nas áreas de trabalho.

## Paleta de cores

| Token | Hex | Uso |
|---|---:|---|
| `--navy` | `#0B2D48` | Cabeçalho, menu lateral e fundos institucionais |
| `--blue` | `#123F62` | Marca e elementos principais |
| `--blue-2` | `#19577F` | Botões e ações |
| `--gold` | `#D7A62A` | Destaques, detalhes e chamadas |
| `--gold-light` | `#F5E4AE` | Variação clara do dourado |
| `--ink` | `#172635` | Texto principal |
| `--muted` | `#637384` | Texto secundário |
| `--paper` | `#F5F7F8` | Fundo geral |
| `--white` | `#FFFFFF` | Cartões e superfícies |
| `--line` | `#DCE3E8` | Bordas e divisores |
| `--success` | `#19734A` | Sucesso e status ativo |
| `--danger` | `#B42318` | Erros e ações destrutivas |

## Tipografia

- Títulos: Source Serif 4, alternativa Georgia.
- Interface e corpo: Inter, alternativa Arial.
- As fontes utilizam a pilha local do dispositivo, sem dependência de serviços externos.

## Componentes e medidas

- Cabeçalho público fixo: `80px` no desktop e `70px` no celular.
- Raio padrão de cartões: `14px`.
- Botões: altura mínima de `44px`, raio de `8px`.
- Sombra principal: `0 18px 50px rgba(11,45,72,.12)`.
- Breakpoints: `950px` para menu compacto e `620px` para layout móvel.
- Cartões de perfil exibem miniatura do cabeçalho, cores e flag `Em uso`.
- Confirmações usam modal com ações explícitas “Sim” e “Não”; retornos usam modal informativo.
- Cabeçalho, rodapé, ícones de acesso, banner e tela de login usam os tokens do perfil ativo.
- A cor do texto sobre cada cor configurável é calculada automaticamente para manter contraste quando o administrador escolher tons claros.
- Botões sólidos, botões de contorno, links, ícones e estados `hover` usam variações calculadas da paleta. Quando uma cor configurada não contrasta com o fundo, a interface seleciona automaticamente preto institucional ou branco.
- Botões sólidos em superfícies claras usam uma cor de borda calculada independentemente do fundo; assim, botões brancos continuam delimitados e visíveis.
- Banners usam a proporção natural de cada arquivo, largura responsiva e altura automática, evitando cortes; o detalhe inferior acompanha a paleta ativa.
- O cadastro recomenda banners de `1650 × 555 px`, orientação exibida no placeholder, texto auxiliar e ícone informativo.
- O menu público exibe no máximo cinco cards por linha; cards usam altura mínima de `240px`, áreas consistentes para título e descrição e ação alinhada à base.

## Marca

`assets/images/logo-ssp.svg` é um símbolo provisório criado para esta versão, usado pela Paleta Padrão. Deve ser substituído pelo arquivo oficial da Secretaria quando disponibilizado, preservando texto alternativo e proporções.

Nos demais perfis visuais (Cabeçalho e Rodapé), a logomarca é enviada por upload (PNG, JPG, SVG, WebP ou AVIF, até 300 KB) em vez de referenciar um arquivo estático; fica salva como imagem embutida no navegador de quem a cadastrou. O campo de upload é uma área de arrastar-e-soltar (ícone + "Clique para enviar" / "ou arraste a imagem aqui"); com uma imagem selecionada, a área exibe a pré-visualização e um link "Remover logomarca" para limpar a seleção. O banner de avisos (Cadastro de Avisos) usa o mesmo componente de dropzone, com limite de 800 KB e formatos PNG/JPG/WebP/GIF/SVG/AVIF.

## Acessibilidade

- Elementos interativos usam HTML semântico.
- Campos possuem rótulos associados.
- Mensagens importantes usam `role="alert"` ou `role="status"`.
- Menu móvel informa seu estado por `aria-expanded`.
- Contraste de texto e ações foi definido para fundos claros e escuros.
