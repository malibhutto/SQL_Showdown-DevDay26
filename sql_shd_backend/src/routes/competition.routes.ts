import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Progress, Question, CompetitionConfig } from '../models';
import { authenticate, optionalAuthenticate, apiRateLimiter } from '../middleware';

const router = Router();

/**
 * Fisher-Yates shuffle algorithm
 * Randomly shuffles an array in place
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * GET /api/competition/config
 * Get global competition configuration (public - for countdown display)
 */
router.get('/config', apiRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await CompetitionConfig.findById('global');
    
    if (!config || !config.isActive) {
      res.json({
        success: true,
        configured: false,
        message: 'No competition scheduled'
      });
      return;
    }
    
    const now = Date.now();
    const startTime = config.startTime.getTime();
    const endTime = config.endTime.getTime();
    
    let status: 'upcoming' | 'active' | 'ended';
    let timeUntilStart = 0;
    let remainingTime = 0;
    
    if (now < startTime) {
      status = 'upcoming';
      timeUntilStart = startTime - now;
    } else if (now >= startTime && now < endTime) {
      status = 'active';
      remainingTime = endTime - now;
    } else {
      status = 'ended';
    }
    
    res.json({
      success: true,
      configured: true,
      competition: {
        name: config.competitionName,
        startTime: startTime,
        endTime: endTime,
        duration: config.duration,
        status,
        timeUntilStart,
        remainingTime,
        serverTime: now
      }
    });
  } catch (error: any) {
    console.error('Get competition config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get competition config',
      message: error.message
    });
  }
});

/**
 * POST /api/competition/enter
 * Enter the competition (only allowed after start time)
 */
router.post('/enter', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const teamName = req.user!.teamName;
    
    // Get global competition config
    const config = await CompetitionConfig.findById('global');
    
    if (!config || !config.isActive) {
      res.status(400).json({
        success: false,
        error: 'No competition scheduled',
        code: 'NO_COMPETITION'
      });
      return;
    }
    
    const now = Date.now();
    const startTime = config.startTime.getTime();
    const endTime = config.endTime.getTime();
    
    // Check if competition hasn't started yet
    if (now < startTime) {
      res.status(400).json({
        success: false,
        error: 'Competition has not started yet',
        code: 'NOT_STARTED',
        timeUntilStart: startTime - now,
        startTime: startTime
      });
      return;
    }
    
    // Check if competition has ended
    if (now >= endTime) {
      res.status(400).json({
        success: false,
        error: 'Competition has ended',
        code: 'ENDED',
        endTime: endTime
      });
      return;
    }
    
    // Check if team already has progress for this competition
    const existingProgress = await Progress.findOne({
      teamName,
      competitionId: config._id
    });
    
    if (existingProgress) {
      // Resume existing progress
      const questionsCount = await Question.countDocuments();
      
      res.json({
        success: true,
        resumed: true,
        competitionId: config._id,
        startTime: startTime,
        endTime: endTime,
        remainingTime: endTime - now,
        questionsCount,
        totalPoints: existingProgress.totalPoints,
        solvedQuestions: existingProgress.solvedQuestions.map(q => q.questionId),
        questionOrder: existingProgress.questionOrder, // Return team's shuffled order
        message: 'Resumed competition'
      });
      return;
    }
    
    // Get all questions and shuffle them for this team
    const allQuestions = await Question.find().select('questionId').sort({ questionId: 1 });
    const questionIds = allQuestions.map(q => q.questionId);
    const shuffledQuestionIds = shuffleArray(questionIds);
    
    const questionsCount = questionIds.length;
    
    // Create new progress for this team with shuffled question order
    const progress = new Progress({
      teamName,
      competitionId: config._id,
      startedAt: new Date(),
      duration: config.duration,
      totalPoints: 0,
      solvedQuestions: [],
      questionOrder: shuffledQuestionIds, // Store shuffled order
      ended: false
    });
    
    await progress.save();
    
    res.json({
      success: true,
      resumed: false,
      competitionId: config._id,
      startTime: startTime,
      endTime: endTime,
      remainingTime: endTime - now,
      questionsCount,
      totalPoints: 0,
      solvedQuestions: [],
      questionOrder: shuffledQuestionIds, // Return shuffled order
      message: 'Entered competition successfully'
    });
  } catch (error: any) {
    console.error('Enter competition error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enter competition',
      message: error.message
    });
  }
});

/**
 * GET /api/competition/state
 * Get current competition state for the authenticated team
 */
router.get('/state', authenticate, apiRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const teamName = req.user!.teamName;
    
    // Get global competition config
    const config = await CompetitionConfig.findById('global');
    
    if (!config || !config.isActive) {
      res.json({
        success: true,
        configured: false,
        message: 'No competition scheduled'
      });
      return;
    }
    
    const now = Date.now();
    const startTime = config.startTime.getTime();
    const endTime = config.endTime.getTime();
    
    // Get team's progress
    const progress = await Progress.findOne({
      teamName,
      competitionId: config._id
    });
    
    let status: 'upcoming' | 'active' | 'ended';
    if (now < startTime) {
      status = 'upcoming';
    } else if (now >= startTime && now < endTime) {
      status = 'active';
    } else {
      status = 'ended';
    }
    
    res.json({
      success: true,
      configured: true,
      competition: {
        name: config.competitionName,
        status,
        startTime: startTime,
        endTime: endTime,
        remainingTime: status === 'active' ? endTime - now : 0,
        timeUntilStart: status === 'upcoming' ? startTime - now : 0
      },
      participation: progress ? {
        entered: true,
        totalPoints: progress.totalPoints,
        solvedQuestions: progress.solvedQuestions.map(q => q.questionId),
        questionsCount: await Question.countDocuments()
      } : {
        entered: false
      }
    });
  } catch (error: any) {
    console.error('Get competition state error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get competition state',
      message: error.message
    });
  }
});

/**
 * GET /api/competition/progress
 * Get team's progress in the current competition
 */
router.get('/progress', authenticate, apiRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const teamName = req.user!.teamName;
    
    // Get global competition config
    const config = await CompetitionConfig.findById('global');
    
    if (!config || !config.isActive) {
      res.status(404).json({
        success: false,
        error: 'No active competition found'
      });
      return;
    }
    
    // Get team's progress
    const progress = await Progress.findOne({
      teamName,
      competitionId: config._id
    });
    
    if (!progress) {
      res.status(404).json({
        success: false,
        error: 'Team has not entered the competition'
      });
      return;
    }
    
    const questionsCount = await Question.countDocuments();
    
    res.json({
      success: true,
      progress: {
        teamName: progress.teamName,
        competitionId: progress.competitionId,
        totalPoints: progress.totalPoints,
        solvedQuestions: progress.solvedQuestions.map(q => ({
          questionId: q.questionId,
          points: q.points,
          solvedAt: q.solvedAt
        })),
        questionOrder: progress.questionOrder, // Include team's shuffled order
        questionsCount,
        startedAt: progress.startedAt,
        lastActivityAt: progress.lastActivityAt
      }
    });
  } catch (error: any) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get progress',
      message: error.message
    });
  }
});

/**
 * GET /api/competition/leaderboard
 * Get leaderboard for current competition
 */
router.get('/leaderboard', optionalAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    // Get global competition config
    const config = await CompetitionConfig.findById('global');
    
    if (!config) {
      res.json({
        success: true,
        leaderboard: [],
        message: 'No competition configured'
      });
      return;
    }
    
    // Get leaderboard for this competition
    const leaderboard = await Progress.aggregate([
      { $match: { competitionId: config._id } },
      {
        $project: {
          teamName: 1,
          totalPoints: 1,
          solvedCount: { $size: '$solvedQuestions' },
          lastActivityAt: 1
        }
      },
      { $sort: { totalPoints: -1, lastActivityAt: 1 } },
      { $limit: 50 }
    ]);
    
    res.json({
      success: true,
      leaderboard: leaderboard.map((entry, index) => ({
        rank: index + 1,
        teamName: entry.teamName,
        totalPoints: entry.totalPoints,
        questionsSolved: entry.solvedCount
      }))
    });
  } catch (error: any) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get leaderboard',
      message: error.message
    });
  }
});

export default router;
