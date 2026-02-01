// pages/api/admin/create-admin.ts

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: Seed initial admin user
  res.status(200).json({});
}