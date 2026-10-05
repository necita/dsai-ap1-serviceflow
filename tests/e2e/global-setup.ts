import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

export default function globalSetup(): void {
  const tsxCli = resolve(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
  const preparationScript = resolve(process.cwd(), "scripts", "prepare-e2e.ts");
  const preparation = spawnSync(
    process.execPath,
    [tsxCli, preparationScript],
    {
      cwd: process.cwd(),
      env: process.env,
      encoding: "utf8",
    },
  );

  if (preparation.stdout) process.stdout.write(preparation.stdout);
  if (preparation.stderr) process.stderr.write(preparation.stderr);
  if (preparation.error || preparation.status !== 0) {
    throw new Error(
      "Playwright setup could not prepare the dedicated E2E test database.",
    );
  }
}
