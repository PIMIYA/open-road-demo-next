export const xx = (t: any) => console.log(t);
export const chance = (n: number) => Math.random() * 100 < n;

export const pick = (options: { [key: string]: number }) => {
  const chanceValues = Object.values(options).map(n => n * 10000);
  const sum = chanceValues.reduce((a, b) => a + b);
  const rand = Math.random() * sum;

  let current = 0;
  for (const key in options) {
    const chance = options[key] * 10000;
    if (rand > current && rand <= current + chance) {
      return key;
    }
    current = current + chance;
  }

  return 0;
}

