import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/server";

import axios from "../config/axios";
import routes from "../config/routes";
import { interpolate } from "../utils/string";

export default class ItemTools {
  static register(server: McpServer) {
    server.registerTool(
      "item.get",
      {
        title: "Get Item from Table by Key",
        description:
          "Retrieves a specific database item from a given table using its primary key attributes.",
        inputSchema: z.object({
          TableName: z
            .string()
            .describe(
              "The exact, case-sensitive name of the database table containing the item.",
            ),
          Key: z
            .record(z.string(), z.any())
            .refine((schema) => Object.keys(schema).length <= 2, {
              message:
                "Key can contain a maximum of 2 attributes (e.g., partition key and sort key).",
            })
            .describe(
              "The primary key object identifying the item to retrieve.",
            ),
        }),
        annotations: {
          readOnlyHint: true,
        },
      },
      async ({ TableName, Key }) => {
        const url = interpolate(routes.ITEM.GET, { tableName: TableName });

        const { data } = await axios.post(url, Key);

        return {
          content: [{ type: "text", text: JSON.stringify(data) }],
          structuredContent: data,
        };
      },
    );
  }
}
