/**
 * Coerce a version-like string into [major, minor, patch].
 * Handles prefixes (v2.9.0), suffixes (2.9.0-beta1), and partial versions (2.9).
 * Mirrors the behaviour of semver.coerce().
 */
function coerceVersion(version: string): [number, number, number] | null {
  const match = version.match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) return null;
  return [
    parseInt(match[1], 10),
    match[2] ? parseInt(match[2], 10) : 0,
    match[3] ? parseInt(match[3], 10) : 0,
  ];
}

/**
 * Returns true if version >= target (both coerced to major.minor.patch).
 */
export function semverGte(version: string, target: string): boolean {
  const v = coerceVersion(version);
  const t = coerceVersion(target);
  if (!v || !t) return false;
  for (let i = 0; i < 3; i++) {
    if (v[i] > t[i]) return true;
    if (v[i] < t[i]) return false;
  }
  return true; // equal
}
