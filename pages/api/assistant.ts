// pages/api/assistant.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '../../lib/prisma';
import { checkQuota, updateUsage } from '../../lib/billingQuota';

interface AssistantRequest {
  prompt: string;
  maxTokens?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate user session
    const session = await getSession({ req });
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = session.user.id as string;

    // Parse and validate request body
    const { prompt, maxTokens = 1000 } = req.body as AssistantRequest;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Invalid prompt' });
    }

    if (prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt cannot be empty' });
    }

    // Get user's subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
      },
      orderBy: {
        currentPeriodEnd: 'desc',
      },
    });

    // Check quota
    const quotaCheck = checkQuota(subscription, maxTokens);
    if (!quotaCheck.allowed) {
      return res.status(403).json({ 
        error: quotaCheck.message,
        remaining: quotaCheck.remaining,
      });
    }

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      console.error('OpenAI API error:', error);
      return res.status(500).json({ error: 'Failed to generate response' });
    }

    const data = await openaiResponse.json();
    const completion = data.choices[0]?.message?.content;
    const tokensUsed = data.usage?.total_tokens || 0;

    // Update usage in database
    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { used: subscription.used + tokensUsed },
      });
    }

    // Log usage
    await prisma.usageLog.create({
      data: {
        userId,
        prompt,
        tokens: tokensUsed,
      },
    });

    return res.status(200).json({
      response: completion,
      tokensUsed,
      remaining: subscription ? (subscription.quota - subscription.used - tokensUsed) : 0,
    });
  } catch (error) {
    console.error('Assistant API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}