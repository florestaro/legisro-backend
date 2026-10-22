# Computador Escola

Um "computador dentro do computador" para aulas de informática. O aluno entra com o próprio nome e senha e encontra uma
área de trabalho parecida com a do Windows, com programas de treino e um **Professor Virtual** que ensina passo a passo,
conversa e tira dúvidas. **Funciona sem internet.**

## O que já tem

### Curso de Informática: 3 níveis (um por semestre)
- **Nível Iniciante completo: 45 aulas em 10 módulos.** Os módulos são: Conhecendo o computador, Mouse, Teclado,
  Janelas e menu Iniciar, Arquivos e pastas, Editor de Texto, Calculadora e Desenho, **Internet**, Segurança básica e a
  Prova do nível.
- **Teste de nivelamento** no primeiro acesso do aluno: com 80% e sem pular tarefas, as aulas do Iniciante ficam
  dispensadas (continuam abertas para revisão).
- Cada aula tem explicação, prática guiada (com a seta vermelha e o desenho do mouse) e perguntas. Cada módulo termina
  num **desafio sem ajuda**, e o nível termina numa **prova**.
- **Nível Intermediário completo: 40 aulas em 8 módulos.** Os módulos são: Pastas e organização (com pen drive),
  Atalhos de teclado, Editor de Texto (carta, currículo, requerimento, tabela, imagem, corretor, imprimir),
  **Planilha** (fórmulas, SOMA, alça de preenchimento, notas, orçamento da casa), Internet segura e downloads,
  **E-mail**, **Serviços pela internet** (banco, Pix, boleto, agendamento) e a Prova do nível.
- **O aluno só avança quando é aprovado** (70% nas perguntas). O instrutor tem tudo liberado.
- O nível Avançado aparece como "em breve", com o conteúdo planejado.

### Curso de Digitação: 108 exercícios em 3 níveis
- **Iniciante** (39): fileiras do meio, de cima e de baixo, Shift, acentos e cedilha, palavras e frases.
- **Intermediário** (35): números, pontuação, frases, textos curtos, ritmo e trava-línguas.
- **Avançado** (31): símbolos, dados do dia a dia (e-mail, telefone, CEP), teclado numérico, textos de Machado de Assis,
  Gonçalves Dias e Olavo Bilac, **ditado** (o professor fala e o aluno digita) e testes de velocidade.
- **Cada exercício tem meta de velocidade (ppm) e de acertos (%)**, e o próximo só libera quando bate as duas.
- **Provas cronometradas**: Iniciante (3 min, 20 ppm, 92%), Intermediário (5 min, 35 ppm, 95%) e Avançado
  (5 min, 45 ppm, 97%). Crianças têm metas menores.
- O teclado ABNT2 aparece na tela, com uma cor por dedo e a dica de como fazer acentos e símbolos.
- **Teste de nivelamento de digitação** (1 minuto): dispensa os níveis em que o aluno já bate a meta da prova.
- **Jogos e treinos**: Chuva de palavras, Treino das teclas difíceis (feito com as teclas em que o aluno mais erra)
  e o gráfico de evolução.

### Programas do computador simulado
**Editor de Texto** (modelos de carta, currículo, requerimento e recibo; tabela, imagem, margens, espaçamento,
corretor ortográfico e impressão de treino), **Planilha** (tipo Excel, com fórmulas em português como SOMA, MÉDIA, SE
e CONT.SE, formatação de moeda e porcentagem e alça de preenchimento), **E-mail** (Correio: cada aluno cria o próprio
endereço `@correio.escola` e manda mensagens com anexo para os colegas e para contatos de treino que respondem),
Digitação, **Arquivos** (pastas e subpastas, copiar/recortar/colar, arrastar, pesquisar e **pen drive** simulado),
**Lixeira**, Calculadora, **Conhecendo o Computador** (desenho interativo das
peças), **Jogos do Mouse** (balões, presentes, feira, caixas secretas e caça ao tesouro), **Treino do Teclado**,
**Desenho** (parecido com o Paint), **Navegador** (abas, favoritos, voltar/avançar e barra de endereço com cadeado),
Aulas e Painel do Instrutor.

### Internet de treino (offline)
O Navegador tem sites inventados que funcionam sem internet: o buscador **Procura**, a enciclopédia **Saber Livre**,
as receitas do **Cozinha Fácil**, o **Jornal do Bairro** (com anúncios enganosos), a loja segura **Compra Certa**
(carrinho e compra de treino), o **Banco Escola** (conta de treino com saldo, extrato, Pix e boleto),
o **Cidadão Digital** (agendar atendimento e tirar 2ª via da conta de água) e sites de **golpe** (loja falsa,
prêmio falso e banco falso), que mostram uma página explicando os sinais de golpe quando o aluno cai na armadilha.
Os arquivos baixados vão para a pasta **Downloads**.

### Outros
- **28 medalhas** e confetes quando o aluno conclui uma aula ou passa numa prova.
- **Painel do Instrutor**: cadastro (com a opção "criança"), aula atual de cada aluno, média, exercício de digitação
  atual, melhor velocidade, provas e medalhas.

Para criar novas lições, veja [LEIA-ME-LICOES.md](LEIA-ME-LICOES.md).

## Professor Virtual com IA (opcional)

Sem modelo de IA, o professor usa **respostas prontas** e as lições funcionam normalmente.
Com um modelo, ele conversa de verdade, sempre em linguagem simples.

1. Num computador com internet, baixe **um** destes arquivos `.gguf`:
   - Qwen2.5-1.5B-Instruct (arquivo `q4_k_m`, ~1 GB): melhor qualidade
     https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF
   - Qwen2.5-0.5B-Instruct (arquivo `q4_k_m`, ~400 MB): mais leve, para PCs mais fracos
     https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF
2. Copie o arquivo para a pasta **`modelos`**, ao lado do programa instalado (ou do `.exe` portátil no pen drive).
3. Abra o programa. O ícone na barra de tarefas mostra 🧠 quando a IA está ligada (💬 = respostas prontas).

> Com 4 GB de RAM, use o modelo de 1,5B ou o de 0,5B. Feche outros programas durante a aula.

**Voz:** o professor fala usando a voz do próprio Windows (no Windows 10 em português, "Microsoft Maria").
O aluno pode desligar a voz no ícone 🔊 da barra de tarefas.

## Como gerar o instalador para Windows

**Opção 1: automática pelo GitHub (não precisa instalar nada).**
Na aba **Actions** do repositório, abra "Computador Escola – instalador Windows" e clique em **Run workflow**.
Quando terminar, baixe o arquivo em **Artifacts**. Vêm dois:
- `Computador Escola Setup 0.1.0.exe`: instalador normal
- `Computador Escola 0.1.0.exe`: versão portátil, roda direto do pen drive e guarda os dados na pasta `dados` ao lado dele

**Opção 2: num computador Windows com [Node.js](https://nodejs.org) instalado:**
```
cd computador-escola
npm install
npm run dist
```
Os arquivos ficam na pasta `dist`.

## Para testar durante o desenvolvimento
```
npm install
npm start            # tela cheia
npm start -- --janela   # em janela (mais fácil para testar)
```
Para sair da tela cheia use o botão **Iniciar → Desligar**.

## Primeiro uso
1. Na primeira vez, o programa pede para cadastrar o **instrutor** (nome e senha).
2. Entre como instrutor, abra o **Painel do Instrutor → Alunos** e cadastre os alunos (nome, turma, senha e figurinha).
3. Os alunos entram clicando no próprio nome.

## Onde ficam os dados
- Versão instalada: `%APPDATA%\Computador Escola\dados` (em cada computador)
- Versão portátil: pasta `dados` ao lado do `.exe`

Cada computador guarda os próprios dados. Na **Entrega 5** entra o "modo sala de aula": o computador do instrutor vira
o servidor pela rede (cabo) e todos os alunos aparecem no mesmo painel.

## Próximas fases
- **Entrega 4:** Nível Avançado: Editor e Planilha avançados (gráficos), Apresentações, Configurações, segurança
  digital avançada, computador e trabalho, projeto final e prova.
- **Entrega 5:** Modo sala de aula em rede, painel do instrutor ao vivo, editor de lições sem programar.
- **Extra:** o aluno falar com o professor pelo microfone (reconhecimento de voz offline com Whisper).

## Organização do código
```
main.js                  programa principal (janela, dados, IA)
preload.js               ponte segura entre a tela e o programa principal
src/armazenamento.js     usuários (senhas com hash) e dados em JSON
src/ia.js                IA local (node-llama-cpp)
app/index.html           a tela
app/estilo.css           o visual
app/js/janelas.js        gerenciador de janelas
app/js/area-trabalho.js  ícones, menu Iniciar, barra de tarefas
app/js/professor.js      motor das lições e conversa
app/js/respostas-prontas.js  respostas do professor sem IA
app/js/curso.js          níveis, módulos e regra de liberação das aulas
app/js/licoes/           as aulas (n1-*.js, n2-*.js) e os atalhos para escrever aulas (ajudantes.js)
app/js/apps/             os programas (editor, planilha, e-mail, digitação, arquivos...)
app/js/planilha/         as fórmulas da planilha
app/js/navegador/        os sites de treino
```
