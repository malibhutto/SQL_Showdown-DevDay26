import { Request, Response } from 'express';
import { Question, Submission, Progress } from '../models';
import { SqlValidator } from '../utils/SqlValidator';
import { OneCompilerService } from '../services/OneCompilerService';
import { JudgeService } from '../services/JudgeService';

// Expected tabular outputs for more reliable matching (similar to reference codebase)
// This allows comparison against actual stdout for better accuracy
const tabularAnswers: Record<string, string> = {
  // Will be populated based on questions
};

/**
 * Run SQL code without judging
 */
export const runQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { questionId, sql } = req.body;

    // Validate input
    if (!questionId || !sql) {
      res.status(400).json({ 
        success: false,
        error: 'Question ID and SQL are required' 
      });
      return;
    }

    // Get question
    const question = await Question.findOne({ questionId });
    if (!question) {
      res.status(404).json({ 
        success: false,
        error: 'Question not found' 
      });
      return;
    }

    // Validate SQL
    const validation = SqlValidator.validate(sql, question.constraints.maxQueryLength);
    if (!validation.valid) {
      res.status(400).json({ 
        success: false,
        error: validation.error 
      });
      return;
    }

    // Execute SQL
    const result = await OneCompilerService.executeSql(
      question.setupSql,
      sql,
      question.dialect
    );

    // Return results without judging, including expected output
    res.json({
      success: true,
      execution: {
        stdout: result.stdout,
        stderr: result.stderr,
        executionTimeMs: result.executionTimeMs,
        parsedOutput: result.parsedOutput
      },
      expectedOutput: question.expectedOutput
    });
  } catch (error: any) {
    console.error('Run query error:', error);
    res.status(500).json({
      success: false,
      error: 'Execution failed',
      message: error.message
    });
  }
};

/**
 * Submit SQL code for judging
 */
export const submitQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { questionId, sql } = req.body;
    const teamName = req.user!.teamName;

    // Validate input
    if (!questionId || !sql) {
      res.status(400).json({ 
        success: false,
        error: 'Question ID and SQL are required' 
      });
      return;
    }

    // Get question
    const question = await Question.findOne({ questionId });
    if (!question) {
      res.status(404).json({ 
        success: false,
        error: 'Question not found' 
      });
      return;
    }

    // Validate SQL
    const validation = SqlValidator.validate(sql, question.constraints.maxQueryLength);
    if (!validation.valid) {
      res.status(400).json({ 
        success: false,
        error: validation.error 
      });
      return;
    }

    // Execute SQL
    const result = await OneCompilerService.executeSql(
      question.setupSql,
      sql,
      question.dialect
    );

    // Judge the result using STDOUT comparison (cleaner approach)
    let judgeResult;
    
    if (question.expectedStdout) {
      // Use stdout-based comparison (preferred)
      judgeResult = JudgeService.judgeByStdout(
        result.stdout,
        question.expectedStdout,
        result.stderr
      );
    } else if (!result.parsedOutput) {
      // Fallback: no parsed output
      judgeResult = {
        verdict: 'Runtime Error' as const,
        message: result.stderr || 'Failed to parse output'
      };
    } else {
      // Legacy: parsed output comparison
      judgeResult = JudgeService.judge(
        result.parsedOutput,
        question.expectedOutput,
        result.stderr
      );
    }

    // Save submission
    const submission = new Submission({
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

    // If accepted, award points and mark as solved
    let pointsAwarded = 0;
    let alreadySolved = false;

    if (judgeResult.verdict === 'Accepted') {
      // Find or check active progress
      const progress = await Progress.findOne({
        teamName,
        ended: false
      });

      if (progress) {
        // Check if already solved
        const isSolved = progress.solvedQuestions.some(q => q.questionId === questionId);

        if (!isSolved) {
          // Award points based on question
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
          
          console.log(`✅ Team ${teamName} solved ${questionId} - awarded ${points} points (total: ${progress.totalPoints})`);
        } else {
          alreadySolved = true;
        }
      }
    }

    // Return verdict
    res.json({
      success: true,
      verdict: judgeResult.verdict,
      message: judgeResult.message,
      details: judgeResult.details,
      execution: {
        executionTimeMs: result.executionTimeMs,
        parsedOutput: result.parsedOutput
      },
      expectedOutput: question.expectedOutput,
      submissionId: submission._id,
      pointsAwarded,
      alreadySolved
    });
  } catch (error: any) {
    console.error('Submit query error:', error);
    res.status(500).json({
      success: false,
      error: 'Submission failed',
      message: error.message
    });
  }
};

/**
 * Get user's submissions
 */
export const getSubmissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const teamName = req.user!.teamName;
    const { questionId, limit = 10 } = req.query;

    let query: any = { teamName };
    if (questionId) {
      query.questionId = questionId;
    }

    const submissions = await Submission.find(query)
      .sort({ submittedAt: -1 })
      .limit(Number(limit))
      .select('-submittedSql -execution.stdout'); // Don't send full SQL back for security

    res.json({
      success: true,
      submissions: submissions.map(s => ({
        id: s._id,
        questionId: s.questionId,
        verdict: s.verdict,
        message: s.judgeMessage,
        executionTimeMs: s.execution?.executionTimeMs,
        submittedAt: s.submittedAt
      }))
    });
  } catch (error: any) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get submissions',
      message: error.message
    });
  }
};

/**
 * Get all questions
 */
export const getQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const teamName = req.user?.teamName;
    
    const questions = await Question.find({})
      .select('questionId title description difficulty points starterSql setupSql dialect expectedOutput')
      .sort({ questionId: 1 });

    // Get solved questions for this team if authenticated
    let solvedQuestionIds: string[] = [];
    if (teamName) {
      const progress = await Progress.findOne({ teamName, ended: false });
      if (progress) {
        solvedQuestionIds = progress.solvedQuestions.map(q => q.questionId);
      }
    }

    res.json({
      success: true,
      questions: questions.map(q => ({
        questionId: q.questionId,
        title: q.title,
        description: q.description,
        difficulty: q.difficulty,
        points: q.points,
        starterSql: q.starterSql,
        setupSql: q.setupSql,
        dialect: q.dialect,
        expectedOutput: q.expectedOutput,
        solved: solvedQuestionIds.includes(q.questionId)
      }))
    });
  } catch (error: any) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get questions',
      message: error.message
    });
  }
};

/**
 * Get single question by ID
 */
export const getQuestionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const questionId = id.startsWith('q') ? id : `q${id}`;
    
    const question = await Question.findOne({ questionId });

    if (!question) {
      res.status(404).json({
        success: false,
        error: 'Question not found'
      });
      return;
    }

    // Check if solved by current team
    let solved = false;
    if (req.user?.teamName) {
      const progress = await Progress.findOne({ 
        teamName: req.user.teamName, 
        ended: false 
      });
      if (progress) {
        solved = progress.solvedQuestions.some(q => q.questionId === questionId);
      }
    }

    res.json({
      success: true,
      question: {
        id: parseInt(question.questionId.replace('q', '')),
        questionId: question.questionId,
        title: question.title,
        description: question.description,
        difficulty: question.difficulty,
        points: question.points,
        starterSql: question.starterSql,
        dialect: question.dialect,
        constraints: question.constraints,
        expectedOutput: question.expectedOutput,
        solved
      }
    });
  } catch (error: any) {
    console.error('Get question error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get question',
      message: error.message
    });
  }
};
