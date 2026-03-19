import { Router, Request, Response } from 'express';
import { Question, Submission, Progress, CompetitionConfig } from '../models';
import { authenticate } from '../middleware';
import { runRateLimiter, submitRateLimiter } from '../middleware';
import { runSubmitCooldown } from '../middleware/cooldown';
import { SqlValidator } from '../utils/SqlValidator';
import { OneCompilerService } from '../services/OneCompilerService';
import { JudgeService } from '../services/JudgeService';

const router = Router();

/**
 * Middleware to check if competition is active
 */
const checkCompetitionActive = async (req: Request, res: Response, next: Function) => {
  try {
    const config = await CompetitionConfig.findById('global');
    
    if (!config || !config.isActive) {
      res.status(400).json({
        success: false,
        error: 'No competition is currently active',
        code: 'NO_COMPETITION'
      });
      return;
    }
    
    const now = Date.now();
    const startTime = config.startTime.getTime();
    const endTime = config.endTime.getTime();
    
    if (now < startTime) {
      res.status(400).json({
        success: false,
        error: 'Competition has not started yet',
        code: 'NOT_STARTED',
        timeUntilStart: startTime - now
      });
      return;
    }
    
    if (now >= endTime) {
      res.status(400).json({
        success: false,
        error: 'Competition has ended',
        code: 'ENDED'
      });
      return;
    }
    
    // Attach config to request for later use
    (req as any).competitionConfig = config;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check competition status'
    });
  }
};

/**
 * POST /api/run
 * Run SQL code without judging
 */
router.post('/', authenticate, checkCompetitionActive, runSubmitCooldown, runRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { questionId, sql } = req.body;
    const teamName = req.user!.teamName;
    
    // Validate input
    if (!questionId || !sql) {
      res.status(400).json({ error: 'Question ID and SQL are required' });
      return;
    }
    
    // Get question
    const question = await Question.findOne({ questionId });
    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    // Check if team already solved this question
    const config = (req as any).competitionConfig;
    if (teamName && config) {
      const prog = await Progress.findOne({ teamName, competitionId: config._id });
      if (prog && Array.isArray(prog.solvedQuestions) && prog.solvedQuestions.some((q: any) => q.questionId === questionId)) {
        res.status(400).json({ success: false, error: 'Question already solved', code: 'ALREADY_SOLVED' });
        return;
      }
    }
    
    // Validate SQL
    const validation = SqlValidator.validate(sql, question.constraints.maxQueryLength);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }
    
    // Execute SQL
    const result = await OneCompilerService.executeSql(
      question.setupSql,
      sql,
      question.dialect
    );
    
    // Return results without judging, but include expected output for comparison
    res.json({
      success: true,
      execution: {
        stdout: result.stdout,
        stderr: result.stderr,
        executionTimeMs: result.executionTimeMs,
        parsedOutput: result.parsedOutput
      },
      expectedOutput: question.expectedOutput ? {
        columns: question.expectedOutput.columns,
        rows: question.expectedOutput.rows
      } : null
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Execution failed',
      message: error.message
    });
  }
});

/**
 * POST /api/submit
 * Submit SQL code for judging
 */
router.post('/submit', authenticate, checkCompetitionActive, runSubmitCooldown, submitRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { questionId, sql } = req.body;
    const teamName = req.user!.teamName;
    const config = (req as any).competitionConfig;
    
    // Validate input
    if (!questionId || !sql) {
      res.status(400).json({ error: 'Question ID and SQL are required' });
      return;
    }
    
    // Get question
    const question = await Question.findOne({ questionId });
    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }
    
    // Verify team has entered the competition
    const progress = await Progress.findOne({
      teamName,
      competitionId: config._id
    });
    
    if (!progress) {
      res.status(400).json({
        success: false,
        error: 'You must enter the competition first',
        code: 'NOT_ENTERED'
      });
      return;
    }

    // If already solved, block submit
    if (Array.isArray(progress.solvedQuestions) && progress.solvedQuestions.some((q: any) => q.questionId === questionId)) {
      res.status(400).json({ success: false, error: 'Question already solved', code: 'ALREADY_SOLVED' });
      return;
    }
    
    // Validate SQL
    const validation = SqlValidator.validate(sql, question.constraints.maxQueryLength);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }
    
    // If the question has multiple test cases (visible + hidden), run each separately
    let judgeResult: any;
    let result: any = null;
    let testCaseResults: any[] = [];
    let submission: any = null;
    let allPassed = true;
    let firstFailMessage = '';

    if (question.testCases && Array.isArray(question.testCases) && question.testCases.length > 0) {
      const { AsciiTableParser } = await import('../utils/AsciiTableParser');
      for (const [idx, testCase] of question.testCases.entries()) {
        let resForCase: any = null;
        try {
          const startExec = Date.now();
          resForCase = await OneCompilerService.executeSql(testCase.setupSql, sql, question.dialect);
          const dur = Date.now() - startExec;
          if (dur > 500) {
            console.warn(`Slow execution for testCase #${idx + 1}: ${dur}ms`);
          }
        } catch (err: any) {
          const msg = err?.message || 'Execution failed';
          testCaseResults.push({ verdict: 'Runtime Error', message: msg, isHidden: !!testCase.isHidden, stdout: '', stderr: msg });
          allPassed = false;
          if (!firstFailMessage) firstFailMessage = msg;
          continue;
        }

        // keep first execution result for submission.execution summary
        if (!result) result = resForCase;

        // Judge
        let singleJudge: any;
        if (resForCase.stderr) {
          singleJudge = { verdict: 'Runtime Error', message: resForCase.stderr?.substring(0, 200) || 'Execution failed' };
        } else if (testCase.expectedColumns && testCase.expectedRows) {
          const actualParsed = AsciiTableParser.parse(resForCase.stdout || '');
          // Use main question.expectedOutput.orderMatters if testCase does not explicitly set it
          const orderMattersValue = typeof (testCase as any).orderMatters === 'boolean'
            ? (testCase as any).orderMatters
            : (question.expectedOutput ? question.expectedOutput.orderMatters : false);
          singleJudge = JudgeService.judgeTable(actualParsed, {
            type: 'table',
            columns: testCase.expectedColumns,
            rows: testCase.expectedRows,
            orderMatters: orderMattersValue,
            caseSensitive: !!(testCase as any).caseSensitive,
            numericTolerance: (testCase as any).numericTolerance ?? 0
          });

          // enforce row/col counts strictly
          const actualRows = Array.isArray(actualParsed.rows) ? actualParsed.rows : [];
          const expectedRows = Array.isArray(testCase.expectedRows) ? testCase.expectedRows : [];
          if (actualRows.length !== expectedRows.length) {
            singleJudge = { verdict: 'Wrong Answer', message: `Row count mismatch: expected ${expectedRows.length}, got ${actualRows.length}` };
          }
        } else {
          singleJudge = JudgeService.judgeByStdout(resForCase.stdout, testCase.expectedStdout || '', resForCase.stderr);
        }

        testCaseResults.push({
          verdict: singleJudge.verdict,
          message: singleJudge.message,
          isHidden: !!testCase.isHidden,
          stdout: resForCase.stdout || '',
          stderr: resForCase.stderr || '',
          executionTimeMs: resForCase.executionTimeMs || 0
        });

        if (singleJudge.verdict !== 'Accepted' && allPassed) {
          allPassed = false;
          firstFailMessage = singleJudge.message || '';
        }
      }

      // Final judge result
      judgeResult = allPassed ? { verdict: 'Accepted', message: 'Correct answer for all test cases!' } : { verdict: 'Wrong Answer', message: firstFailMessage };

      // Save submission including testCaseResults
      submission = new Submission({
        teamName,
        questionId,
        submittedSql: sql,
        execution: {
          stdout: result ? result.stdout : '',
          stderr: result ? result.stderr : '',
          executionTimeMs: result ? result.executionTimeMs : 0,
          memoryUsedKb: result ? result.memoryUsedKb : 0,
          testCaseResults: testCaseResults
        },
        verdict: judgeResult.verdict,
        judgeMessage: judgeResult.message
      });

      await submission.save();
    } else {
      // Single-run legacy behavior
      {
        const startExec = Date.now();
        result = await OneCompilerService.executeSql(question.setupSql, sql, question.dialect);
        const dur = Date.now() - startExec;
        if (dur > 500) console.warn(`Slow execution for question ${questionId}: ${dur}ms`);
      }
      if (result.stderr) {
        judgeResult = { verdict: 'Runtime Error', message: result.stderr?.substring(0,200) || 'Execution failed' };
      } else if (question.expectedOutput && result.parsedOutput) {
        judgeResult = JudgeService.judge(result.parsedOutput, question.expectedOutput, result.stderr);
      } else if (question.expectedStdout) {
        judgeResult = JudgeService.judgeByStdout(result.stdout, question.expectedStdout, result.stderr);
      } else {
        judgeResult = { verdict: 'Wrong Answer', message: 'No expected output configured for this question' };
      }

      submission = new Submission({
        teamName,
        questionId,
        submittedSql: sql,
        execution: {
          stdout: result.stdout,
          stderr: result.stderr,
          executionTimeMs: result.executionTimeMs,
          memoryUsedKb: result.memoryUsedKb
        },
        verdict: judgeResult.verdict,
        judgeMessage: judgeResult.message
      });

      await submission.save();
    }
    
    // If accepted, award points and mark as solved
    let pointsAwarded = 0;
    let alreadySolved = false;
    
    if (judgeResult.verdict === 'Accepted') {
      // Check if already solved
      const isSolved = progress.solvedQuestions.some(q => q.questionId === questionId);
      
      if (!isSolved) {
        // Award points based on question difficulty
        const points = question.points || 100;
        
        progress.solvedQuestions.push({
          questionId,
          solvedAt: new Date(),
          points,
          submissionId: submission._id,
          executionTimeMs: result.executionTimeMs || 0
        });
        progress.totalPoints += points;
        progress.lastActivityAt = new Date();
        
        await progress.save();
        
        pointsAwarded = points;
      } else {
        alreadySolved = true;
      }
    }
    
    // Return verdict
    // determine if any hidden test cases failed (if we collected testCaseResults)
    const hiddenFailed = Array.isArray((submission as any)?.execution?.testCaseResults)
      ? (submission as any).execution.testCaseResults.some((t: any) => t.isHidden && t.verdict !== 'Accepted')
      : false;

    res.json({
      success: true,
      verdict: judgeResult.verdict,
      message: judgeResult.message,
      details: judgeResult.details,
      execution: {
        executionTimeMs: result.executionTimeMs,
        parsedOutput: result.parsedOutput
      },
      expectedOutput: question.expectedOutput ? {
        columns: question.expectedOutput.columns,
        rows: question.expectedOutput.rows
      } : null,
      submissionId: submission._id,
      pointsAwarded,
      alreadySolved,
      hiddenFailed
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Submission failed',
      message: error.message
    });
  }
});

/**
 * GET /api/submissions
 * Get user's submissions
 */
router.get('/submissions', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const teamName = req.user!.teamName;
    const { questionId } = req.query;
    
    const query: any = { teamName };
    if (questionId) {
      query.questionId = questionId;
    }
    
    const submissions = await Submission.find(query)
      .sort({ submittedAt: -1 })
      .limit(50)
      .select('-submittedSql -execution.stdout -execution.stderr');
    
    res.json({
      success: true,
      submissions
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to fetch submissions',
      message: error.message
    });
  }
});

/**
 * GET /api/submissions/:id
 * Get single submission details
 */
router.get('/submissions/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const teamName = req.user!.teamName;
    
    const submission = await Submission.findOne({
      _id: id,
      teamName
    });
    
    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }
    
    res.json({
      success: true,
      submission
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to fetch submission',
      message: error.message
    });
  }
});

export default router;
