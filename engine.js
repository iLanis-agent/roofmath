// Roofmath engine: honest roofing materials.
// The geometry is exact: slope factor = sqrt(1 + (rise/12)^2), so sloped area
// = plan area x factor when the pitch is uniform (assumption disclosed in the
// UI). Overhangs extend the plan. Hip lengths use the 45-degree plan diagonal.
// Everything else is a labeled rule of thumb or commonly published figure:
// 3 bundles per square, waste 10/15/20% by complexity, ~320 nails per square
// (480 high-wind), starter ~100 lin ft per bundle, ridge cap ~33 lin ft per
// bundle, 10 ft drip-edge pieces, underlayment coverage per roll varies.
var WASTE_OPTIONS = { gable: 0.10, hip: 0.15, cutup: 0.20 }; // labeled rules of thumb
var BUNDLES_PER_SQUARE = 3;   // commonly published for standard architectural shingles
var NAILS_PER_SQUARE = 320;   // ~4 nails per shingle, commonly published
var NAILS_PER_SQUARE_WIND = 480; // ~6 per shingle, commonly published
var STARTER_FT_PER_BUNDLE = 100; // rule of thumb for cut 3-tab starters
var CAP_FT_PER_BUNDLE = 33;      // rule of thumb for 3-tab cut ridge/hip cap
var DRIP_PIECE_FT = 10;          // commonly sold length

function bad(v) { return !(typeof v === 'number' && isFinite(v)); }

// pitch geometry (exact)
function slopeInfo(risePer12) {
  if (bad(risePer12) || risePer12 <= 0 || risePer12 > 24) return { error: 'Pitch must be a rise per 12 between 0 and 24 (flat roofs need membrane, not shingles).' };
  var p = risePer12 / 12;
  var factor = Math.sqrt(1 + p * p);
  var angleDeg = Math.atan(p) * 180 / Math.PI;
  var verdict, cls;
  if (risePer12 < 2) { verdict = 'Under 2/12 - most shingle makers require membrane here'; cls = 'bad'; }
  else if (risePer12 < 4) { verdict = 'Low slope - double underlayment rules commonly apply'; cls = 'warn'; }
  else if (risePer12 > 12) { verdict = 'Steep - expect slower work and higher waste'; cls = 'warn'; }
  else { verdict = 'Normal walkable-to-steep shingle range'; cls = 'ok'; }
  return { factor: factor, angleDeg: angleDeg, percent: risePer12 / 12 * 100, verdict: verdict, cls: cls };
}

// plan area including overhangs, then sloped area.
// gable: rake overhang extends the length, eave overhang the width (per slope run).
// hip: eave-style overhang runs all around.
function roofArea(lengthFt, widthFt, risePer12, roofType, eaveOvhFt, rakeOvhFt) {
  if (bad(lengthFt) || lengthFt <= 0 || lengthFt > 500) return { error: 'Length must be between 0 and 500 ft.' };
  if (bad(widthFt) || widthFt <= 0 || widthFt > 500) return { error: 'Width must be between 0 and 500 ft.' };
  if (roofType !== 'gable' && roofType !== 'hip') return { error: 'Roof type must be gable or hip.' };
  if (bad(eaveOvhFt) || eaveOvhFt < 0 || eaveOvhFt > 4) return { error: 'Eave overhang must be 0-4 ft.' };
  if (bad(rakeOvhFt) || rakeOvhFt < 0 || rakeOvhFt > 4) return { error: 'Rake overhang must be 0-4 ft.' };
  var s = slopeInfo(risePer12);
  if (s.error) return { error: s.error };
  var L = lengthFt, W = widthFt, plan;
  if (roofType === 'gable') plan = (L + 2 * rakeOvhFt) * (W + 2 * eaveOvhFt);
  else plan = (L + 2 * eaveOvhFt) * (W + 2 * eaveOvhFt);
  var area = plan * s.factor;
  return { planFt2: plan, areaFt2: area, squares: area / 100, factor: s.factor,
    note: 'Sloped area = plan area x slope factor (' + s.factor.toFixed(4) + '). Exact when the pitch is uniform across the whole roof; dormers and dead valleys change it.' };
}

// edge lengths (ft): eaves, rakes (sloped), ridge, hips (45-degree plan diagonal)
function edges(lengthFt, widthFt, risePer12, roofType, eaveOvhFt, rakeOvhFt) {
  var s = slopeInfo(risePer12);
  if (s.error) return { error: s.error };
  if (bad(lengthFt) || lengthFt <= 0 || bad(widthFt) || widthFt <= 0) return { error: 'Length and width must be positive.' };
  if (lengthFt < widthFt) return { error: 'Enter the long side as length (ridge runs along it).' };
  var p = risePer12 / 12, eaves, rakes = 0, ridge, hips = 0;
  if (roofType === 'gable') {
    eaves = 2 * (lengthFt + 2 * rakeOvhFt);
    rakes = 4 * (widthFt / 2 + eaveOvhFt) * s.factor; // 2 slopes x 2 gable ends
    ridge = lengthFt + 2 * rakeOvhFt;
  } else if (roofType === 'hip') {
    eaves = 2 * (lengthFt + 2 * eaveOvhFt) + 2 * (widthFt + 2 * eaveOvhFt);
    hips = 4 * (widthFt / 2 + eaveOvhFt) * Math.sqrt(2 + p * p); // hip rafter: plan diagonal, same rise (labeled approximation)
    ridge = lengthFt - widthFt;
  } else {
    return { error: 'Roof type must be gable or hip.' };
  }
  return { eavesFt: eaves, rakesFt: rakes, ridgeFt: Math.max(ridge, 0), hipsFt: hips,
    capFt: Math.max(ridge, 0) + hips, starterFt: eaves + rakes,
    note: 'Starter goes on eaves and rakes; cap covers ridge and hips. Hip rafters run the 45-degree plan diagonal at the same rise (approximation disclosed).' };
}

// shingle bundles with waste
function bundles(areaFt2, wastePct) {
  if (bad(areaFt2) || areaFt2 <= 0) return { error: 'Area must be positive.' };
  if (bad(wastePct) || wastePct < 0 || wastePct > 50) return { error: 'Waste must be 0-50%.' };
  var squares = areaFt2 * (1 + wastePct / 100) / 100;
  return { wasteSquares: squares, bundles: Math.ceil(squares * BUNDLES_PER_SQUARE),
    note: BUNDLES_PER_SQUARE + ' bundles per square is the common figure for standard architectural shingles - check your product (some run 4).' };
}

// accessory quantities
function accessories(eavesFt, rakesFt, capFt, areaFt2, wastePct, coveragePerRoll, highWind) {
  if (bad(eavesFt) || eavesFt < 0 || bad(rakesFt) || rakesFt < 0 || bad(capFt) || capFt < 0) return { error: 'Edge lengths must be positive numbers.' };
  if (bad(areaFt2) || areaFt2 <= 0) return { error: 'Area must be positive.' };
  if (bad(coveragePerRoll) || coveragePerRoll <= 0 || coveragePerRoll > 2000) return { error: 'Coverage per roll must be 1-2000 sq ft.' };
  var wasteSquares = areaFt2 * (1 + wastePct / 100) / 100;
  var perSquare = highWind ? NAILS_PER_SQUARE_WIND : NAILS_PER_SQUARE;
  return {
    starterBundles: Math.ceil((eavesFt + rakesFt) / STARTER_FT_PER_BUNDLE),
    capBundles: Math.ceil(capFt / CAP_FT_PER_BUNDLE),
    underlaymentRolls: Math.ceil(areaFt2 / coveragePerRoll),
    dripPieces: Math.ceil((eavesFt + rakesFt) / DRIP_PIECE_FT),
    nails: Math.ceil(wasteSquares * perSquare),
    nailsPerSquare: perSquare,
    notes: 'Starter ~' + STARTER_FT_PER_BUNDLE + ' lin ft/bundle, cap ~' + CAP_FT_PER_BUNDLE + ' lin ft/bundle, drip in ' + DRIP_PIECE_FT + ' ft pieces, ~' + perSquare + ' nails/square (' + (highWind ? 'high-wind 6-nail' : 'standard 4-nail') + ' pattern) - all commonly published rules of thumb; your product sheet wins.'
  };
}

var engine = {
  slopeInfo: slopeInfo, roofArea: roofArea, edges: edges, bundles: bundles, accessories: accessories,
  CONST: { WASTE_OPTIONS: WASTE_OPTIONS, BUNDLES_PER_SQUARE: BUNDLES_PER_SQUARE, NAILS_PER_SQUARE: NAILS_PER_SQUARE,
    NAILS_PER_SQUARE_WIND: NAILS_PER_SQUARE_WIND, STARTER_FT_PER_BUNDLE: STARTER_FT_PER_BUNDLE,
    CAP_FT_PER_BUNDLE: CAP_FT_PER_BUNDLE, DRIP_PIECE_FT: DRIP_PIECE_FT }
};
if (typeof module !== 'undefined') module.exports = engine;
