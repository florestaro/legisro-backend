# Testes da sala de aula

Dois testes automáticos do modo sala de aula em rede. Antes da primeira vez, rode `npm install` na pasta
`computador-escola`.

## Teste do servidor (rápido, sem tela)

```
npm run teste:servidor
```

Liga o servidor da sala sozinho (sem abrir o programa) e confere, pedido por pedido, cerca de 37 situações:
- o instrutor fecha e abre o programa, e os alunos continuam dentro;
- um aluno entra em outro computador, é removido pelo instrutor ou tem a senha trocada;
- 20 alunos entram ao mesmo tempo, e senhas erradas em série esbarram no limite;
- mensagens são entregues enquanto a caixa é gravada, uma caixa fica cheia ou alguém apaga de vez;
- dois instrutores criam aulas ao mesmo tempo;
- um arquivo de dados está estragado.

Leva menos de 1 minuto. Usa uma pasta temporária e a porta 47199 (para usar outra: variável `PORTA_TESTE`).

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
- **Situações de problema:**
  - todos saem e entram de novo;
  - a instrutora fecha e reabre o programa;
  - um aluno entra em outro computador;
  - um aluno é removido pelo Painel.
- **Conferência final:** o teste confere no disco do instrutor se nada se perdeu e se nenhum aluno vê os dados de
  outro.

Cada linha do resultado começa com ✔ (passou) ou ✘ (falhou); no fim aparecem `FALHAS 0` e onde ficaram as capturas
de tela. Leva uns 2 minutos.

Cuidados:
- precisa da porta 47123 livre: feche antes o Computador Escola que estiver em modo "Computador do INSTRUTOR" (ou
  use outra porta com a variável `PORTA`);
- com 20 alunos usa uns 6 GB de memória; em computador mais fraco, use menos alunos (`npm run teste:sala -- 5`);
- tudo roda num computador só, então as respostas ficam mais lentas do que numa sala de verdade, onde cada aluno
  tem o próprio computador.
