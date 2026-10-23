# Como criar uma lição

Cada lição é uma lista de **passos**. O professor mostra e fala o
texto de cada passo e espera o aluno fazer a ação pedida. Quando o aluno faz, ele vai para o passo seguinte sozinho.

## Onde ficam

As aulas ficam em `app/js/licoes/`, um arquivo por grupo de módulos (ex.: `n1-mouse-teclado.js`).
Cada arquivo registra módulos com `CE.adicionarModulo`, e a ordem dos módulos e das aulas é a ordem do curso.
O aluno só abre uma aula quando foi **aprovado** na anterior. Aulas com perguntas precisam de **70%**:
acertar de primeira vale 1 ponto, na segunda tentativa vale meio ponto (na prova, só vale de primeira).
O instrutor tem todas as aulas liberadas.

**Trilha essencial.** A lista `REFORCO`, em `app/js/curso.js`, diz quais aulas são de reforço (opcionais na trilha
essencial, que é o padrão). Aula nova entra como essencial; para virar reforço, ponha o id dela nessa lista. Não ponha
lá a prova, nem aula que ensina algo que a prova cobra, nem a única aula essencial de um módulo. Na trilha essencial,
uma aula só espera a aula **essencial** anterior, e as aulas de reforço abrem junto com a essencial seguinte.

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
| `dica` | Aparece e é falada se o aluno ficar 40 segundos sem conseguir. O botão "🙋 Não entendi" mostra a dica na hora (sem `dica`, aparece uma ajuda geral). |
| `mouse` | Mostra o desenho do mouse com o botão certo piscando: `'esquerdo'`, `'duplo'`, `'direito'`, `'arrastar'`, `'roda'` ou `'mover'`. |
| `jaFeito` | Função: se der verdadeiro ao chegar no passo, ele é pulado (ex.: o programa já está aberto). |
| `preparar` | Função que roda antes do passo (ex.: criar um arquivo de exemplo). |
| `emoji` | Uma figura grande no cartão do professor. |
| `quiz` | Pergunta de múltipla escolha (use o atalho `quiz(...)`). |

`espera` também aceita uma lista de eventos, como `['golpe:evitado', 'golpe:caiu']`: vale o primeiro que acontecer.

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
| `menu-contexto:aberto` | Abriu um menu do botão direito | `onde`, `alvo` (veja a lista abaixo) |
| `menu-contexto:opcao` | Escolheu uma opção no menu do botão direito | `onde`, `opcao` (o `data-opcao` do item), `alvo` |
| `area:icones` / `area:atualizada` / `area:mostrada` | Área de trabalho: Exibir › tamanho dos ícones / Atualizar / Mostrar a área de trabalho | `tamanho` (`grandes`, `medios`, `pequenos`) |
| `propriedades:abertas` | Abriu "Propriedades" pelo botão direito | `nome`, `de` (`arquivo`, `pasta` ou `programa`) |
| `fundo:trocado` | Mudou o fundo de tela | `fundo` |
| `editor:texto` | Escreveu no Editor de Texto | `texto`, `html` |
| `editor:selecao` | Selecionou texto no Editor | `selecionado` |
| `editor:formatado` | Usou um botão de formatação | `comando` (`bold`, `italic`, `underline`, `fontSize`, `fontName`, `foreColor`, `justifyCenter`...), `valor`, `ativo`, `selecionado`, `html` |
| `editor:novo` | Clicou em "Novo" ou escolheu um modelo | `modelo` (`branco`, `carta`, `curriculo`, `requerimento`, `recibo`) |
| `editor:ortografia` | Corretor ortográfico (corrige pelo botão direito na palavra sublinhada) | `acao` (`verificar`, `corrigir` ou `ignorar`), `encontrados`, `restantes` |
| `editor:fonte` / `editor:paragrafo` | Botão direito › Fonte... / Parágrafo... | `fonte`, `tamanho` (`'1'` a `'7'`; `'5'` = 18), `bold`, `italic`, `underline`, `cor` / `alinhamento`, `espacamento`, `recuo` |
| `texto:copiado` / `texto:recortado` / `texto:colado` | Copiar, Recortar ou Colar pelo menu do botão direito | `pelo` (`menu`) |
| `editor:impresso` | Imprimiu (impressora de treino) | `copias` |
| `arquivo:salvo` | Salvou um arquivo | `nome`, `tipo` (`documento`, `imagem` ou `planilha`), `novo`, `conteudo` |
| `arquivo:aberto` | Abriu um arquivo no Editor | `nome`, `tipo` |
| `arquivo:selecionado` / `arquivo:renomeado` / `arquivo:removido` (foi para a lixeira) / `arquivo:restaurado` / `arquivo:apagado` | No programa Arquivos | `nome`, `tipo` |
| `pasta:aberta` / `lixeira:esvaziada` | Trocou de pasta / esvaziou a lixeira | `pasta`, `local` (`pc` ou `pendrive`), `caminho` |
| `pasta:criada` / `arquivo:movido` / `arquivo:copiado` / `arquivo:colado` / `arquivo:arrastado` | Pastas no Arquivos | `nome`, `destino`, `destinoLocal`, `modo` |
| `arquivo:novo` / `arquivo:enviado` / `arquivos:classificados` | Botão direito › Novo › Documento ou Planilha / Enviar para › Pen drive / Classificar por | `nome`, `tipo` / `para` (`pendrive`) / `por` (`nome`, `data`, `tipo`) |
| `arquivo:baixado` | Baixou um arquivo da internet (vai para Downloads) | `nome`, `origem` |
| `arquivos:pesquisa` | Pesquisou no Arquivos | `termo` |
| `pendrive:conectado` / `pendrive:removido` | Pen drive simulado | |
| `atalho:usado` | Usou um atalho de teclado | `atalho` (ex.: `Ctrl+C`, `F2`, `Delete`), `app` |
| `planilha:editada` | Escreveu numa célula | `celula`, `entrada`, `valor`, `formula`, `texto` |
| `planilha:formatada` / `planilha:autosoma` / `planilha:preenchida` / `planilha:largura` | Formatação, AutoSoma, alça e largura da coluna | `comando`, `intervalo`, `celulas`, `coluna` |
| `email:conta-criada` / `email:aberto` / `email:enviado` / `email:respondido` / `email:encaminhado` / `email:recebido` / `email:spam` / `email:anexo-baixado` | E-mail | `para`, `assunto`, `anexos`, `nomesAnexos`, `de` |
| `banco:login` / `banco:saldo` / `banco:pix` / `banco:pix-cancelado` / `banco:boleto` / `banco:sair` | Banco Escola | `valor`, `chave`, `nome` |
| `servico:agendado` / `servico:segunda-via` | Cidadão Digital | `especialidade`, `matricula` |
| `navegador:download` | Baixou um arquivo num site | `site`, `nome` |
| `editor:formatado` (avançado) | Estilo, colunas, quebra de página, sumário | `comando` (`estilo`, `colunas`, `quebraPagina`, `sumario`), `valor` (`h1`, `h2`, `abnt`... / nº de colunas), `antesDe` |
| `editor:cabecalho` / `editor:sumario` / `editor:pdf` | Cabeçalho e rodapé / sumário / PDF | `cabecalho`, `rodape`, `numerar` / `itens`, `acao` (`inserir` ou `atualizar`) / `nome`, `paginas` |
| `editor:localizado` / `editor:substituido` / `editor:localizar-fechado` | Localizar e substituir | `termo`, `quantidade` / `procurar`, `trocar`, `quantidade` |
| `pdf:zoom` / `pdf:impresso` | Leitor de PDF | `zoom` / `nome` |
| `planilha:classificada` / `planilha:filtro` / `planilha:menu-filtro` / `planilha:filtrada` | Classificar e filtro | `coluna`, `ordem` (`az`, `za`) / `ligado` / `coluna`, `mostrando`, `escondidos`, `visiveis` |
| `planilha:grafico` / `planilha:grafico-tipo` / `planilha:grafico-movido` / `planilha:condicional` | Gráficos e destaque automático | `tipo`, `intervalo`, `series`, `nomesSeries` / `regra`, `valor`, `cor` |
| `apresentacao:nova` / `apresentacao:slide-novo` / `apresentacao:texto` / `apresentacao:imagem` / `apresentacao:grafico` | Apresentações | `layout`, `total` / `slide`, `campo` (`titulo`, `texto`), `texto` / `planilha` |
| `apresentacao:tema` / `apresentacao:transicao` / `apresentacao:slide-movido` / `apresentacao:notas` | Temas e organização | `tema` / `transicao` / `de`, `para` / `texto` |
| `apresentacao:iniciada` / `apresentacao:slide` / `apresentacao:fim` | Modo Apresentar | `total` / `numero` / `vistos`, `completa` |
| `config:secao` / `config:fundo` / `config:zoom` / `config:cursor` / `config:fuso` / `config:volume` / `config:som-testado` | Configurações | `secao` / `fundo` / `zoom` / `grande` / `fuso` / `volume` |
| `config:instalado` / `config:desinstalado` / `config:bloqueado` / `config:verificacao` / `config:ameaca-removida` / `config:antivirus-atualizado` | Programas e antivírus | `app`, `confiavel` / `ameacas` |
| `config:atualizacoes` / `config:reiniciado` / `config:impressora` / `config:backup` | Atualizações, impressoras, backup | `acao` / `acao` (`adicionada`, `padrao`, `teste`) e `nome` / `pasta`, `arquivos` |
| `arquivo:compactado` / `arquivo:zip-aberto` / `arquivo:extraido` | ZIP no Arquivos | `nome`, `origem`, `arquivos` |
| `seguranca:senha` / `seguranca:2etapas` / `seguranca:login-2etapas` / `seguranca:quiz-golpe` / `seguranca:privacidade` / `seguranca:boato` | Escudo Digital | `forca` (`fraca`, `media`, `forte`) / `acertos`, `total` / `seguro` |
| `vagas:filtro` / `vagas:vaga` / `vagas:candidatura` | Emprega Já | `cidade`, `resultados` / `vaga`, `golpe` / `vaga`, `curriculo` |
| `reuniao:camera` / `reuniao:microfone` / `reuniao:mao` / `reuniao:entrou` / `reuniao:chat` / `reuniao:saiu` | Sala de Reunião | `ligado` / `camera`, `microfone` / `texto` |
| `jogo:memoria` / `cronometro:iniciado` / `notas:texto` | Programas instaláveis | `jogadas` |
| `janela:ativada` | Trouxe uma janela para a frente | `app` |
| `peca:clicada` / `computador:ligado` / `computador:desligado` | Conhecendo o Computador | `peca`, `tipo`, `total` |
| `jogo:iniciado` / `jogo:concluido` / `jogo:perdido` | Jogos do Mouse | `jogo` (`baloes`, `presentes`, `feira`, `caixas`, `tesouro`, `pontaria`, `labirinto`), `nivel` (`facil`, `medio`, `dificil`), `segundos`, `motivo`; na Pontaria, `precisao` (média, em %) |
| `jogo:precisao` | Pontaria: acertou um alvo (100% no miolo, diminuindo até a borda) | `jogo`, `precisao` |
| `rolagem:fundo` | Chegou ao fundo do mar no jogo do tesouro | |
| `tecla:apertada` / `teclas:texto` | Treino do Teclado | `tecla` (ex.: `Enter`, `Backspace`, `CapsLock`, `ArrowLeft`, `" "`) / `texto` |
| `desenho:traco` / `desenho:forma` / `desenho:cor` / `desenho:cor2` / `desenho:ferramenta` / `desenho:balde` / `desenho:desfeito` / `desenho:limpo` | Desenho (como no Paint: botão esquerdo pinta com a Cor 1, botão direito com a Cor 2; botão direito na paleta escolhe a Cor 2) | `ferramenta`, `forma`, `cor` (ex.: `vermelho`), `botao` (`esquerdo` ou `direito`) |
| `licao:concluida` / `licao:reprovada` / `medalha:ganha` | Curso | `licao`, `nota` / `medalha` |
| `licao:nao-entendi` | Apertou "🙋 Não entendi" num passo | `licao`, `passo` (começa em 1) |
| `impressao:aberta` | Abriu a prévia de impressão (certificado ou relatório) | `titulo`, `paginas` |
| `instrutor:liberou` / `instrutor:relatorio` / `instrutor:certificados` | Painel do Instrutor | `alunos`, `itens` / `turma`, `periodo` / `quantos` |
| `instrutor:trilha` | Painel do Instrutor (trilha da escola) | `trilha` (`essencial` ou `completa`) |
| `calculadora:resultado` | Apertou "=" na Calculadora | `a`, `b`, `operacao` (`+ − × ÷`), `resultado` |
| `digitacao:iniciada` / `digitacao:concluida` | Exercício de digitação | `exercicio`, `ppm`, `precisao`, `estrelas`, `aprovado` |
| `professor:respondeu` | O professor respondeu uma pergunta | `pergunta` |
| `navegador:visitou` | Abriu uma página no Navegador | `url`, `dominio`, `caminho`, `titulo`, `seguro`, `existe` |
| `navegador:pesquisa` | Pesquisou no Procura ou na barra de endereço | `termo`, `onde` (`procura` ou `barra`) |
| `navegador:voltou` / `navegador:avancou` / `navegador:recarregou` / `navegador:inicio` | Botões da barra do Navegador | `url` |
| `navegador:aba-nova` / `navegador:aba-trocada` / `navegador:aba-fechada` | Abas | `url` |
| `navegador:favorito` / `navegador:rolou-fim` / `navegador:link` | Favoritou / chegou ao fim da página / clicou num link (ou botão direito › Abrir link em uma nova aba) | `url`, `dominio`, `caminho`, `novaAba` |
| `loja:carrinho` / `loja:compra` | Loja Compra Certa | `produto`, `itens` / `total`, `pagamento` |
| `golpe:caiu` / `golpe:evitado` | Clicou na armadilha de um site falso / saiu dele sem cair | `site` |
| `nivelamento:concluido` / `digitacao:nivelamento` | Testes de nivelamento | `nota`, `pulados`, `dispensa` / `ppm`, `precisao`, `niveis` |

**Botão direito (`onde` do `menu-contexto:aberto`)**: `area-de-trabalho`, `icone`, `menu-iniciar`, `botao-iniciar`,
`barra-tarefas`, `barra-titulo`, `arquivos` (num arquivo ou pasta), `arquivos-vazio`, `arquivos-lateral`, `lixeira`, `editor`,
`planilha`, `planilha-linha`, `planilha-coluna`, `navegador-link`, `navegador-texto`, `navegador-pagina`, `email` e `texto`
(qualquer campo de escrever). Para a seta apontar para uma opção do menu quando ele estiver aberto, use uma lista no
`destacar`: `['.mc-menu [data-opcao="recortar"]', naJanela('arquivos', '[data-arquivo="Receita"]')]` — a seta vai para a
opção se o menu estiver aberto e, se não, para o arquivo. Os `data-opcao` aparecem nos menus (ex.: `abrir`, `copiar`,
`colar`, `colar-na-pasta`, `renomear`, `excluir`, `propriedades`, `novo` › `nova-pasta`, `enviar-para` › `enviar-pendrive`,
`exibir` › `icones-grandes`, `personalizar`, `maximizar`, `restaurar`, `fechar-janela`, `sugestao`, `fonte`, `inserir`,
`inserir-linha`, `nova-aba`).

Os códigos dos programas (`app`) são: `aulas`, `editor`, `planilha`, `apresentacoes`, `configuracoes`, `leitor-pdf`, `bloco-notas`, `cronometro`, `jogo-memoria`, `email`, `digitacao`, `arquivos`, `lixeira`, `calculadora`, `computador`, `jogos-mouse`, `teclas`, `desenho`, `navegador`, `instrutor`.

## Atalhos para escrever aulas (`CE.L`, em `ajudantes.js`)
- `info(texto)`, `quiz(pergunta, opcoes, certa)`, `esperar(texto, evento, condicao, extras)`, `abrir(app, nome)`, `fechar(app)`
- `editorBotao(comando, texto)`, `editorNovo(modelo, nome)`, `editorSalvar(nome)`
- `garantirArquivo(nome, conteudo, tipo)` e `abrirExemplo(nome, tipo, conteudo)`: deixam um arquivo pronto para a aula
- `pularSe(teste)`: pula o passo se o aluno já fez
- `planilhaDe(linhas)`, `celula('B2')`, `entrada('B2')`, `perto(a, b)`: para aulas de planilha
- `naJanela(app, seletor)`: monta o seletor de algo dentro de uma janela

Dica: um passo que confere o resultado (e não uma ação) pode ter `jaFeito` com o mesmo teste. Assim, se o aluno já
fez a tarefa antes de o passo aparecer, o passo é pulado. Ações feitas durante a troca de passo também contam.

Os sites de treino do Navegador ficam em `app/js/navegador/sites.js`.

Os exercícios de digitação ficam em `app/js/digitacao/exercicios.js`.

## Aulas sem programar
O instrutor também pode criar aulas pelo **Painel do Instrutor → 📝 Criar aulas**, sem mexer em código. Elas ficam
guardadas no computador do instrutor (`aulas-professor.json`) e aparecem em **Aulas → 📌 Do professor**. As tarefas
disponíveis estão em `app/js/licoes/aulas-professor.js` (`TAREFAS`): para acrescentar uma tarefa nova, basta incluir
um item com `nome`, `campo` (o que o instrutor preenche) e `montar` (que devolve um passo, como nos exemplos acima).

Eventos da sala de aula: `sala:pausada` (`pausada`), `sala:mensagem` (`texto`), `instrutor:pausou`, `instrutor:mensagem`,
`instrutor:aula-salva` e `sessao:perdida` (`motivo`: a conta foi aberta em outro computador ou removida).

Programas com relógios ou ouvintes devem desligá-los em `aoFechar(opcoes)`: ao sair do sistema, todas as janelas
fecham com `opcoes.forcado = true` (sem perguntar "Quer salvar?"), e nada deve continuar rodando para o próximo aluno.

## Ideias de lição para depois
Me mande as suas ideias de lição em texto simples, como "o aluno abre o editor, escreve uma carta para um amigo, coloca o
título em negrito e salva com o nome Carta", que eu transformo em lição.
