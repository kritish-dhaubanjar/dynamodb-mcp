import axios from "axios";

import env from "./env";

export default axios.create({ baseURL: env.DYNAMODB_DASHBOARD_API_URL });
