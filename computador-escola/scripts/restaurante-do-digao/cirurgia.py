"""Cirurgia em formas do SWF: lê os registros de uma forma (DefineShape2/3) mantendo os estilos originais em bytes,
permite apagar arestas (por cor e região) e acrescentar desenhos novos com estilos novos (NewStyles), e regrava.
Usado para trocar o "M" que sobrou pelo "D" do Digão e tirar o palhaço que sobrou, no Restaurante do Digão."""
import swf


def ler(codigo, dados):
    v = swf.VERSAO_FORMA[codigo]
    b = swf.Bits(dados)
    b.u16()
    b.rect()
    if v == 4:
        b.rect()
        b.u8()
    inicio_estilos = b.p // 8
    preench = swf._preenchimentos(b, v)
    linhas = swf._linhas(b, v)
    b.alinhar()
    cabeca = dados[:b.p // 8]  # id, limites, estilos iniciais (bytes originais)
    nf, nl = b.ub(4), b.ub(4)
    nf0, nl0 = nf, nl  # bits dos índices de estilo no começo (o gravar escreve de novo, logo depois do cabeçalho)
    tabelas = [(preench, linhas)]
    regs = []
    x = y = 0
    est = {'fs0': 0, 'fs1': 0, 'ls': 0, 'tab': 0}
    while True:
        if b.ub(1) == 0:
            flags = b.ub(5)
            if flags == 0:
                break
            r = {'tipo': 'estilo', 'move': None, 'fs0': None, 'fs1': None, 'ls': None, 'novos': None}
            if flags & 1:
                n = b.ub(5)
                x, y = b.sb(n), b.sb(n)
                r['move'] = (x, y)
            if flags & 2:
                r['fs0'] = est['fs0'] = b.ub(nf)
            if flags & 4:
                r['fs1'] = est['fs1'] = b.ub(nf)
            if flags & 8:
                r['ls'] = est['ls'] = b.ub(nl)
            if flags & 16:
                b.alinhar()
                ini = b.p // 8
                p2 = swf._preenchimentos(b, v)
                l2 = swf._linhas(b, v)
                b.alinhar()
                fim = b.p // 8
                nf, nl = b.ub(4), b.ub(4)
                tabelas.append((p2, l2))
                est['tab'] = len(tabelas) - 1
                r['novos'] = (dados[ini:fim], nf, nl)
                r['tab_id'] = len(tabelas) - 1
            regs.append(r)
        else:
            if b.ub(1):
                n = b.ub(4) + 2
                if b.ub(1):
                    dx, dy = b.sb(n), b.sb(n)
                elif b.ub(1):
                    dx, dy = 0, b.sb(n)
                else:
                    dx, dy = b.sb(n), 0
                regs.append({'tipo': 'reta', 'x0': x, 'y0': y, 'x1': x + dx, 'y1': y + dy, **est})
                x, y = x + dx, y + dy
            else:
                n = b.ub(4) + 2
                cdx, cdy, adx, ady = b.sb(n), b.sb(n), b.sb(n), b.sb(n)
                qx, qy = x + cdx, y + cdy
                regs.append({'tipo': 'curva', 'x0': x, 'y0': y, 'cx': qx, 'cy': qy, 'x1': qx + adx, 'y1': qy + ady, **est})
                x, y = qx + adx, qy + ady
    return {'v': v, 'cabeca': cabeca, 'ini0': inicio_estilos, 'tabelas': tabelas, 'regs': regs, 'nf0': nf0, 'nl0': nl0}


def garantir_cor(forma, t, rgb):
    """O índice de um preenchimento sólido com esta cor na tabela t; se não houver, acrescenta um no fim da tabela."""
    import struct
    v = forma['v']
    p, _ = forma['tabelas'][t]
    for i, (tipo, c) in enumerate(p):
        if tipo == 'cor' and tuple(c[:3]) == tuple(rgb):
            return i + 1
    if t == 0:
        prefixo, bruto = forma['cabeca'][:forma['ini0']], forma['cabeca'][forma['ini0']:]
    else:
        rec = next(r for r in forma['regs'] if r.get('tab_id') == t)
        bruto = rec['novos'][0]
    b = swf.Bits(bruto)
    n = b.u8()
    tam_cab = 1
    if n == 0xFF and v >= 2:
        n = b.u16()
        tam_cab = 3
    b2 = swf.Bits(bruto)
    swf._preenchimentos(b2, v)
    fim = b2.p // 8
    entrada = bytes([0x00]) + bytes(rgb[:3]) + (b'\xff' if v >= 3 else b'')
    novo_n = n + 1
    cab = bytes([novo_n]) if novo_n < 0xFF else b'\xff' + struct.pack('<H', novo_n)
    novo_bruto = cab + bruto[tam_cab:fim] + entrada + bruto[fim:]
    p.append(('cor', tuple(rgb[:3]) + (255,)))
    precisa = bits_para(novo_n)
    if t == 0:
        forma['cabeca'] = prefixo + novo_bruto
        forma['nf0'] = max(forma['nf0'], precisa)
    else:
        rec['novos'] = (novo_bruto, max(rec['novos'][1], precisa), rec['novos'][2])
    return novo_n


def cor_de(forma, aresta, lado):
    """A cor do preenchimento de um lado da aresta (fs0 ou fs1), ou None."""
    i = aresta[lado]
    if not i:
        return None
    p, _ = forma['tabelas'][aresta['tab']]
    return p[i - 1][1] if i - 1 < len(p) else None


def meio(a):
    return ((a['x0'] + a['x1']) / 2, (a['y0'] + a['y1']) / 2)


def bits_para(n):
    return max(1, int(n).bit_length())


def gravar(forma, extras=None):
    """Regrava a forma (mesmo id e cabeçalho). extras: lista de desenhos novos, cada um
    {'preench': (r,g,b[,a]), 'linha': (largura, (r,g,b[,a])), 'contornos': [(comandos, buraco?)]} — ganham estilos novos."""
    v = forma['v']
    e = swf.Escrita()
    # o cabeçalho original já termina alinhado
    nf = forma['nf0']
    nl = forma['nl0']
    e.ub(nf, 4)
    e.ub(nl, 4)
    x = y = 0
    est = {'fs0': 0, 'fs1': 0, 'ls': 0}

    def estilo(move=None, fs0=None, fs1=None, ls=None, novos=None):
        nonlocal nf, nl, x, y
        flags = (1 if move else 0) | (2 if fs0 is not None else 0) | (4 if fs1 is not None else 0) | (8 if ls is not None else 0) | (16 if novos else 0)
        e.ub(0, 1)
        e.ub(flags, 5)
        if move:
            nm = swf.bits_com_sinal(*move)
            e.ub(nm, 5)
            e.sb(move[0], nm)
            e.sb(move[1], nm)
            x, y = move
        if fs0 is not None:
            e.ub(fs0, nf)
            est['fs0'] = fs0
        if fs1 is not None:
            e.ub(fs1, nf)
            est['fs1'] = fs1
        if ls is not None:
            e.ub(ls, nl)
            est['ls'] = ls
        if novos:
            dados, nf2, nl2 = novos
            e.alinhar()
            for byte in dados:
                e.ub(byte, 8)
            nf, nl = nf2, nl2
            e.ub(nf, 4)
            e.ub(nl, 4)

    def aresta(a):
        nonlocal x, y
        if (a['x0'], a['y0']) != (x, y):
            estilo(move=(a['x0'], a['y0']))
        if a['tipo'] == 'reta':
            dx, dy = a['x1'] - x, a['y1'] - y
            nb = max(2, swf.bits_com_sinal(dx, dy))
            e.ub(1, 1)
            e.ub(1, 1)
            e.ub(nb - 2, 4)
            e.ub(1, 1)
            e.sb(dx, nb)
            e.sb(dy, nb)
        else:
            cdx, cdy, adx, ady = a['cx'] - x, a['cy'] - y, a['x1'] - a['cx'], a['y1'] - a['cy']
            nb = max(2, swf.bits_com_sinal(cdx, cdy, adx, ady))
            e.ub(1, 1)
            e.ub(0, 1)
            e.ub(nb - 2, 4)
            for val in (cdx, cdy, adx, ady):
                e.sb(val, nb)
        x, y = a['x1'], a['y1']

    for r in forma['regs']:
        if r['tipo'] == 'estilo':
            if r.get('apagado'):
                continue
            estilo(r['move'], r['fs0'], r['fs1'], r['ls'], r['novos'])
        elif not r.get('apagado'):
            troca = r.get('recolor')  # {'fs0': índice novo, 'fs1': ...} na mesma tabela de estilos
            if troca:
                antes = {k: est[k] for k in troca}
                estilo(fs0=troca.get('fs0'), fs1=troca.get('fs1'))
                aresta(r)
                estilo(fs0=antes.get('fs0'), fs1=antes.get('fs1'))  # volta ao estado original na hora
            else:
                aresta(r)
    rgba = v >= 3
    for d in extras or []:
        # estilos novos: 1 preenchimento e 1 linha
        ee = swf.Escrita()
        ee.u8(1)
        ee.u8(0x00)
        for c in d['preench'][:4 if rgba else 3]:
            ee.u8(c)
        larg, cl = d['linha']
        ee.u8(1)
        ee.u16(larg)
        for c in cl[:4 if rgba else 3]:
            ee.u8(c)
        estilo(novos=(ee.bytes(), 1, 1))
        for cmds, buraco in d['contornos']:
            for c in cmds:
                if c[0] == 'M':
                    estilo(move=(c[1], c[2]), fs0=1 if buraco else 0, fs1=0 if buraco else 1, ls=1)
                elif c[0] == 'L':
                    aresta({'tipo': 'reta', 'x0': x, 'y0': y, 'x1': c[1], 'y1': c[2]})
                else:
                    aresta({'tipo': 'curva', 'x0': x, 'y0': y, 'cx': c[1], 'cy': c[2], 'x1': c[3], 'y1': c[4]})
    e.ub(0, 1)
    e.ub(0, 5)
    return forma['cabeca'] + e.bytes()


# O "D" do Digão (o mesmo desenho de logo/193.svg do repositório), em pixels, com o buraco no meio.
D_FORA = [('M', 285, 37), ('L', 334.5, 37), ('Q', 370, 37, 370, 72.5), ('Q', 370, 108, 334.5, 108), ('L', 285, 108), ('L', 285, 37)]
D_DENTRO = [('M', 300.62, 52.62), ('L', 333.08, 52.62), ('Q', 354.38, 52.62, 354.38, 72.5), ('Q', 354.38, 92.38, 333.08, 92.38), ('L', 300.62, 92.38), ('L', 300.62, 52.62)]


def d_no_lugar(caixa, folga=0.06):
    """O D centralizado na caixa (x0, x1, y0, y1 em twips), sem distorcer. Devolve os contornos em twips e a escala."""
    x0, x1, y0, y1 = caixa
    w, h = (x1 - x0) * (1 - 2 * folga), (y1 - y0) * (1 - 2 * folga)
    dw, dh = 370 - 285, 108 - 37
    k = min(w / dw, h / dh)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2

    def t(cmds):
        out = []
        for c in cmds:
            pts = [round(cx + (c[i] - 327.5) * k) if i % 2 else round(cy + (c[i] - 72.5) * k) for i in range(1, len(c))]
            out.append((c[0], *pts))
        return out
    return [(t(D_FORA), False), (t(D_DENTRO), True)], k


def svg_correto(forma, limites, tam=330):
    """Desenha a forma como um tocador: para cada camada (tabela) e cada preenchimento, junta os traços que têm aquele
    preenchimento à direita (fs1, no sentido do traço) ou à esquerda (fs0, ao contrário) em contornos fechados."""
    from collections import defaultdict
    x0, x1, y0, y1 = limites
    w, h = max(1, x1 - x0), max(1, y1 - y0)
    por_estilo = defaultdict(list)
    linhas = defaultdict(list)
    for r in forma['regs']:
        if r['tipo'] == 'estilo':
            continue
        seg = (r['x0'], r['y0'], r.get('cx'), r.get('cy'), r['x1'], r['y1'])
        if r['fs1']:
            por_estilo[(r['tab'], r['fs1'])].append(seg)
        if r['fs0']:
            por_estilo[(r['tab'], r['fs0'])].append((seg[4], seg[5], seg[2], seg[3], seg[0], seg[1]))
        if r['ls']:
            linhas[(r['tab'], r['ls'])].append(seg)
    partes = []
    for t in range(len(forma['tabelas'])):
        p, l = forma['tabelas'][t]
        for (tt, i), segs in sorted(por_estilo.items()):
            if tt != t:
                continue
            cor = p[i - 1][1] if i - 1 < len(p) else (255, 0, 255, 255)
            saindo = defaultdict(list)
            for k, sg in enumerate(segs):
                saindo[(sg[0], sg[1])].append(k)
            usado = [False] * len(segs)
            d = []
            for k in range(len(segs)):
                if usado[k]:
                    continue
                atual = k
                d.append('M%d %d' % (segs[k][0], segs[k][1]))
                while atual is not None and not usado[atual]:
                    usado[atual] = True
                    sg = segs[atual]
                    d.append(('L%d %d' % (sg[4], sg[5])) if sg[2] is None else ('Q%d %d %d %d' % (sg[2], sg[3], sg[4], sg[5])))
                    prox = [j for j in saindo[(sg[4], sg[5])] if not usado[j]]
                    atual = prox[0] if prox else None
                d.append('Z')
            partes.append('<path d="%s" fill="rgb(%d,%d,%d)" fill-opacity="%.2f" fill-rule="nonzero"/>' % (' '.join(d), cor[0], cor[1], cor[2], cor[3] / 255 if len(cor) > 3 else 1))
        for (tt, i), segs in sorted(linhas.items()):
            if tt != t:
                continue
            larg, cor = l[i - 1] if i - 1 < len(l) else (20, (0, 0, 0, 255))
            d = ' '.join(('M%d %d L%d %d' % (s[0], s[1], s[4], s[5])) if s[2] is None else ('M%d %d Q%d %d %d %d' % (s[0], s[1], s[2], s[3], s[4], s[5])) for s in segs)
            partes.append('<path d="%s" fill="none" stroke="rgb(%d,%d,%d)" stroke-width="%d" stroke-linecap="round"/>' % (d, cor[0], cor[1], cor[2], max(10, larg)))
    return '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="%d %d %d %d">%s</svg>' % (tam, tam * h // w, x0, y0, w, h, ''.join(partes))
