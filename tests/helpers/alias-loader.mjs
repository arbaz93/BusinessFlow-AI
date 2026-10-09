import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

const serverOnlyEmptyModule = pathToFileURL(
  path.join(projectRoot, "node_modules", "server-only", "empty.js"),
).href;

function resolveFile(target) {
  if (existsSync(target) && statSync(target).isFile()) return target;
  for (const extension of [".ts", ".tsx", ".mjs", ".js"]) {
    const candidate = `${target}${extension}`;
    if (existsSync(candidate)) return candidate;
  }
  for (const extension of [".ts", ".tsx", ".mjs", ".js"]) {
    const candidate = path.join(target, `index${extension}`);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/** Maps the `@/...` path alias used throughout the app onto the repository root. */
export function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return nextResolve(serverOnlyEmptyModule, context);
  }
  if (specifier.startsWith("@/")) {
    const resolved = resolveFile(path.join(projectRoot, specifier.slice(2)));
    if (resolved) return nextResolve(pathToFileURL(resolved).href, context);
  }
  if (
    context.parentURL &&
    (specifier.startsWith("./") || specifier.startsWith("../"))
  ) {
    const parentPath = fileURLToPath(context.parentURL);
    const resolved = resolveFile(path.resolve(path.dirname(parentPath), specifier));
    if (resolved) return nextResolve(pathToFileURL(resolved).href, context);
  }
  return nextResolve(specifier, context);
}
