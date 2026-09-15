import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

/** Letter assets copied from `frontend/assets/images/logos/` at build time. */
export function letterheadAssetsDir(): string {
  return path.join(moduleDir, '../../assets');
}
