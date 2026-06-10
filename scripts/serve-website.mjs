import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const websiteRoot = resolve(projectRoot, "website");
const port = Number(process.env.PORT ?? argumentValue("--port") ?? 4174);

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
]);

function argumentValue(name) {
  const exact = process.argv.indexOf(name);
  if (exact !== -1) return process.argv[exact + 1];

  const prefix = `${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match?.slice(prefix.length);
}

function resolveRequestPath(requestUrl) {
  const url = new URL(requestUrl ?? "/", `http://localhost:${port}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/slides.html";

  const filePath = resolve(websiteRoot, `.${pathname}`);
  if (filePath !== websiteRoot && !filePath.startsWith(`${websiteRoot}${sep}`)) {
    return undefined;
  }

  return filePath;
}

const server = createServer(async (request, response) => {
  let filePath = resolveRequestPath(request.url);

  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    let fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      filePath = resolve(filePath, "index.html");
      fileStat = await stat(filePath);
    }

    response.writeHead(200, {
      "Content-Length": fileStat.size,
      "Content-Type": mimeTypes.get(extname(filePath)) ?? "application/octet-stream",
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

server.listen(port, () => {
  console.log(`Serving ZX Online website at http://localhost:${port}/slides.html`);
  console.log(`Root: ${websiteRoot}`);
});
