import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 3000;

const server = http.createServer((req, res) => {
  const file = path.join(__dirname, "index.html");
  const html = fs.readFileSync(file);
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-cache",
  });
  res.end(html);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`ozur site :${port}`);
});
