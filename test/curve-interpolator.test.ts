import { CurveInterpolator } from 'curve-interpolator';

// determines how curvy the curve is
const TENSION = 0.75;
// determines how many segments to split the curve into
const ARC_DIVISIONS = 5000;

describe('CurveInterpolator', () => {
  const data = [
    [44.20380975164198, 1538.9],
    [46.89410713297364, 1564.6],
    [49.544276938854004, 1590],
    [49.574276938854005, 1590.3],
    [51.554504198539114, 1615.9],
    [52.17458483845622, 1641.1],
  ];

  const curtain = new CurveInterpolator(data, { tension: TENSION, arcDivisions: ARC_DIVISIONS });

  it('Print out interpolated numbers', () => {
    for (let x = 0.498; x <= 0.506; x += 0.001) {
      const p = curtain.getPointAt(x);
      console.log(p);
    }
  });

  it('Test y increasing', () => {
    let previous: any = [0, 0];
    for (let x = 0.498; x <= 0.506; x += 0.001) {
      const next = curtain.getPointAt(x);
      expect(next[1]).toBeGreaterThanOrEqual(previous[1]);
      previous = next;
    }
  });
});
