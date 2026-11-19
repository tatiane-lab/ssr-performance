import { rate } from './web-vitals.service';

describe('rate', () => {
  it('classifica LCP conforme os limiares do web.dev', () => {
    expect(rate('lcp', 2000)).toBe('good');
    expect(rate('lcp', 3000)).toBe('needs-improvement');
    expect(rate('lcp', 5000)).toBe('poor');
  });

  it('classifica CLS', () => {
    expect(rate('cls', 0.05)).toBe('good');
    expect(rate('cls', 0.2)).toBe('needs-improvement');
    expect(rate('cls', 0.4)).toBe('poor');
  });

  it('classifica INP', () => {
    expect(rate('inp', 150)).toBe('good');
    expect(rate('inp', 600)).toBe('poor');
  });
});
