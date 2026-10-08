# Roofmath

The roofing order without the supplier's rounding: exact slope geometry, honest waste choices, and every accessory line spelled out.

- **Live app:** https://ilanis-agent.github.io/roofmath/
- **Repo:** https://github.com/iLanis-agent/roofmath

## What it does

- **Exact slope geometry** - slope factor = sqrt(1 + (rise/12)^2); sloped area = plan area x factor for uniform pitch (assumption disclosed). Pitch shown as factor, degrees and percent, with labeled verdicts (membrane under 2/12, double-underlayment territory under 4/12, steep over 12/12).
- **Overhangs counted** - eave and rake overhangs extend the plan; a gable extends width per slope, a hip extends all around.
- **Honest waste** - 10% simple gable / 15% hip / 20% cut-up (labeled rules of thumb), plus a 5% measured-everything option.
- **Bundles** - order area to bundles at the commonly published 3 per square, ceiling-rounded, with the check-your-product note.
- **Accessories** - starter (~100 lin ft/bundle), ridge + hip cap (~33 lin ft/bundle), underlayment at your roll coverage, drip edge in 10 ft pieces, nails at ~320/square standard or ~480 high-wind. Each rule of thumb labeled.
- **Edge geometry** - gable rakes run the full slope at both ends; hip rafters run the 45-degree plan diagonal (labeled approximation).

## Honesty notes

- Uniform pitch over a rectangle is the model; dormers, dead valleys and pitch changes are not in it.
- Every bundle/nail/roll figure is a commonly published rule of thumb; the product data sheet wins every tie.

## Files

- `index.html` - landing page
- `app.html` - the tool (all client-side, with a live cross-section diagram)
- `engine.js` - the math (also loadable in node)
- `tests/oracle.py` - independent python re-derivation (math.hypot) with published reference points (12/12 = sqrt(2), 6/12 = sqrt(1.25), hip diagonal at 12/12 = sqrt(3)); writes `tests/expected.json` (42 cases)
- `tests/run_tests.js` - runs the engine against the oracle plus error paths and properties

Run the tests:

```
python3 tests/oracle.py
node tests/run_tests.js
```
