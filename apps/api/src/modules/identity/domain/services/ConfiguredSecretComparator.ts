export class ConfiguredSecretComparator {
  public static matches(candidate: string, configured: string): boolean {
    const left = new TextEncoder().encode(candidate);
    const right = new TextEncoder().encode(configured);
    const length = Math.max(left.length, right.length);
    let difference = left.length ^ right.length;
    for (let index = 0; index < length; index++) {
      difference |= (left[index] || 0) ^ (right[index] || 0);
    }
    return difference === 0;
  }
}
