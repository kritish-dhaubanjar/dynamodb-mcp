import { z } from "zod";
import { ServerToolOptions } from "./tools";
import { ServerContext } from "@modelcontextprotocol/server";

import axios from "../config/axios";
import routes from "../config/routes";

export function index() {
  const config: ServerToolOptions = {
    title: "List Tables",
    description: "Get list of all tables",
    outputSchema: z.array(z.string()),
    annotations: {
      readOnlyHint: true,
    },
  };

  const fn = async (
    _args: Record<string, unknown>,
    _context: ServerContext,
  ) => {
    const { data } = await axios.get(routes.TABLE.INDEX);

    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data,
    };
  };

  return [config, fn] as const;
}
