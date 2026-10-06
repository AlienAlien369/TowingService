// Tiny static server for the video composition: marketing/ at "/", project node_modules at "/nm/".
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = import.meta.dirname;
const nm = path.resolve(root, "../node_modules");
const types = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".css": "text/css", ".svg": "image/svg+xml" };

export function serve(port = 3300) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
    const file = url.startsWith("/nm/") ? path.join(nm, url.slice(4)) : path.join(root, url === "/" ? "comp.html" : url);
    if (!file.startsWith(root) && !file.startsWith(nm)) return res.writeHead(403).end();
    fs.readFile(file, (err, buf) => {
      if (err) return res.writeHead(404).end("not found");
      res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream", "cache-control": "no-store" }).end(buf);
    });
  });
  return new Promise((r) => server.listen(port, () => r(server)));
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  await serve(Number(process.env.PORT ?? 3300));
  console.log("composition server on :3300");
}
