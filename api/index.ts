import type { VercelRequest, VercelResponse } from "@vercel/node";

import { initializeApp } from "../src/index";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await initializeApp();

  return app(req, res);
}
