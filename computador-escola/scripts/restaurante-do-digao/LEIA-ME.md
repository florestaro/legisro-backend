# Ferramentas do Restaurante do Digão

O jogo da lanchonete da Praça Escola (`app/jogos/restaurante-do-digao/restaurante-do-digao.swf`) é a adaptação em
português de "The McDonald's Videogame" (Molleindustria, CC BY-NC-SA 3.0), vinda do repositório
`florestaro/restaurante-do-digao` (arquivo `mcdonalds.swf`).

Aquela versão ainda tinha três marcas que a tradução não pegou: o "M" dourado no botão da sede do painel e no esquema
do tutorial, e o palhaço numa cena da diretoria. `trocar-marcas.py` corrige isso direto no arquivo do jogo, sem mudar
mais nada:

- o "M" (formas 242, 289, 313 e 454) vira o "D" do Digão, no mesmo lugar e tamanho;
- o palhaço da forma 1376 é recolorido (cabelo escuro, rosto cor de pele, terno cinza); nenhum traço muda de lugar.

Para gerar o jogo de novo (por exemplo, depois de recompilar a tradução no repositório dela):

```
python3 -I scripts/restaurante-do-digao/trocar-marcas.py CAMINHO/mcdonalds.swf app/jogos/restaurante-do-digao/restaurante-do-digao.swf
```

`swf.py` lê e grava o arquivo SWF (as etiquetas e as formas); `cirurgia.py` apaga, acrescenta e recolore traços de uma
forma e desenha a forma em SVG para conferir (`svg_correto`). Só usam a biblioteca padrão do Python.
