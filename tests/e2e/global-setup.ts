import { execFileSync } from 'child_process';

async function globalSetup() {
  if (process.env.SEED_DATABASE) {
    execFileSync('pnpm', ['cypress:prepare'], { stdio: 'inherit' });
  }
}

export default globalSetup;
