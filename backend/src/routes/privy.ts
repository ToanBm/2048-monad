import { Router, Request, Response } from 'express';

const router = Router();

// Get Privy config
router.get('/get-privy-config', (req: Request, res: Response) => {
  res.json({
    appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID
  });
});

export default router;
