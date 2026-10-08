const E = require('../engine.js');
const cases = require('./expected.json');
let pass = 0, fail = 0;
const TOL = 1e-9;
function chk(ok, label, got, want) {
  if (ok) pass++;
  else { fail++; console.error('FAIL', label, 'got', got, 'want', want); }
}
for (const c of cases) {
  if (c.kind === 'slope') {
    const r = E.slopeInfo(c.r);
    chk(!r.error && Math.abs(r.factor - c.factor) < TOL && Math.abs(r.angleDeg - c.angleDeg) < TOL &&
        Math.abs(r.percent - c.percent) < TOL && r.cls === c.cls, `slope ${c.r}/12`, r, c);
  } else if (c.kind === 'area') {
    const r = E.roofArea(c.L, c.W, c.r, c.t, c.oe, c.ora);
    chk(!r.error && Math.abs(r.planFt2 - c.plan) < TOL && Math.abs(r.areaFt2 - c.area) < TOL &&
        Math.abs(r.squares - c.squares) < TOL, `area ${c.L}x${c.W} ${c.t}`, r.areaFt2, c.area);
  } else if (c.kind === 'edges') {
    const r = E.edges(c.L, c.W, c.r, c.t, c.oe, c.ora);
    chk(!r.error && Math.abs(r.eavesFt - c.eaves) < TOL && Math.abs(r.rakesFt - c.rakes) < TOL &&
        Math.abs(r.ridgeFt - c.ridge) < TOL && Math.abs(r.hipsFt - c.hips) < TOL &&
        Math.abs(r.capFt - c.cap) < TOL && Math.abs(r.starterFt - c.starter) < TOL,
        `edges ${c.L}x${c.W} ${c.t}`, r, c);
  } else if (c.kind === 'bund') {
    const r = E.bundles(c.area, c.w);
    chk(!r.error && Math.abs(r.wasteSquares - c.sq) < TOL && r.bundles === c.bundles,
        `bund ${c.area} @${c.w}%`, r.bundles, c.bundles);
  } else if (c.kind === 'acc') {
    const r = E.accessories(c.eaves, c.rakes, c.cap, c.area, c.w, c.cov, c.wind);
    chk(!r.error && r.starterBundles === c.starterB && r.capBundles === c.capB &&
        r.underlaymentRolls === c.rolls && r.dripPieces === c.drip && r.nails === c.nails,
        `acc ${c.cov}/${c.wind}`, r, c);
  }
}
// error paths
const errs = [
  E.slopeInfo(0).error, E.slopeInfo(-3).error, E.slopeInfo(25).error, E.slopeInfo('x').error,
  E.roofArea(0, 24, 6, 'gable', 1, 0.5).error, E.roofArea(40, -1, 6, 'gable', 1, 0.5).error,
  E.roofArea(40, 24, 6, 'mansard', 1, 0.5).error, E.roofArea(40, 24, 6, 'gable', -1, 0.5).error,
  E.roofArea(40, 24, 6, 'gable', 5, 0.5).error, E.roofArea(40, 24, 0, 'gable', 1, 0.5).error,
  E.edges(0, 24, 6, 'gable', 1, 0.5).error, E.edges(20, 40, 6, 'hip', 1, 0.5).error,
  E.edges(40, 24, 6, 'flat', 1, 0.5).error,
  E.bundles(0, 10).error, E.bundles(1000, -1).error, E.bundles(1000, 60).error,
  E.accessories(-1, 0, 0, 1000, 10, 400, false).error, E.accessories(80, 0, 40, 0, 10, 400, false).error,
  E.accessories(80, 0, 40, 1000, 10, 0, false).error
];
errs.forEach((e, i) => chk(typeof e === 'string' && e.length > 5, 'error path ' + i, e, 'error string'));
// properties
// steeper pitch always adds area
let prev = 0;
for (let r = 2; r <= 20; r += 2) {
  const a = E.roofArea(40, 24, r, 'gable', 1, 0.5).areaFt2;
  chk(a > prev, `steeper more area ${r}`, a, prev);
  prev = a;
}
// waste never reduces the order
for (const [a, w] of [[900, 10], [1500, 20]]) {
  chk(E.bundles(a, w).bundles >= E.bundles(a, 0).bundles, `waste order ${a}`, E.bundles(a, w).bundles, E.bundles(a, 0).bundles);
}
// gable vs hip same footprint: hip needs more edge trim (4 hips vs 4 rakes at low pitch hips>rakes)
const hg = E.edges(40, 24, 6, 'gable', 1, 0.5), hh = E.edges(40, 24, 6, 'hip', 1, 0.5);
chk(hh.hipsFt > hg.rakesFt, 'hips longer than rakes at same footprint', hh.hipsFt, hg.rakesFt);
console.log(`${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
