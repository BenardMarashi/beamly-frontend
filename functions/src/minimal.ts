import { onRequest } from "firebase-functions/v2/https";

export const testMinimal = onRequest(
  {
    region: "us-central1",
    cors: true,
  },
  (_, response) => {
    response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  }
);