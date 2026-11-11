// 随机源完全来自存档，刷新和读档不改变后续实验结果。
export function nextRandom(seed: number): [number, number] {
  const value = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return [value / 4294967296, value];
}
export function seededValues(seed: number, count: number) {
  const values: number[] = [];
  let cursor = seed;
  for (let i = 0; i < count; i++) {
    const [value, next] = nextRandom(cursor);
    values.push(value);
    cursor = next;
  }
  return values;
}
