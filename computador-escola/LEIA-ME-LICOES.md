# Como criar uma lição

As lições ficam em `app/js/licoes/licoes.js`. Cada lição é uma lista de **passos**. O professor mostra e fala o
texto de cada passo e espera o aluno fazer a ação pedida. Quando o aluno faz, ele vai para o passo seguinte sozinho.

## Exemplo

```js
{
  id: 'calculadora-soma',          // nome único, sem espaços
  modulo: 'Primeiros passos',      // agrupa as lições na tela "Aulas"
  titulo: 'Fazendo contas',
  icone: '🧮',
  descricao: 'Usar a calculadora para somar.',
  passos: [
    // Passo sem "espera": aparece o botão "Continuar"
    { texto: 'Vamos aprender a fazer contas no computador! Clique em "Continuar".' },

    // Passo que espera o aluno abrir a Calculadora
    {
      texto: 'Dê um clique duplo no ícone da Calculadora.',
      espera: 'app:aberto',
      se: (d) => d.app === 'calculadora',
      destacar: '.icone[data-icone="calculadora"]',
      dica: 'São dois cliques bem rápidos!',
    },

    // Passo que confere o resultado da conta
    {
      texto: 'Agora faça a conta 10 + 5.',
      espera: 'calculadora:resultado',
      se: (d) => d.a === 10 && d.b === 5 && d.operacao === '+',
    },
  ],
  conclusao: 'Muito bem! Agora você sabe somar no computador.',
},
```

| Campo do passo | Para que serve |
|---|---|
| `texto` | O que o professor mostra e fala. |
| `espera` | O evento que conclui o passo (tabela abaixo). Sem ele, aparece o botão "Continuar". |
| `se` | Condição extra sobre os dados do evento. |
| `destacar` | O que vai piscar em amarelo na tela (seletor CSS). |
| `dica` | Aparece e é falada se o aluno ficar 40 segundos sem conseguir. |
| `jaFeito` | Função: se der verdadeiro ao chegar no passo, ele é pulado (ex.: o programa já está aberto). |
| `preparar` | Função que roda antes do passo (ex.: criar um arquivo de exemplo). |

Os atalhos `passoAbrir('editor', 'Editor de Texto')` e `passoFechar('editor', 'Editor de Texto')`, no começo do arquivo,
criam os passos de abrir e fechar programas.

## Eventos disponíveis

| Evento | Quando acontece | Dados (`d`) |
|---|---|---|
| `icone:selecionado` | Um clique num ícone da área de trabalho | `app` |
| `app:aberto` | Um programa abriu | `app` |
| `janela:fechada` | Uma janela fechou | `app` |
| `janela:minimizada` / `janela:restaurada` | Minimizou / voltou pela barra de tarefas | `app` |
| `janela:maximizada` / `janela:normal` | Maximizou / voltou ao tamanho normal | `app` |
| `janela:movida` | Arrastou a janela | `app`, `distancia` |
| `menu-iniciar:aberto` | Abriu o menu Iniciar | |
| `menu-contexto:aberto` | Clicou com o botão direito na área de trabalho | |
| `fundo:trocado` | Mudou o fundo de tela | `fundo` |
| `editor:texto` | Escreveu no Editor de Texto | `texto`, `html` |
| `editor:selecao` | Selecionou texto no Editor | `selecionado` |
| `editor:formatado` | Usou um botão de formatação | `comando` (`bold`, `italic`, `underline`, `fontSize`, `fontName`, `foreColor`, `justifyCenter`...), `valor`, `ativo`, `selecionado`, `html` |
| `editor:novo` | Clicou em "Novo" | |
| `arquivo:salvo` | Salvou um arquivo | `nome`, `tipo`, `novo` |
| `arquivo:aberto` | Abriu um arquivo no Editor | `nome`, `tipo` |
| `arquivo:selecionado` / `arquivo:renomeado` / `arquivo:removido` | No programa Arquivos | `nome`, `tipo` |
| `calculadora:resultado` | Apertou "=" na Calculadora | `a`, `b`, `operacao` (`+ − × ÷`), `resultado` |
| `digitacao:iniciada` / `digitacao:concluida` | Exercício de digitação | `exercicio`, `ppm`, `precisao`, `estrelas` |
| `professor:respondeu` | O professor respondeu uma pergunta | `pergunta` |

Os códigos dos programas (`app`) são: `aulas`, `editor`, `digitacao`, `arquivos`, `calculadora`, `instrutor`.

## Ideias de lição para depois
Me mande as suas ideias de lição em texto simples, como "o aluno abre o editor, escreve uma carta para um amigo, coloca o
título em negrito e salva com o nome Carta", que eu transformo em lição.
