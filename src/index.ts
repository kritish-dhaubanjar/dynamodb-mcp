import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";

import TableTools from "./tools/table.tools";

function createServer() {
  const server = new McpServer({
    name: "dynamodb-mcp",
    version: "1.0.0",
  });

  TableTools.register(server);

  return server;
}

serveStdio(createServer, {
  onerror: (error) => console.error("dynamodb-mcp Server error:", error),
});

console.error("dynamodb-mcp running on stdio");
