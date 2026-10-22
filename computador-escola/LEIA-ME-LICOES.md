# Como criar uma lição

As lições ficam em `app/js/licoes/licoes.js`. Cada lição é uma lista de **passos**. O professor mostra e fala o
texto de cada passo e espera o aluno fazer a ação pedida. Quando o aluno faz, ele vai para o passo seguinte sozinho.

## Onde ficam

As aulas ficam em `app/js/licoes/`, um arquivo por grupo de módulos (ex.: `n1-mouse-teclado.js`).
Cada arquivo registra módulos com `CE.adicionarModulo`, e a ordem dos módulos e das aulas é a ordem do curso.
O aluno só abre uma aula quando foi **aprovado** na anterior. Aulas com perguntas precisam de **70%**:
acertar de primeira vale 1 ponto, na segunda tentativa vale meio ponto (na prova, só vale de primeira).
O instrutor tem todas as aulas liberadas.

## Exemplo

```js
(function () {
  const { info, quiz, esperar, abrir, fechar, naJanela } = CE.L;

  CE.adicionarModulo({
    id: 'n1-contas', nivel: 'n1', titulo: 'Fazendo contas', icone: '🧮',
    licoes: [
      {
        id: 'calculadora-soma', titulo: 'Somando com a Calculadora', icone: '🧮',
        descricao: 'Usar a calculadora para somar.',
        passos: [
          info('Vamos aprender a fazer contas no computador!', { emoji: '🧮' }),   // botão "Continuar"
          abrir('calculadora', 'Calculadora'),                                     // espera abrir o programa
          esperar('Faça a conta 10 + 5.', 'calculadora:resultado',
            (d) => d.a === 10 && d.b === 5 && d.operacao === '+',
            { destacar: naJanela('calculadora', '.calc-teclas'), mouse: 'esquerdo' }),
          quiz('Qual botão mostra o resultado?', ['+', '=', 'C'], 1, 'O = mostra o resultado.'),
          fechar('calculadora', 'Calculadora'),
        ],
        conclusao: 'Muito bem! Agora você sabe somar no computador.',
      },
    ],
  });
})();
```

Tipos de aula: normal; **desafio** (`desafio: true`), em que o professor não mostra seta, destaque, desenho do mouse nem dicas;
e **prova** (`prova: true`).

Atalhos (`CE.L`): `info`, `quiz`, `esperar`, `abrir`, `fechar`, `editorBotao`, `editorNovo`, `editorSalvar`,
`garantirArquivo` (cria um arquivo de exemplo) e `naJanela(app, seletor)`.

| Campo do passo | Para que serve |
|---|---|
| `texto` | O que o professor mostra e fala. |
| `espera` | O evento que conclui o passo (tabela abaixo). Sem ele, aparece o botão "Continuar". |
| `se` | Condição extra sobre os dados do evento. |
| `destacar` | O que vai piscar em vermelho na tela, com a seta vermelha apontando (seletor CSS). |
| `dica` | Aparece e é falada se o aluno ficar 40 segundos sem conseguir. |
| `mouse` | Mostra o desenho do mouse com o botão certo piscando: `'esquerdo'`, `'duplo'`, `'direito'`, `'arrastar'`, `'roda'` ou `'mover'`. |
| `jaFeito` | Função: se der verdadeiro ao chegar no passo, ele é pulado (ex.: o programa já está aberto). |
| `preparar` | Função que roda antes do passo (ex.: criar um arquivo de exemplo). |
| `emoji` | Uma figura grande no cartão do professor. |
| `quiz` | Pergunta de múltipla escolha (use o atalho `quiz(...)`). |

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
| `arquivo:salvo` | Salvou um arquivo | `nome`, `tipo` (`documento` ou `imagem`), `novo`, `conteudo` |
| `arquivo:aberto` | Abriu um arquivo no Editor | `nome`, `tipo` |
| `arquivo:selecionado` / `arquivo:renomeado` / `arquivo:removido` (foi para a lixeira) / `arquivo:restaurado` / `arquivo:apagado` | No programa Arquivos | `nome`, `tipo` |
| `pasta:aberta` / `lixeira:esvaziada` | Trocou de pasta / esvaziou a lixeira | `pasta` (`documentos` ou `lixeira`) |
| `janela:ativada` | Trouxe uma janela para a frente | `app` |
| `peca:clicada` / `computador:ligado` / `computador:desligado` | Conhecendo o Computador | `peca`, `tipo`, `total` |
| `jogo:iniciado` / `jogo:concluido` | Jogos do Mouse | `jogo` (`baloes`, `presentes`, `feira`, `caixas`, `tesouro`), `segundos` |
| `rolagem:fundo` | Chegou ao fundo do mar no jogo do tesouro | |
| `tecla:apertada` / `teclas:texto` | Treino do Teclado | `tecla` (ex.: `Enter`, `Backspace`, `CapsLock`, `ArrowLeft`, `" "`) / `texto` |
| `desenho:traco` / `desenho:forma` / `desenho:cor` / `desenho:ferramenta` / `desenho:balde` / `desenho:desfeito` / `desenho:limpo` | Desenho | `ferramenta`, `forma`, `cor` (ex.: `vermelho`) |
| `licao:concluida` / `licao:reprovada` / `medalha:ganha` | Curso | `licao`, `nota` / `medalha` |
| `calculadora:resultado` | Apertou "=" na Calculadora | `a`, `b`, `operacao` (`+ − × ÷`), `resultado` |
| `digitacao:iniciada` / `digitacao:concluida` | Exercício de digitação | `exercicio`, `ppm`, `precisao`, `estrelas`, `aprovado` |
| `professor:respondeu` | O professor respondeu uma pergunta | `pergunta` |

Os códigos dos programas (`app`) são: `aulas`, `editor`, `digitacao`, `arquivos`, `lixeira`, `calculadora`, `computador`, `jogos-mouse`, `teclas`, `desenho`, `instrutor`.

Os exercícios de digitação ficam em `app/js/digitacao/exercicios.js`.

## Ideias de lição para depois
Me mande as suas ideias de lição em texto simples, como "o aluno abre o editor, escreve uma carta para um amigo, coloca o
título em negrito e salva com o nome Carta", que eu transformo em lição.
