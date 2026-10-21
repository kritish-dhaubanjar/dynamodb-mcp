# DynamoDB MCP Server

A read-only [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for inspecting Amazon DynamoDB tables and items through [DynamoDB Dashboard](https://github.com/kritish-dhaubanjar/dynamodb-dashboard).

This server connects AI assistants such as Claude to an existing DynamoDB Dashboard instance, allowing them to explore table schemas, retrieve items, execute queries, scan tables, and count matching records without exposing data modification tools.

## Features

- **Read-only access:** Provides tools for inspecting tables and retrieving data without exposing write or delete operations.
- **DynamoDB Dashboard integration:** Uses the existing dashboard API to access DynamoDB.
- **Table inspection:** List tables, inspect table metadata, and check Time to Live (TTL) configuration.
- **Item retrieval:** Get individual items by their primary key.
- **Query and scan:** Retrieve items using key conditions, filters, secondary indexes, and pagination.
- **Item counting:** Count matching items without returning their full contents.
- **Structured responses:** Returns results as both JSON text and structured MCP content.
- **Claude integration:** Connects to Claude Desktop through the standard MCP stdio transport.

## How It Works

```text
┌──────────────────┐
│   Claude Desktop │
└────────┬─────────┘
         │ MCP (stdio)
         ▼
┌──────────────────┐
│  DynamoDB MCP    │
│     Server       │
└────────┬─────────┘
         │ HTTP API
         ▼
┌──────────────────┐
│ DynamoDB Dashboard│
└────────┬─────────┘
         │ AWS SDK
         ▼
┌──────────────────┐
│     DynamoDB     │
└──────────────────┘
```

The MCP server does not connect directly to AWS DynamoDB. It calls the API exposed by DynamoDB Dashboard, which handles the underlying database connection.

This lets you reuse an existing dashboard configuration for local DynamoDB instances or remote AWS DynamoDB tables.

## Available Tools

### Table tools

| Tool | Description |
|---|---|
| `table.index` | Lists available table names. |
| `table.describe` | Retrieves schema metadata, columns, and properties for a table. |
| `table.describeTimeToLive` | Retrieves the TTL configuration and status for a table. |

### Item tools

| Tool | Description |
|---|---|
| `item.get` | Retrieves an item using its primary key. |
| `item.scan` | Scans a table or secondary index, with optional filters and pagination. |
| `item.query` | Queries a table or secondary index using key conditions, with optional filters and pagination. |
| `item.count` | Counts matching items without returning the full item data. |

### Read-only behavior

The server exposes inspection and data-retrieval tools only. It does not register MCP tools for inserting, updating, or deleting items, or creating, updating, or deleting tables.

**Note:** Read-only MCP tools do not independently guarantee read-only access to the underlying database. Configure appropriate access controls on the dashboard and its AWS credentials, and avoid exposing the dashboard API to untrusted networks.

## Prerequisites

- [Node.js](https://nodejs.org/) and npm
- [DynamoDB Dashboard](https://github.com/kritish-dhaubanjar/dynamodb-dashboard) installed and running
- Access to the dashboard's HTTP API
- [Claude Desktop](https://claude.com/download) or another compatible MCP client

## Setup

### 1. Start DynamoDB Dashboard

Follow the [DynamoDB Dashboard installation guide](https://github.com/kritish-dhaubanjar/dynamodb-dashboard).

For a local installation:

```bash
npm install --global dynamodb-dashboard
dynamodb-dashboard start
```

By default, the dashboard listens on port `4567` and uses `127.0.0.1` as its host.

Configure the dashboard's AWS connection using the environment variables it supports:

```bash
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key

dynamodb-dashboard start
```

For DynamoDB Local, configure `AWS_ENDPOINT` to point to your local DynamoDB endpoint.

Use credentials with the minimum permissions necessary for the intended read-only access.

### 2. Clone the MCP server

```bash
git clone https://github.com/kritish-dhaubanjar/dynamodb-mcp.git
cd dynamodb-mcp
```

### 3. Install dependencies

```bash
npm install
```

### 4. Build the server

```bash
npm run build
```

The compiled entry point is:

```text
build/index.js
```

### 5. Configure the dashboard API URL

The server requires one environment variable:

| Variable | Required | Description |
|---|---|---|
| `DYNAMODB_DASHBOARD_API_URL` | Yes | Base URL of the DynamoDB Dashboard API. |

For a dashboard running locally on its default port:

```bash
export DYNAMODB_DASHBOARD_API_URL=http://127.0.0.1:4567
```

The URL must be reachable from the MCP server process. If the dashboard runs in Docker or on another host, use the appropriate hostname or IP address instead.

The server validates this environment variable at startup and exits if it is missing or invalid.

## Integrating with Claude Desktop

Claude Desktop launches the MCP server as a local process and communicates with it over standard input and output.

### 1. Find the Claude Desktop configuration file

Open the Claude Desktop configuration file for your operating system:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Create the file if it does not exist.

### 2. Add the MCP server configuration

Replace `/absolute/path/to/dynamodb-mcp` with the actual absolute path to your cloned repository.

```json
{
  "mcpServers": {
    "dynamodb": {
      "command": "node",
      "args": [
        "/absolute/path/to/dynamodb-mcp/build/index.js"
      ],
      "env": {
        "DYNAMODB_DASHBOARD_API_URL": "http://127.0.0.1:4567"
      }
    }
  }
}
```

**Important:** Use an absolute path to the compiled entry point. The `env` property supplies the dashboard API URL to the MCP server process.

If your configuration already contains other MCP servers, add the `dynamodb` entry under the existing `mcpServers` object rather than replacing the entire configuration.

### 3. Restart Claude Desktop

Completely quit and reopen Claude Desktop so it loads the updated configuration.

Open the MCP or connected-tools interface and verify that the DynamoDB server and its tools are available. The exact interface may vary by Claude Desktop version.

### 4. Try it out

Ask Claude questions such as:

- "List all available DynamoDB tables."
- "Describe the schema of the `Users` table."
- "Show me the TTL configuration for the `Sessions` table."
- "Retrieve the user whose `userId` is `user-123`."
- "Find the most recent records in the `Orders` table."
- "Count the records matching a given condition."

Claude can select the appropriate tools and use their results to answer your questions.

## Example Tool Inputs

The following examples illustrate the input structure accepted by the server.

### List tables

Tool: `table.index`

No input parameters are required.

### Describe a table

Tool: `table.describe`

```json
{
  "tableName": "Users"
}
```

### Describe TTL configuration

Tool: `table.describeTimeToLive`

```json
{
  "tableName": "Sessions"
}
```

### Get an item by primary key

Tool: `item.get`

```json
{
  "TableName": "Users",
  "Key": {
    "userId": "user-123"
  }
}
```

Include both the partition key and sort key when the table's primary key requires them.

### Scan a table

Tool: `item.scan`

```json
{
  "TableName": "Users",
  "Limit": 20
}
```

Optional parameters include `IndexName`, `FilterExpression`, `ExpressionAttributeNames`, `ExpressionAttributeValues`, and `ExclusiveStartKey`.

### Query a table

Tool: `item.query`

```json
{
  "TableName": "Orders",
  "KeyConditionExpression": "#userId = :userId",
  "ExpressionAttributeNames": {
    "#userId": "userId"
  },
  "ExpressionAttributeValues": {
    ":userId": "user-123"
  },
  "Limit": 20,
  "ScanIndexForward": false
}
```

Use a key condition compatible with the table's primary key or the selected secondary index. The expression attribute names and values must match the expression you supply.

### Count matching items

Tool: `item.count`

```json
{
  "TableName": "Orders",
  "KeyConditionExpression": "#userId = :userId",
  "ExpressionAttributeNames": {
    "#userId": "userId"
  },
  "ExpressionAttributeValues": {
    ":userId": "user-123"
  }
}
```

For count operations, the result contains count metadata rather than the full set of matching items.

## Development

### Available commands

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run build

# Format the code
npm run format
```

### Project structure

```text
dynamodb-mcp/
├── src/
│   ├── config/
│   ├── tools/
│   │   ├── table.tools.ts
│   │   └── item.tools.ts
│   └── index.ts
├── build/
├── package.json
└── tsconfig.json
```

- `src/index.ts` initializes the MCP server and registers the table and item tools.
- `src/tools/table.tools.ts` defines table inspection tools.
- `src/tools/item.tools.ts` defines item retrieval, scanning, querying, and counting tools.
- `src/config/` contains the environment, HTTP client, and dashboard route configuration.

## Troubleshooting

### Missing `DYNAMODB_DASHBOARD_API_URL`

Set the variable in the MCP client's `env` configuration or export it in the shell before starting the server manually.

### Dashboard connection errors

- Verify that DynamoDB Dashboard is running.
- Confirm that `DYNAMODB_DASHBOARD_API_URL` points to the correct dashboard API base URL.
- Check that the dashboard is reachable from the machine or container running the MCP server.
- Review the dashboard logs for AWS credential, endpoint, or permission errors.

### Tools are not appearing in Claude Desktop

- Confirm that the server builds successfully.
- Check that the configured entry point exists.
- Verify the JSON syntax in `claude_desktop_config.json`.
- Restart Claude Desktop after making changes.
- Check the MCP server logs for startup errors.

### Queries return unexpected results

Check the table's primary key and index definitions. Ensure your key condition, filter expressions, expression attribute names, and expression attribute values are valid for the selected operation.

## Security Considerations

- Use read-only AWS IAM permissions wherever possible.
- Keep AWS credentials in the dashboard's secure runtime configuration rather than embedding them in prompts.
- Do not expose the dashboard API publicly without appropriate authentication and network controls.
- Be mindful that retrieved database records may contain sensitive information that is passed to the connected AI client.
- Remember that a scan may consume substantial read capacity on a large table. Use appropriate limits and prefer key-based queries when possible.

## Related Projects

- [DynamoDB Dashboard](https://github.com/kritish-dhaubanjar/dynamodb-dashboard) — A web GUI for local or remote DynamoDB.
- [DynamoDB MCP Server](https://github.com/kritish-dhaubanjar/dynamodb-mcp) — This read-only MCP integration.

## License

See the repository's [LICENSE](https://github.com/kritish-dhaubanjar/dynamodb-mcp) file for licensing information.
