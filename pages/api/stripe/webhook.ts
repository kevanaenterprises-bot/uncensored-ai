// pages/api/stripe/webhook.ts

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: Verify Stripe webhook
  res.status(200).json({});
}