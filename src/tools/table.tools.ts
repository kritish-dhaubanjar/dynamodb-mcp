import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/server";

import axios from "../config/axios";
import routes from "../config/routes";
import { interpolate } from "../utils/string";

export default class TableTools {
  static register(server: McpServer) {
    server.registerTool(
      "table.index",
      {
        title: "List Tables",
        description: "Get list of all tables",
        outputSchema: z.array(z.string()),
        annotations: {
          readOnlyHint: true,
        },
      },
      async () => {
        const url = routes.TABLE.INDEX;
        const { data } = await axios.get(url);

        return {
          content: [{ type: "text", text: JSON.stringify(data) }],
          structuredContent: data,
        };
      },
    );

    server.registerTool(
      "table.describe",
      {
        title: "Describe Table",
        description: "Get description of a table",
        inputSchema: { tableName: z.string() },
        annotations: {
          readOnlyHint: true,
        },
      },
      async ({ tableName }) => {
        const url = interpolate(routes.TABLE.DESCRIBE, { tableName });

        const { data } = await axios.get(url);

        return {
          content: [{ type: "text", text: JSON.stringify(data) }],
          structuredContent: data,
        };
      },
    );

    server.registerTool(
      "table.describeTimeToLive",
      {
        title: "Describe Table Time To Live",
        description: "Get 'Time To Live' description of a table",
        inputSchema: { tableName: z.string() },
        annotations: {
          readOnlyHint: true,
        },
      },
      async ({ tableName }) => {
        const url = interpolate(routes.TABLE.DESCRIBE_TTL, { tableName });

        const { data } = await axios.get(url);

        return {
          content: [{ type: "text", text: JSON.stringify(data) }],
          structuredContent: data,
        };
      },
    );
  }
}
