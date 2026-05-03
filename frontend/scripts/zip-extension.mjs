/**
 * Builds frontend/public/extension/legalease-extension.zip from repo legalease-extension/.
 * Uses tar ZIP mode (-a). On Windows this targets the built-in bsdtar.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(frontendRoot, "..");
const extDir = path.join(repoRoot, "legalease-extension");
const outDir = path.join(frontendRoot, "public", "extension");
const outZip = path.join(outDir, "legalease-extension.zip");

if (!fs.existsSync(extDir)) {
  console.error("Missing legalease-extension folder:", extDir);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(outZip)) fs.unlinkSync(outZip);

execFileSync("tar", ["-a", "-cf", outZip, "."], {
  cwd: extDir,
  stdio: "inherit",
});

console.log("Wrote", outZip);
