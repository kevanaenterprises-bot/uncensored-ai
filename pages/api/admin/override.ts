// pages/api/admin/override.ts

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: Override flagged response
  res.status(200).json({});
}