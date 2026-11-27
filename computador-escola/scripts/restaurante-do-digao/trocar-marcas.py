"""Tira as marcas que sobraram no Restaurante do Digão:
- o "M" dourado (botão da sede no painel: formas 289, 313 e 454; esquema do tutorial: forma 242) vira o "D" do Digão;
- o palhaço da forma 1376 (cabelo vermelho, rosto branco, nariz vermelho, macacão amarelo) é recolorido: cabelo escuro,
  rosto cor de pele, terno cinza, como os outros da cena. Nenhum traço muda de lugar.
Uso: python3 -I trocar-marcas.py ENTRADA.swf SAIDA.swf"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import swf
import cirurgia

entrada, saida = sys.argv[1], sys.argv[2]
s = swf.abrir(entrada)

AMARELO_M, BRILHO_M = (254, 194, 16), (255, 232, 15)
# onde fica o "M" em cada forma (px, com folga de 1 px): x0, x1, y0, y1
REGIOES_M = {289: (-142, -119, 99, 119), 454: (140, 169, 369, 395), 313: (4, 33, 18, 43), 242: (20, 81, 75, 127)}
D_PREENCH, D_LINHA = (255, 204, 0, 255), (111, 0, 0, 255)

PELE, CABELO, ESCURO, TERNO = (255, 204, 153), (51, 51, 51), (51, 51, 51), (102, 102, 102)
VERMELHOS, AMARELOS = {(204, 0, 0), (255, 15, 15)}, {(255, 204, 0), (217, 173, 0)}
BRANCOS = {(255, 255, 255), (245, 245, 245), (239, 239, 239), (228, 228, 228)}


def cor_palhaco(mx, my, cor):
    """A cor nova de um lado de um traço do palhaço (ou None para manter). mx, my em px."""
    if not (78 <= mx <= 188 and 15 <= my <= 188):
        return None
    if cor in VERMELHOS:
        if 115 <= mx <= 140 and 74 <= my < 94:
            return PELE  # nariz
        if my < 94:
            return CABELO  # cabelo
        if my < 106:
            return ESCURO  # boca
        return ESCURO  # enfeites do macacão
    if cor in AMARELOS and my >= 95:
        return TERNO
    if cor in BRANCOS and my < 95 and (mx < 160 or my < 88):
        return PELE  # o rosto branco de palhaço
    return None


relatorio = []
for i, (codigo, dados) in enumerate(s['tags']):
    if codigo not in swf.VERSAO_FORMA:
        continue
    ident = swf.Bits(dados).u16()
    if ident in REGIOES_M:
        f = cirurgia.ler(codigo, dados)
        x0, x1, y0, y1 = [v * 20 for v in REGIOES_M[ident]]
        apagados = []
        for r in f['regs']:
            if r['tipo'] == 'estilo':
                continue
            c0, c1 = cirurgia.cor_de(f, r, 'fs0'), cirurgia.cor_de(f, r, 'fs1')
            do_m = (c1 and tuple(c1[:3]) == AMARELO_M and not r['fs0']) or (c0 and tuple(c0[:3]) == BRILHO_M and not r['fs1'])
            mx, my = cirurgia.meio(r)
            if do_m and x0 <= mx <= x1 and y0 <= my <= y1:
                r['apagado'] = True
                apagados.append(r)
        xs = [v for r in apagados for v in (r['x0'], r['x1'], r.get('cx', r['x0']))]
        ys = [v for r in apagados for v in (r['y0'], r['y1'], r.get('cy', r['y0']))]
        caixa = (min(xs), max(xs), min(ys), max(ys))
        contornos, k = cirurgia.d_no_lugar(caixa, folga=0.02)
        extras = [{'preench': D_PREENCH, 'linha': (max(8, round(2.5 * k)), D_LINHA), 'contornos': contornos}]
        s['tags'][i][1] = cirurgia.gravar(f, extras)
        relatorio.append('forma %d: %d traços do "M" apagados; "D" desenhado em %s px' % (ident, len(apagados), [round(v / 20, 1) for v in caixa]))
    elif ident == 1376:
        f = cirurgia.ler(codigo, dados)
        mudou = 0
        for r in f['regs']:
            if r['tipo'] == 'estilo':
                continue
            mx, my = [v / 20 for v in cirurgia.meio(r)]
            troca = {}
            for lado in ('fs0', 'fs1'):
                c = cirurgia.cor_de(f, r, lado)
                if not c:
                    continue
                nova = cor_palhaco(mx, my, tuple(c[:3]))
                if nova:
                    troca[lado] = cirurgia.garantir_cor(f, r['tab'], nova)
            if troca:
                r['recolor'] = troca
                mudou += 1
        s['tags'][i][1] = cirurgia.gravar(f)
        relatorio.append('forma 1376: %d traços do palhaço recoloridos' % mudou)

swf.salvar(s, saida)
print('\n'.join(relatorio))
print('gravado', saida, os.path.getsize(saida), 'bytes')
