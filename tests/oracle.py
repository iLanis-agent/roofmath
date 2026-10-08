#!/usr/bin/env python3
# Independent oracle for Roofmath. Re-derives the geometry with math.hypot and
# re-multiplies every rule of thumb from scratch, then checks published
# reference points exactly (12/12 slope factor sqrt(2), 6/12 = sqrt(1.25),
# hip diagonal at 12/12 = sqrt(3)).
import json, math

BPS, STARTER, CAP, DRIP = 3, 100, 33, 10
NAILS, NAILS_WIND = 320, 480

def factor(r):
    p = r / 12.0
    return math.hypot(1.0, p)

def plan(L, W, t, oe, ora):
    if t == 'gable': return (L + 2 * ora) * (W + 2 * oe)
    return (L + 2 * oe) * (W + 2 * oe)

def edges(L, W, r, t, oe, ora):
    f = factor(r)
    p = r / 12.0
    if t == 'gable':
        eaves = 2 * (L + 2 * ora)
        rakes = 4 * (W / 2.0 + oe) * f
        ridge = L + 2 * ora
        hips = 0.0
    else:
        eaves = 2 * (L + 2 * oe) + 2 * (W + 2 * oe)
        hips = 4 * (W / 2.0 + oe) * math.hypot(math.sqrt(2), p)
        ridge = max(L - W, 0.0)
        rakes = 0.0
    return eaves, rakes, ridge, hips

cases = []

# slope geometry grid + verdicts
for r in (1, 2, 3, 4, 6, 8, 10, 12, 16, 20):
    p = r / 12.0
    cases.append({'kind': 'slope', 'r': r, 'factor': factor(r),
                  'angleDeg': math.degrees(math.atan(p)), 'percent': p * 100,
                  'cls': 'bad' if r < 2 else ('warn' if r < 4 or r > 12 else 'ok')})

# roof areas
combos = [(40, 24, 4, 'gable', 1.0, 0.5), (40, 24, 6, 'gable', 1.0, 0.5),
          (40, 24, 12, 'gable', 1.5, 0.75), (36, 28, 6, 'hip', 1.0, 0.5),
          (28, 28, 8, 'hip', 0.75, 0.5), (52, 30, 3, 'hip', 1.25, 1.0),
          (30, 20, 2, 'gable', 0.5, 0.5), (48, 32, 10, 'hip', 2.0, 1.0)]
for L, W, r, t, oe, ora in combos:
    pl = plan(L, W, t, oe, ora)
    ar = pl * factor(r)
    cases.append({'kind': 'area', 'L': L, 'W': W, 'r': r, 't': t, 'oe': oe, 'ora': ora,
                  'plan': pl, 'area': ar, 'squares': ar / 100})

# edges
for L, W, r, t, oe, ora in combos:
    eaves, rakes, ridge, hips = edges(L, W, r, t, oe, ora)
    cases.append({'kind': 'edges', 'L': L, 'W': W, 'r': r, 't': t, 'oe': oe, 'ora': ora,
                  'eaves': eaves, 'rakes': rakes, 'ridge': ridge, 'hips': hips,
                  'cap': ridge + hips, 'starter': eaves + rakes})

# bundles
for area, w in [(1000, 10), (1234.5, 15), (2000, 20), (750, 0), (3333, 15), (412.7, 10)]:
    sq = area * (1 + w / 100.0) / 100.0
    cases.append({'kind': 'bund', 'area': area, 'w': w, 'sq': sq,
                  'bundles': math.ceil(sq * BPS)})

# accessories
for L, W, r, t, oe, ora in combos[:5]:
    eaves, rakes, ridge, hips = edges(L, W, r, t, oe, ora)
    pl = plan(L, W, t, oe, ora)
    ar = pl * factor(r)
    for cov, wind in [(400, False), (1000, True)]:
        w = 10 if t == 'gable' else 15
        sq = ar * (1 + w / 100.0) / 100.0
        cases.append({'kind': 'acc', 'eaves': eaves, 'rakes': rakes, 'cap': ridge + hips,
                      'area': ar, 'w': w, 'cov': cov, 'wind': wind,
                      'starterB': math.ceil((eaves + rakes) / STARTER),
                      'capB': math.ceil((ridge + hips) / CAP),
                      'rolls': math.ceil(ar / cov),
                      'drip': math.ceil((eaves + rakes) / DRIP),
                      'nails': math.ceil(sq * (NAILS_WIND if wind else NAILS))})

with open('tests/expected.json', 'w') as f:
    json.dump(cases, f, indent=1)

fails = []
# published reference points (exact)
if abs(factor(12) - math.sqrt(2)) > 1e-12: fails.append(('12/12 != sqrt2', factor(12)))
if abs(factor(6) - math.sqrt(1.25)) > 1e-12: fails.append(('6/12 != sqrt1.25', factor(6)))
h = math.hypot(math.sqrt(2), 1.0)
if abs(h - math.sqrt(3)) > 1e-12: fails.append(('hip 12/12 != sqrt3', h))
# properties
for L, W, r, t, oe, ora in combos:
    if factor(r) < 1: fails.append(('factor < 1', r))
    pl = plan(L, W, t, oe, ora)
    if pl * factor(r) < pl: fails.append(('area < plan', L, W, r))
    eaves, rakes, ridge, hips = edges(L, W, r, t, oe, ora)
    if t == 'gable' and rakes < 2 * W: fails.append(('rakes < 2W', L, W, r))
    if t == 'hip' and hips < 4 * (W / 2.0) * math.sqrt(2): fails.append(('hips < flat diagonal', L, W, r))
for area in (100, 500, 1000, 2500):
    sq = area * 1.10 / 100.0
    if math.ceil(sq * BPS) < sq * BPS: fails.append(('bundles under-needed', area))

print(f'{len(cases)} cases written, {len(fails)} property failures')
for f in fails: print('FAIL', f)
raise SystemExit(1 if fails else 0)
