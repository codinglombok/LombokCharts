// Copyright 2025 codinglombok
// Licensed under the Apache License, Version 2.0 (see LICENSE or
// http://www.apache.org/licenses/LICENSE-2.0).
// pack-release.mjs — assemble downloadable release archives (zip + tgz) for
// SourceForge / GitHub Releases: dist + src + license + readme + manifests.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
);
const pkg = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);
const name = `lombok-charts-${pkg.version}`;
const stage = path.join(root, ".release", name);
fs.rmSync(path.join(root, ".release"), { recursive: true, force: true });
fs.mkdirSync(stage, { recursive: true });

for (const item of [
  "dist",
  "src",
  "docs",
  "LICENSE",
  "NOTICE",
  "README.md",
  "CHANGELOG.md",
  "package.json",
  "composer.json",
]) {
  const s = path.join(root, item);
  if (fs.existsSync(s))
    fs.cpSync(s, path.join(stage, item), { recursive: true });
}

const outDir = path.join(root, ".release");
execFileSync("zip", ["-rq", `${name}.zip`, name], {
  cwd: outDir,
  stdio: "inherit",
});
execFileSync("tar", ["-czf", `${name}.tgz`, name], {
  cwd: outDir,
  stdio: "inherit",
});
console.log(`Release archives: .release/${name}.zip and .release/${name}.tgz`);
