# Computador Escola

Um "computador dentro do computador" para aulas de informática. O aluno entra com o próprio nome e senha e encontra uma
área de trabalho parecida com a do Windows, com programas de treino e um **Professor Virtual** que ensina passo a passo,
conversa e tira dúvidas. **Funciona sem internet.**

## O que já tem (Fase 1)

| Parte | O que faz |
|---|---|
| **Entrada com perfis** | Aluno escolhe o nome (com figurinha) e digita a senha. Filtro por turma. Instrutor tem conta própria. |
| **Área de trabalho** | Ícones (clique e clique duplo), botão Iniciar, barra de tarefas, relógio, botão direito do mouse, troca de fundo de tela. |
| **Janelas** | Mover arrastando, maximizar, minimizar, restaurar pela barra de tarefas, fechar, redimensionar pelo canto. |
| **Editor de Texto** | Parecido com o Word: fonte, tamanho, negrito, itálico, sublinhado, cor, alinhamento, listas, desfazer, salvar e abrir. |
| **Digitação** | 9 exercícios em níveis (fileira do meio até frases com números e acentos), teclado ABNT2 na tela com cor por dedo, velocidade, acertos e estrelas. |
| **Arquivos** | Pasta "Meus Documentos" de cada aluno: abrir, renomear, excluir. |
| **Calculadora** | Para treinar cliques e o teclado numérico. |
| **Aulas** | Lista de lições com o progresso do aluno. |
| **Professor Virtual** | Conduz as lições, faz piscar o botão certo, fala em voz alta (voz do Windows), dá dicas se o aluno demorar e responde perguntas escritas. |
| **Painel do Instrutor** | Cadastrar alunos e turmas, trocar senhas, ver o progresso de cada aluno em todas as aulas e na digitação. |

### Lições prontas
1. Conhecendo o mouse
2. Trabalhando com janelas
3. Botão Iniciar e botão direito
4. Posição das mãos no teclado
5. Meu primeiro documento
6. Encontrando seus documentos

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

Cada computador guarda os próprios dados. Na **Fase 4** entra o "modo sala de aula": o computador do instrutor vira
o servidor pela rede (cabo) e todos os alunos aparecem no mesmo painel.

## Próximas fases
- **Fase 2:** Planilha (tipo Excel), mais lições de Editor de Texto (carta, currículo), Bloco de Notas, lixeira.
- **Fase 3:** Navegador com sites de treino offline (busca, loja, banco, gov.br, como reconhecer golpes) e E-mail simulado.
- **Fase 4:** Modo sala de aula em rede, painel do instrutor ao vivo, editor de lições sem programar.
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
app/js/licoes/licoes.js  as lições
app/js/apps/             os programas (editor, digitação, arquivos...)
```
