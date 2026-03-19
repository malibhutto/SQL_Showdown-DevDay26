import { Router, Request, Response } from 'express';
import { Submission, Progress, Question } from '../models';
import { authenticate } from '../middleware';
import { submitRateLimiter } from '../middleware';
import { SqlValidator } from '../utils/SqlValidator';
import { OneCompilerService } from '../services/OneCompilerService';
import { JudgeService } from '../services/JudgeService';

const router = Router();

/**
 * POST /api/submissions
 * Submit a solution for judging (alternative endpoint for frontend compatibility)
 */
router.post('/', authenticate, submitRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { questionId, content, language } = req.body;
    const teamName = req.user!.teamName;
    
    // Validate input
    if (!questionId || !content) {
      res.status(400).json({ 
        success: false,
        error: 'Question ID and content are required' 
      });
      return;
    }
    
    // Convert numeric questionId to string format
    const qId = typeof questionId === 'number' ? `q${questionId}` : questionId;
    
    // Get question
    const question = await Question.findOne({ questionId: qId });
    if (!question) {
      res.status(404).json({ 
        success: false,
        error: 'Question not found' 
      });
      return;
    }
    // debug logs removed
    
    // Only execute SQL if it's SQL content
    if (language === 'plaintext') {
      // Just store as a submission without execution
      const submission = new Submission({
        teamName,
        questionId: qId,
        submittedSql: content,
        verdict: 'Pending',
        judgeMessage: 'Plain text submission'
      });
      await submission.save();
      
      res.json({
        success: true,
        submissionId: submission._id.toString(),
        status: 'pending',
        message: 'Text submission saved'
      });
      return;
    }
    
    // Removed unused testCaseResults
    const maxLen = question?.constraints?.maxQueryLength ?? 10000;
    // Derive required tables from question.setupSql (look for CREATE TABLE names)
    const requiredTables: string[] = [];
    try {
      const createMatches = (question.setupSql || '').matchAll(/CREATE\s+TABLE\s+([`"]?)([a-zA-Z_][a-zA-Z0-9_]*)\1/ig);
      for (const m of createMatches) {
        if (m && m[2]) requiredTables.push(m[2]);
      }
    } catch { /* ignore */ }

    // Derive required columns from test cases (any expectedColumns across test cases)
    const requiredColumns: string[] = [];
    const allTestCases = Array.isArray(question.testCases) ? question.testCases : [];
    for (const tc of allTestCases) {
      if (Array.isArray(tc.expectedColumns)) {
        for (const c of tc.expectedColumns) {
          if (c && !requiredColumns.includes(c)) requiredColumns.push(c);
        }
      }
    }

    const validation = SqlValidator.validate(content, maxLen, requiredTables, requiredColumns);
    if (!validation.valid) {
      res.status(400).json({ 
        success: false,
        error: validation.error 
      });
      return;
    }
    
    // If testCases exist, judge against all (including hidden)
    let allPassed = true;
    let firstFailMessage = '';
    let testCaseResults: any[] = [];
    let firstResult: any = null;
    if (question.testCases && Array.isArray(question.testCases) && question.testCases.length > 0) {
      const { AsciiTableParser } = await import('../utils/AsciiTableParser');
      // judging submission
      for (const [idx, testCase] of question.testCases.entries()) {
        let resultForCase: any = null;
        try {
          resultForCase = await OneCompilerService.executeSql(
            testCase.setupSql,
            content,
            question.dialect
          );
        } catch (execErr: any) {
          const errMsg = execErr?.message || 'Execution failed';
          console.error('Execution error on testCase #'+(idx+1)+':', errMsg);
          // Record runtime error for this test case
          testCaseResults.push({
            verdict: 'Runtime Error',
            message: errMsg,
            isHidden: !!testCase.isHidden,
            stdout: '',
            stderr: errMsg,
            executionTimeMs: 0
          });
          allPassed = false;
          if (!firstFailMessage) firstFailMessage = errMsg;
          // continue to next test case (do not stop entire judging)
          continue;
        }

        if (!firstResult) firstResult = resultForCase;

        let judgeResult: any;
        if (testCase.expectedColumns && testCase.expectedRows) {
          // Parse actual output
          const actualParsed = AsciiTableParser.parse(resultForCase.stdout || '');
          // test case result (hidden=%s)

          // First do the structured table judging
          judgeResult = JudgeService.judgeTable(
            actualParsed,
            {
              type: 'table',
              columns: testCase.expectedColumns,
              rows: testCase.expectedRows,
              orderMatters: question.expectedOutput.orderMatters,
              caseSensitive: !!(testCase as any).caseSensitive,
              numericTolerance: (testCase as any).numericTolerance ?? 0
            }
          );

          // Extra strict checks: ensure parsed rows/columns exist and match expected counts
          const actualRows = Array.isArray(actualParsed?.rows) ? actualParsed.rows : [];
          const expectedRows = Array.isArray(testCase.expectedRows) ? testCase.expectedRows : [];
          if (actualRows.length !== expectedRows.length) {
            judgeResult = {
              verdict: 'Wrong Answer',
              message: `Row count mismatch: expected ${expectedRows.length}, got ${actualRows.length}`
            };
          } else {
            // also check column counts per row if rows exist
            if (expectedRows.length > 0 && actualRows.length > 0) {
              const expectedCols = expectedRows[0].length || 0;
              const actualCols = (actualRows[0] || []).length || 0;
              if (actualCols !== expectedCols) {
                judgeResult = {
                  verdict: 'Wrong Answer',
                  message: `Column count mismatch: expected ${expectedCols}, got ${actualCols}`
                };
              }
            }
          }
        } else {
          judgeResult = JudgeService.judgeByStdout(
            resultForCase.stdout,
            testCase.expectedStdout || '',
            resultForCase.stderr
          );
        }

        testCaseResults.push({
          verdict: judgeResult.verdict,
          message: judgeResult.message,
          isHidden: !!testCase.isHidden,
          stdout: resultForCase.stdout || '',
          stderr: resultForCase.stderr || '',
          executionTimeMs: resultForCase.executionTimeMs || 0
        });

        // test case verdict logged
        if (judgeResult.verdict !== 'Accepted' && allPassed) {
          allPassed = false;
          firstFailMessage = judgeResult.message || '';
        }
      }
    }

    // Use correct type for judgeResult
    type JudgeResultType = ReturnType<typeof JudgeService.judgeByStdout>;
    let judgeResult: JudgeResultType | undefined;
    let result: Awaited<ReturnType<typeof OneCompilerService.executeSql>> | undefined;
    if (!question.testCases || !Array.isArray(question.testCases) || question.testCases.length === 0) {
      // Legacy: single test case
      result = await OneCompilerService.executeSql(
        question.setupSql,
        content,
        question.dialect
      );
      judgeResult = JudgeService.judgeByStdout(
        result.stdout,
        question.expectedStdout || '',
        result.stderr
      );
    }

    // Save submission (use first test case's execution if available)
    const submission = new Submission({
      teamName,
      questionId: qId,
      submittedSql: content,
      execution: {
        stdout: firstResult ? firstResult.stdout : (result ? result.stdout : ''),
        stderr: firstResult ? firstResult.stderr : (result ? result.stderr : ''),
        executionTimeMs: firstResult ? firstResult.executionTimeMs : (result ? result.executionTimeMs : 0),
        memoryUsedKb: firstResult ? firstResult.memoryUsedKb : (result ? result.memoryUsedKb : 0),
        testCaseResults: testCaseResults
      },
      verdict: (question.testCases && question.testCases.length > 0)
        ? (allPassed ? 'Accepted' : 'Wrong Answer')
        : (judgeResult && judgeResult.verdict ? judgeResult.verdict : 'Wrong Answer'),
      judgeMessage: (question.testCases && question.testCases.length > 0)
        ? (allPassed ? 'Correct answer for all test cases!' : `Failed: ${firstFailMessage}`)
        : (judgeResult && judgeResult.message ? judgeResult.message : 'Judging error')
    });
    // saving submission testCaseResults
    await submission.save();

    // If accepted, award points
    let pointsAwarded = 0;
    let alreadySolved = false;
    const verdictAccepted = (question.testCases && question.testCases.length > 0)
      ? allPassed : (judgeResult && judgeResult.verdict === 'Accepted');
    if (verdictAccepted) {
      const points = question.points || 100;
      const execTime = result ? result.executionTimeMs : (firstResult ? firstResult.executionTimeMs : 0);
      const update = {
        $push: { solvedQuestions: {
          questionId: qId,
          solvedAt: new Date(),
          points,
          submissionId: submission._id,
          executionTimeMs: execTime
        }},
        $inc: { totalPoints: points },
        $set: { lastActivityAt: new Date() }
      };

      const updated = await Progress.findOneAndUpdate(
        { teamName, ended: false, 'solvedQuestions.questionId': { $ne: qId } },
        update,
        { new: true }
      );

      if (updated) {
        pointsAwarded = points;
      } else {
        alreadySolved = true;
      }
    }

    // Return response in format frontend expects
    res.json({
      success: true,
      submissionId: submission._id.toString(),
      status: ((question.testCases && question.testCases.length > 0)
        ? (allPassed ? 'accepted' : 'wrong_answer')
        : (judgeResult && judgeResult.verdict === 'Accepted' ? 'accepted' : judgeResult && judgeResult.verdict === 'Wrong Answer' ? 'wrong_answer' : 'error')),
      message: (question.testCases && question.testCases.length > 0)
        ? (allPassed ? 'Correct answer for all test cases!' : `Failed: ${firstFailMessage}`)
        : (judgeResult ? judgeResult.message : ''),
      score: pointsAwarded,
      alreadySolved
    });
  } catch (error: any) {
    console.error('Submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Submission failed',
      message: error.message
    });
  }
});

/**
 * GET /api/submissions
 * Get all submissions for the authenticated team
 */
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const teamName = req.user!.teamName;
    const { questionId, limit = 50 } = req.query;
    
    const query: any = { teamName };
    if (questionId) {
      query.questionId = questionId;
    }
    
    const submissions = await Submission.find(query)
      .sort({ submittedAt: -1 })
      .limit(Number(limit))
      .select('-submittedSql -execution.stdout -execution.stderr');
    
    // Get solved questions from active progress
    const progress = await Progress.findOne({
      teamName,
      ended: false
    });
    
    const solvedQuestionIds = progress 
      ? progress.solvedQuestions.map(q => q.questionId)
      : [];
    
    res.json({
      success: true,
      submissions,
      solvedQuestions: solvedQuestionIds,
      totalPoints: progress?.totalPoints || 0
    });
  } catch (error: any) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch submissions',
      message: error.message
    });
  }
});

/**
 * GET /api/submissions/question/:questionId
 * Get submissions for a specific question
 */
router.get('/question/:questionId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { questionId } = req.params;
    const teamName = req.user!.teamName;

    const submissions = await Submission.find({
      teamName,
      questionId
    })
      .sort({ submittedAt: -1 })
      .limit(10)
      .select('verdict submittedAt execution.executionTimeMs');

    // Check if solved
    const progress = await Progress.findOne({
      teamName,
      ended: false
    });

    const isSolved = progress?.solvedQuestions.some(q => q.questionId === questionId) || false;

    res.json({
      success: true,
      submissions,
      isSolved,
      submissionCount: submissions.length
    });
  } catch (error: any) {
    console.error('Get question submissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch submissions',
      message: error.message
    });
  }
});

/**
 * GET /api/submissions/:id
 * Get single submission details
 */
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const teamName = req.user!.teamName;

    const submission = await Submission.findOne({
      _id: id,
      teamName
    });

    if (!submission) {
      res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
      return;
    }

    res.json({
      success: true,
      submission
    });
  } catch (error: any) {
    console.error('Get submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch submission',
      message: error.message
    });
  }
});

export default router;
