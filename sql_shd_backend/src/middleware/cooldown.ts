import { Request, Response, NextFunction } from 'express';

// In-memory map of last action timestamps (ms) keyed by teamName or IP.
// Note: This is process-local. For multi-instance deployments use a shared store (Redis).
const lastActionMap: Map<string, number> = new Map();

const COOLDOWN_MS = 5 * 1000; // 5 seconds

export const runSubmitCooldown = (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = (req.user && (req.user as any).teamName) || req.ip || 'unknown';
    const now = Date.now();
    const last = lastActionMap.get(key) || 0;

    if (now - last < COOLDOWN_MS) {
      const waitMs = COOLDOWN_MS - (now - last);
      res.status(429).json({
        success: false,
        error: `Please wait ${Math.ceil(waitMs / 1000)} seconds before running or submitting again.`,
        retryAfterSeconds: Math.ceil(waitMs / 1000)
      });
      return;
    }

    // record this action timestamp and proceed
    lastActionMap.set(key, now);
    next();
  } catch (err) {
    // fail-open: do not block on middleware errors
    next();
  }
};

// Helper to inspect remaining cooldown for a given key (used by clients optionally)
export const getRemainingCooldownForKey = (key: string): number => {
  const last = lastActionMap.get(key) || 0;
  const now = Date.now();
  const rem = COOLDOWN_MS - (now - last);
  return rem > 0 ? rem : 0;
};

export default runSubmitCooldown;
