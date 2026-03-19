import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Progress, Question, Submission } from '../models';

/**
 * Start a new competition for the team
 */
export const startCompetition = async (req: Request, res: Response): Promise<void> => {
  try {
    const teamName = req.user!.teamName;
    const { duration = 30 } = req.body; // duration in minutes, default 30

    // Check if team has an active competition
    const existingProgress = await Progress.findOne({
      teamName,
      ended: false
    });

    if (existingProgress) {
      const elapsed = Date.now() - existingProgress.startedAt.getTime();
      const remaining = existingProgress.duration - elapsed;

      if (remaining > 0) {
        // Return existing competition
        res.json({
          success: true,
          competitionId: existingProgress.competitionId,
          startTime: existingProgress.startedAt.getTime(),
          duration: existingProgress.duration,
          questionsCount: await Question.countDocuments(),
          totalPoints: existingProgress.totalPoints,
          solvedQuestions: existingProgress.solvedQuestions.map(q => q.questionId),
          message: 'Resuming existing competition'
        });
        return;
      } else {
        // Mark as ended
        existingProgress.ended = true;
        await existingProgress.save();
      }
    }

    // Get question count
    const questionsCount = await Question.countDocuments();

    // Create new competition
    const competitionId = uuidv4();
    const durationMs = duration * 60 * 1000;

    const progress = new Progress({
      teamName,
      competitionId,
      startedAt: new Date(),
      duration: durationMs,
      totalPoints: 0,
      solvedQuestions: [],
      ended: false
    });

    await progress.save();

    res.json({
      success: true,
      competitionId,
      startTime: progress.startedAt.getTime(),
      duration: durationMs,
      questionsCount,
      totalPoints: 0,
      solvedQuestions: [],
      message: 'Competition started'
    });
  } catch (error: any) {
    console.error('Start competition error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start competition',
      message: error.message
    });
  }
};

/**
 * Get current competition state for the team
 */
export const getCompetitionState = async (req: Request, res: Response): Promise<void> => {
  try {
    const teamName = req.user!.teamName;

    // Find active competition
    const progress = await Progress.findOne({
      teamName,
      ended: false
    }).sort({ startedAt: -1 });

    if (!progress) {
      res.json({
        success: true,
        active: false,
        message: 'No active competition'
      });
      return;
    }

    // Check if expired
    const elapsed = Date.now() - progress.startedAt.getTime();
    const remaining = progress.duration - elapsed;

    if (remaining <= 0) {
      progress.ended = true;
      await progress.save();

      res.json({
        success: true,
        active: false,
        ended: true,
        totalPoints: progress.totalPoints,
        solvedQuestions: progress.solvedQuestions.map(q => q.questionId),
        message: 'Competition has ended'
      });
      return;
    }

    res.json({
      success: true,
      active: true,
      competitionId: progress.competitionId,
      startTime: progress.startedAt.getTime(),
      duration: progress.duration,
      remainingTime: remaining,
      totalPoints: progress.totalPoints,
      solvedQuestions: progress.solvedQuestions.map(q => q.questionId),
      questionsCount: await Question.countDocuments()
    });
  } catch (error: any) {
    console.error('Get competition state error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get competition state',
      message: error.message
    });
  }
};

/**
 * End the current competition
 */
export const endCompetition = async (req: Request, res: Response): Promise<void> => {
  try {
    const teamName = req.user!.teamName;

    const progress = await Progress.findOne({
      teamName,
      ended: false
    });

    if (!progress) {
      res.status(404).json({
        success: false,
        error: 'No active competition found'
      });
      return;
    }

    progress.ended = true;
    progress.lastActivityAt = new Date();
    await progress.save();

    res.json({
      success: true,
      message: 'Competition ended',
      totalPoints: progress.totalPoints,
      solvedQuestions: progress.solvedQuestions.length
    });
  } catch (error: any) {
    console.error('End competition error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end competition',
      message: error.message
    });
  }
};

/**
 * Get leaderboard data
 */
export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get all progress records, sorted by points and completion time
    const allProgress = await Progress.find({})
      .sort({ totalPoints: -1, lastActivityAt: 1 });

    // Group by team and get best result
    const teamBest = new Map<string, any>();
    
    for (const progress of allProgress) {
      const existing = teamBest.get(progress.teamName);
      if (!existing || progress.totalPoints > existing.totalPoints) {
        teamBest.set(progress.teamName, {
          teamName: progress.teamName,
          totalPoints: progress.totalPoints,
          solvedCount: progress.solvedQuestions.length,
          lastActivityAt: progress.lastActivityAt,
          ended: progress.ended
        });
      }
    }

    const leaderboard = Array.from(teamBest.values())
      .sort((a, b) => {
        // Sort by points descending
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        // Then by solved count descending
        if (b.solvedCount !== a.solvedCount) {
          return b.solvedCount - a.solvedCount;
        }
        // Then by last activity ascending (earlier is better)
        return new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime();
      })
      .map((team, index) => ({
        rank: index + 1,
        ...team
      }));

    res.json({
      success: true,
      leaderboard
    });
  } catch (error: any) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get leaderboard',
      message: error.message
    });
  }
};

/**
 * Get submission status for polling
 */
export const getSubmissionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const teamName = req.user!.teamName;
    const { questionId, submissionId } = req.query;

    let query: any = { teamName };
    
    if (submissionId) {
      query._id = submissionId;
    } else if (questionId) {
      query.questionId = questionId;
    }

    const submission = await Submission.findOne(query)
      .sort({ submittedAt: -1 });

    if (!submission) {
      res.status(404).json({
        success: false,
        error: 'No submission found'
      });
      return;
    }

    res.json({
      success: true,
      status: submission.verdict.toLowerCase(),
      verdict: submission.verdict,
      message: submission.judgeMessage,
      submittedAt: submission.submittedAt
    });
  } catch (error: any) {
    console.error('Get submission status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get submission status',
      message: error.message
    });
  }
};
