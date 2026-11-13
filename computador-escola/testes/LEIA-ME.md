# Testes da sala de aula

Quatro testes automáticos do modo sala de aula em rede e um dos emojis (o último). Antes da primeira vez, rode
`npm install` na pasta `computador-escola`.

## Teste do servidor (rápido, sem tela)

```
npm run teste:servidor
```

Liga o servidor da sala sozinho (sem abrir o programa) e confere, pedido por pedido, cerca de 110 situações:
- o instrutor fecha e abre o programa, e os alunos continuam dentro;
- um aluno entra em outro computador, é removido pelo instrutor ou tem a senha trocada;
- 20 alunos entram ao mesmo tempo, e senhas erradas em série esbarram no limite;
- mensagens são entregues enquanto a caixa é gravada, uma caixa fica cheia ou alguém apaga de vez;
- dois instrutores criam aulas ao mesmo tempo;
- dados da escola, número dos certificados (reimprimir mantém o número), liberar aulas fora da sequência (o aluno não
  consegue mudar o que o instrutor liberou), a trilha do curso e a revisão rápida (só o instrutor troca),
  zerar "onde a turma trava" e o "🙋 Não entendi" na Sala ao vivo;
- a corrida de digitação: o convite chega com a presença, só o instrutor abre e dá a largada, o placar segue as regras
  (quem terminou primeiro, depois quem foi mais longe), e corrida de uma turma não convida as outras;
- a fase 2: a empresa do Gestão Fácil de cada aluno (o colega não lê); a **gincana** (só o instrutor abre e passa as
  rodadas, o convite chega com a presença, as equipes ficam do mesmo tamanho, a resposta certa fica escondida até o
  resultado, a resposta não muda depois de dada, na tarefa quem termina primeiro ganha mais e o resultado fica
  guardado); a **missão da semana** (só o instrutor troca); o **jornal** (matéria curta é recusada, no máximo 5 esperando
  por aluno, o aluno não lê as dos outros nem aprova, e fechar a edição publica as aprovadas);
- a fase 3: a **monitoria** (só o instrutor escolhe monitor; quem não é monitor não vê os pedidos de ajuda; o aluno não
  se faz monitor nem inventa ajudas gravando o próprio progresso; o monitor vê o "Não entendi" do colega com a aula,
  avisa que vai ajudar, o colega e a Sala ao vivo recebem o aviso, e cada ajuda conta uma vez só);
- um arquivo de dados está estragado.

Leva menos de 1 minuto. Usa uma pasta temporária e a porta 47199 (para usar outra, veja "Outra porta" abaixo).

## Teste com a turma inteira (20 alunos ao mesmo tempo)

```
npm run teste:sala            (20 alunos)
npm run teste:sala -- 5       (5 alunos, mais rápido)
```

No Linux sem tela: `xvfb-run -a npm run teste:sala`.

Abre o programa de verdade 21 vezes no mesmo computador, cada um com a sua pasta de dados: 1 computador do instrutor
e 20 computadores de aluno ligados a ele. Eles usam o sistema ao mesmo tempo:
- **Cadastro e aula:** a instrutora cadastra os 20 alunos pelo Painel e cria uma aula. Todos entram, fazem a aula,
  salvam um documento e gravam digitação.
- **E-mail:** todos criam conta no Correio e mandam e-mails uns aos outros.
- **Sala ao vivo:** a instrutora acompanha, pausa as telas e manda mensagens.
- **Ajuda e papelada:** metade da turma aperta "🙋 Não entendi" (a Sala ao vivo e "Onde a turma trava" mostram), a
  instrutora abre o relatório da turma e libera o Nível 2 para a turma da manhã.
- **Situações de problema:**
  - todos saem e entram de novo;
  - a instrutora fecha e reabre o programa;
  - um aluno entra em outro computador;
  - um aluno é removido pelo Painel.
- **Conferência final:** o teste confere no disco do instrutor se nada se perdeu (inclusive a frequência e as aulas
  liberadas) e se nenhum aluno vê os dados de outro.

Cada linha do resultado começa com ✔ (passou) ou ✘ (falhou); no fim aparecem `FALHAS 0` e onde ficaram as capturas
de tela (cada rodada tem a sua pasta, dentro da pasta temporária do sistema). Leva uns 2 minutos. O número de alunos vai
de 5 a 20.

Cuidados:
- precisa da porta 47123 livre: feche antes o Computador Escola que estiver em modo "Computador do INSTRUTOR" (o
  teste avisa se a porta estiver ocupada) ou use outra porta;
- os programas do teste não carregam a IA local, mesmo que haja um modelo na pasta `modelos`;
- com 20 alunos usa uns 6 GB de memória; em computador mais fraco, use menos alunos (`npm run teste:sala -- 5`);
- tudo roda num computador só, então as respostas ficam mais lentas do que numa sala de verdade, onde cada aluno
  tem o próprio computador.

## Teste das novidades da fase 2 em 3 computadores

```
npm run teste:fase2
```

No Linux sem tela: `xvfb-run -a npm run teste:fase2`.

Abre o programa de verdade 4 vezes: 1 computador do instrutor e 3 computadores de aluno. Confere que **o aluno pode
usar qualquer computador da sala com o mesmo nome e senha** e encontra tudo o que fez:
- **Computador 1:** a Ana entra, põe letra grande e cria o PIN no **Celular**, cadastra um cliente no **Gestão
  Fácil**, salva uma foto no **Editor de Fotos** (cumprindo a **missão da semana** escolhida pela instrutora) e manda
  uma matéria para o **jornal**.
- **Computador 2:** a Ana entra com o mesmo nome e senha e encontra tudo: a missão cumprida (🎯✅), o Celular com letra
  grande pedindo o PIN criado no computador 1 (e o PIN abre), o cliente no Gestão Fácil, a foto nos arquivos, a matéria
  no 📰 Jornal e as medalhas.
- **Gincana:** a instrutora abre a gincana pelo Painel; o convite aparece na tela da Ana (computador 2) e do Bruno
  (computador 3); os dois jogam as 6 rodadas (5 perguntas e 1 tarefa) e o pódio aparece nos três computadores.
- **Computador 3:** a Ana entra e encontra a gincana e as medalhas ganhas no computador 2, o Celular e a missão.
- **Painel:** a instrutora vê quem cumpriu a missão, aprova a matéria, monta o jornal com os destaques e fecha a
  edição; a Ana vê a matéria publicada.
- **Onde os dados ficam:** tudo no disco do computador do instrutor, e nada nos computadores dos alunos (nem no
  armazenamento do navegador deles).

Leva uns 3 minutos e usa a porta 47123 (ou outra, como no teste com 20 alunos: `PORTA=47130 npm run teste:fase2`).

## Teste das novidades da fase 3 em 3 computadores

```
npm run teste:fase3
```

No Linux sem tela: `xvfb-run -a npm run teste:fase3`.

Abre o programa de verdade 4 vezes (1 instrutor e 3 alunos) e confere:
- **Computador 1:** a Ana abre o MEI no Portal do Empreendedor, publica um anúncio com foto na Feira Online e preenche
  um formulário em PDF.
- **Computador 2:** a Ana entra com o mesmo nome e senha e encontra o MEI (CNPJ de treino), o anúncio com a foto em
  "Meus anúncios" e o PDF preenchido.
- **Monitoria:** a instrutora escolhe o Bruno como monitor pelo Painel; a Ana (computador 2) aperta "🙋 Não entendi"; o
  pedido chega no 💁 do Bruno (computador 3), que clica em "Vou ajudar"; a Ana recebe na tela "Bruno Lima, monitor(a)
  da turma, está vindo te ajudar!", a Sala ao vivo da instrutora mostra quem está indo ajudar e, depois do "Já ajudei",
  a ajuda fica contada (e a medalha de monitor) no computador da instrutora.
- **Onde os dados ficam:** tudo no disco do computador da instrutora, nada nos computadores dos alunos.

Leva uns 3 minutos e usa a porta 47123 (ou outra: `PORTA=47130 npm run teste:fase3`).

## Emojis que o Windows 10 desenha (rápido, sem tela)

```
npm run teste:emojis
```

Os ícones e figuras do programa são emojis, e quem desenha é a fonte do Windows. A do Windows 10 vai até o Emoji 12.0:
um emoji mais novo aparece como um quadradinho, e os desenhos novos de pessoa (como 🧑‍🏫, que deveria ser um professor)
aparecem separados, 🧑 e 🏫 lado a lado. Este teste lê todos os arquivos do programa e aponta, com arquivo e linha,
qualquer emoji assim. Rode sempre que mudar ou criar aulas, sites e programas.

## Outra porta

| Onde | Teste com 20 alunos | Teste do servidor |
|---|---|---|
| PowerShell (Windows) | `$env:PORTA=47130; npm run teste:sala` | `$env:PORTA_TESTE=47200; npm run teste:servidor` |
| Prompt de Comando (Windows) | `set PORTA=47130&& npm run teste:sala` | `set PORTA_TESTE=47200&& npm run teste:servidor` |
| Linux / macOS | `PORTA=47130 npm run teste:sala` | `PORTA_TESTE=47200 npm run teste:servidor` |
