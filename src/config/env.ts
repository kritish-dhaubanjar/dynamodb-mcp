import { z } from "zod";

const schema = z.object({
  DYNAMODB_DASHBOARD_API_URL: z.url(),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  console.error(
    "Invalid environment variables: ",
    z.treeifyError(result.error),
  );
  process.exit(1);
}

const env = result.data;

export default env;
