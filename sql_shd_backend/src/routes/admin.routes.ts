import { Router, Request, Response } from 'express';
import { CompetitionConfig, Progress, Submission, User } from '../models';
import { authenticate } from '../middleware';

const router = Router();

// Admin secret key - in production, use a proper admin auth system
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin-secret-key-change-in-production';

/**
 * Middleware to verify admin access
 */
const verifyAdmin = (req: Request, res: Response, next: Function) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (!adminKey || adminKey !== ADMIN_SECRET) {
    res.status(403).json({ 
      success: false, 
      error: 'Unauthorized: Invalid admin key' 
    });
    return;
  }
  
  next();
};

/**
 * GET /api/admin/verify
 * Verify admin access key
 */
router.get('/verify', verifyAdmin, (req: Request, res: Response): void => {
  res.json({
    success: true,
    message: 'Admin access verified'
  });
});

/**
 * GET /api/admin/competition
 * Get current competition configuration (admin only)
 */
router.get('/competition', verifyAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await CompetitionConfig.findById('global');
    
    if (!config) {
      res.json({
        success: true,
        config: null,
        message: 'No competition configured yet'
      });
      return;
    }
    
    res.json({
      success: true,
      config: {
        competitionName: config.competitionName,
        startTime: config.startTime,
        endTime: config.endTime,
        duration: config.duration,
        isActive: config.isActive,
        maxTeams: config.maxTeams
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get competition config',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/competition
 * Create or update competition configuration (admin only)
 */
router.post('/competition', verifyAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { competitionName, startTime, duration, isActive, maxTeams } = req.body;
    
    // Validate required fields
    if (!startTime) {
      res.status(400).json({
        success: false,
        error: 'Start time is required'
      });
      return;
    }
    
    const startDate = new Date(startTime);
    if (isNaN(startDate.getTime())) {
      res.status(400).json({
        success: false,
        error: 'Invalid start time format'
      });
      return;
    }
    
    // Calculate end time based on duration (default 30 mins)
    const durationMs = duration || 30 * 60 * 1000;
    const endDate = new Date(startDate.getTime() + durationMs);
    
    // Update or create config using upsert
    const config = await CompetitionConfig.findByIdAndUpdate(
      'global',
      {
        _id: 'global',
        competitionName: competitionName || 'SQL Competition',
        startTime: startDate,
        endTime: endDate,
        duration: durationMs,
        isActive: isActive !== false, // default to true
        maxTeams: maxTeams || 100
      },
      { upsert: true, new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      config: {
        competitionName: config.competitionName,
        startTime: config.startTime,
        endTime: config.endTime,
        duration: config.duration,
        isActive: config.isActive,
        maxTeams: config.maxTeams
      },
      message: 'Competition configured successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to configure competition',
      message: error.message
    });
  }
});

/**
 * DELETE /api/admin/competition
 * Delete competition configuration (admin only)
 */
router.delete('/competition', verifyAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    await CompetitionConfig.deleteOne({ _id: 'global' });
    
    res.json({
      success: true,
      message: 'Competition configuration deleted'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete competition config',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/competition/reset
 * Reset all progress and submissions for a fresh competition (admin only)
 */
router.post('/competition/reset', verifyAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    // Delete all progress records
    const progressResult = await Progress.deleteMany({});
    
    // Delete all submissions
    const submissionResult = await Submission.deleteMany({});
    
    res.json({
      success: true,
      message: 'Competition reset successfully',
      deletedProgress: progressResult.deletedCount,
      deletedSubmissions: submissionResult.deletedCount
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to reset competition',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/teams
 * Get all registered teams (admin only)
 */
router.get('/teams', verifyAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const teams = await User.find({})
      .select('teamName isActive lastLogin createdAt')
      .sort({ createdAt: -1 });
    
    // Get progress for each team
    const teamsWithProgress = await Promise.all(
      teams.map(async (team) => {
        const progress = await Progress.findOne({ teamName: team.teamName })
          .sort({ startedAt: -1 });
        
        const submissionCount = await Submission.countDocuments({
          teamName: team.teamName
        });
        
        return {
          teamName: team.teamName,
          isActive: team.isActive,
          lastLogin: team.lastLogin,
          createdAt: team.createdAt,
          hasProgress: !!progress,
          totalPoints: progress?.totalPoints || 0,
          questionsSolved: progress?.solvedQuestions.length || 0,
          totalSubmissions: submissionCount
        };
      })
    );
    
    res.json({
      success: true,
      count: teams.length,
      teams: teamsWithProgress
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get teams',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/submissions
 * Get all submissions across all teams (admin only)
 */
router.get('/submissions', verifyAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamName, questionId, verdict, limit = 100 } = req.query;
    
    // Build filter
    const filter: any = {};
    if (teamName) filter.teamName = teamName;
    if (questionId) filter.questionId = questionId;
    if (verdict) filter.verdict = verdict;
    
    // Get submissions
    const submissions = await Submission.find(filter)
      .sort({ submittedAt: -1 })
      .limit(Number(limit))
      .select('teamName questionId content verdict judgeMessage submittedAt execution');
    
    res.json({
      success: true,
      count: submissions.length,
      submissions: submissions.map(s => ({
        id: s._id,
        teamName: s.teamName,
        questionId: s.questionId,
        verdict: s.verdict,
        message: s.judgeMessage,
        submittedAt: s.submittedAt,
        executionTimeMs: s.execution?.executionTimeMs,
        memoryUsedKb: s.execution?.memoryUsedKb
      }))
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get submissions',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/stats
 * GET /api/admin/statistics
 * Get competition statistics (admin only)
 */
router.get('/stats', verifyAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const [teamsCount, activeProgress, totalSubmissions] = await Promise.all([
      User.countDocuments(),
      Progress.countDocuments({ ended: false }),
      Submission.countDocuments()
    ]);
    
    // Get leaderboard
    const leaderboard = await Progress.aggregate([
      { $match: { ended: false } },
      { $sort: { totalPoints: -1 } },
      { $limit: 10 },
      {
        $project: {
          teamName: 1,
          totalPoints: 1,
          solvedCount: { $size: '$solvedQuestions' }
        }
      }
    ]);
    
    res.json({
      success: true,
      stats: {
        registeredTeams: teamsCount,
        activeParticipants: activeProgress,
        totalSubmissions,
        topTeams: leaderboard
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
      message: error.message
    });
  }
});

// Alias for /stats - just duplicate the handler
router.get('/statistics', verifyAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const [teamsCount, activeProgress, totalSubmissions] = await Promise.all([
      User.countDocuments(),
      Progress.countDocuments({ ended: false }),
      Submission.countDocuments()
    ]);
    
    // Get leaderboard
    const leaderboard = await Progress.aggregate([
      { $match: { ended: false } },
      { $sort: { totalPoints: -1 } },
      { $limit: 10 },
      {
        $project: {
          teamName: 1,
          totalPoints: 1,
          solvedCount: { $size: '$solvedQuestions' }
        }
      }
    ]);
    
    res.json({
      success: true,
      stats: {
        registeredTeams: teamsCount,
        activeParticipants: activeProgress,
        totalSubmissions,
        topTeams: leaderboard
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/results
 * Get final competition results with all team scores (admin only)
 * Returns teams sorted by score in descending order (highest first)
 * Use ?order=asc for ascending order (lowest first)
 */
router.get('/results', verifyAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { order = 'desc' } = req.query;
    const sortOrder = order === 'asc' ? 1 : -1;
    
    // Get competition config
    const config = await CompetitionConfig.findById('global');
    
    // Get all teams with their progress for this competition
    const results = await Progress.aggregate([
      // Match the current competition if exists
      ...(config ? [{ $match: { competitionId: config._id } }] : []),
      {
        $project: {
          teamName: 1,
          totalPoints: 1,
          solvedQuestions: 1,
          solvedCount: { $size: '$solvedQuestions' },
          startedAt: 1,
          lastActivityAt: 1
        }
      },
      // Sort by points (ascending or descending), then by lastActivityAt (earliest first if tied)
      { $sort: { totalPoints: sortOrder, lastActivityAt: 1 } }
    ]);
    
    // Get detailed submission info per team
    const detailedResults = await Promise.all(
      results.map(async (team, index) => {
        // Get submission count for this team
        const submissionCount = await Submission.countDocuments({
          teamName: team.teamName
        });
        
        // Get accepted submissions count
        const acceptedCount = await Submission.countDocuments({
          teamName: team.teamName,
          verdict: 'Accepted'
        });
        
        return {
          rank: sortOrder === -1 ? index + 1 : results.length - index,
          teamName: team.teamName,
          totalPoints: team.totalPoints,
          questionsSolved: team.solvedCount,
          totalSubmissions: submissionCount,
          acceptedSubmissions: acceptedCount,
          solvedQuestions: team.solvedQuestions.map((q: any) => ({
            questionId: q.questionId,
            points: q.points,
            solvedAt: q.solvedAt,
            executionTimeMs: q.executionTimeMs
          })),
          startedAt: team.startedAt,
          lastActivityAt: team.lastActivityAt
        };
      })
    );
    
    res.json({
      success: true,
      competition: config ? {
        name: config.competitionName,
        startTime: config.startTime,
        endTime: config.endTime,
        duration: config.duration
      } : null,
      totalTeams: results.length,
      sortOrder: order === 'asc' ? 'ascending' : 'descending',
      results: detailedResults
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get results',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/results/:teamName
 * Get detailed results for a specific team (admin only)
 */
router.get('/results/:teamName', verifyAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamName } = req.params;
    
    // Get team's progress
    const progress = await Progress.findOne({ teamName }).sort({ startedAt: -1 });
    
    if (!progress) {
      res.status(404).json({
        success: false,
        error: 'Team not found or has not participated'
      });
      return;
    }
    
    // Get all submissions for this team
    const submissions = await Submission.find({ teamName })
      .sort({ submittedAt: -1 })
      .select('questionId verdict judgeMessage submittedAt execution.executionTimeMs');
    
    res.json({
      success: true,
      team: {
        teamName: progress.teamName,
        totalPoints: progress.totalPoints,
        solvedQuestions: progress.solvedQuestions,
        startedAt: progress.startedAt,
        lastActivityAt: progress.lastActivityAt
      },
      submissions: submissions.map(s => ({
        questionId: s.questionId,
        verdict: s.verdict,
        message: s.judgeMessage,
        submittedAt: s.submittedAt,
        executionTimeMs: s.execution?.executionTimeMs
      })),
      totalSubmissions: submissions.length,
      acceptedSubmissions: submissions.filter(s => s.verdict === 'Accepted').length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get team results',
      message: error.message
    });
  }
});

export default router;
