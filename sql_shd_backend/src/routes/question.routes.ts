import { Router, Request, Response } from 'express';
import { Question, Progress, CompetitionConfig } from '../models';
import { authenticate, optionalAuthenticate, apiRateLimiter } from '../middleware';
import { config } from '../config';
import { OneCompilerService } from '../services/OneCompilerService';

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
 * GET /api/questions
 * Get all questions (in team's shuffled order if authenticated)
 */
router.get('/', optionalAuthenticate, apiRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    let questions = await Question.find()
      .select('-expectedStdout -solutionSql') // Don't send solution sql
      .sort({ questionId: 1 });
    
    // If user is authenticated, return questions in their shuffled order
    if (req.user?.teamName) {
      const config = await CompetitionConfig.findById('global');
      if (config) {
        let progress = await Progress.findOne({
          teamName: req.user.teamName,
          competitionId: config._id
        });
        
        // If team has entered but doesn't have questionOrder (old record), generate it now
        if (progress && (!progress.questionOrder || progress.questionOrder.length === 0)) {
          const allQuestionIds = questions.map(q => q.questionId);
          const shuffled = shuffleArray(allQuestionIds);
          progress.questionOrder = shuffled;
          await progress.save();
        }
        
        // If team has entered and has a custom order, use it
        if (progress && progress.questionOrder && progress.questionOrder.length > 0) {
          // Reorder questions based on team's questionOrder
          const questionMap = new Map(questions.map(q => [q.questionId, q]));
          questions = progress.questionOrder
            .map(qId => questionMap.get(qId))
            .filter(q => q !== undefined) as any[];
        }
      }
    }
    
    res.json({
      success: true,
      questions: questions.map(q => ({
        questionId: q.questionId,
        title: q.title,
        description: q.description,
        setupSql: q.setupSql,  // Include setupSql for displaying tables
        starterSql: q.starterSql,
        dialect: q.dialect,
        difficulty: q.difficulty,
        points: q.points,
        constraints: q.constraints,
        expectedOutput: q.expectedOutput // Include expected output for display
      }))
    });
  } catch (error: any) {
    console.error('[GET /questions] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch questions',
      message: error.message
    });
  }
});

/**
 * GET /api/questions/:id
 * Get single question by ID
 */
router.get('/:id', optionalAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const question = await Question.findOne({ questionId: id })
      .select('-expectedStdout -solutionSql');
    
    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }
    
    res.json({
      success: true,
      question: {
        questionId: question.questionId,
        title: question.title,
        description: question.description,
        setupSql: question.setupSql,  // Include setupSql for displaying tables
        starterSql: question.starterSql,
        dialect: question.dialect,
        difficulty: question.difficulty,
        points: question.points,
        constraints: question.constraints,
        expectedOutput: question.expectedOutput // Include expected output
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to fetch question',
      message: error.message
    });
  }
});

/**
 * POST /api/questions (Admin only - for creating questions)
 * Create new question
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Allow admin-key header to authenticate admin actions
    const adminKeyHeader = req.headers['x-admin-key'];
    const providedAdminKey = Array.isArray(adminKeyHeader) ? adminKeyHeader[0] : adminKeyHeader;

    if (!providedAdminKey) {
      // No admin key provided - require JWT auth
      try {
        await new Promise<void>((resolve, reject) => {
          // reuse authenticate middleware
          // @ts-ignore
          authenticate(req as any, res as any, (err?: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } catch (err) {
        res.status(401).json({ error: 'No token provided' });
        return;
      }
    } else if (providedAdminKey !== config.admin.key) {
      // Admin key provided but invalid
      res.status(403).json({ error: 'Invalid admin key' });
      return;
    }

    const questionData = req.body;

    // Validate required fields
    if (!questionData.questionId || !questionData.title || !questionData.setupSql || !questionData.expectedOutput) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Auto-generate correct expectedStdout by executing the solution
    if (questionData.solutionSql && questionData.setupSql) {
      try {
        console.log(`[Question Create] Auto-generating expectedStdout for ${questionData.questionId}...`);
        
        // Execute solution to get actual stdout
        const result = await OneCompilerService.executeSql(
          questionData.setupSql,
          questionData.solutionSql,
          questionData.dialect || 'sqlite'
        );
        
        if (result.stdout) {
          questionData.expectedStdout = result.stdout;
          console.log(`[Question Create] ✓ Generated expectedStdout (${result.stdout.length} chars)`);
        }
        
        // Auto-generate expectedStdout for each test case
        if (questionData.testCases && Array.isArray(questionData.testCases)) {
          for (let i = 0; i < questionData.testCases.length; i++) {
            const testCase = questionData.testCases[i];
            if (testCase.setupSql && questionData.solutionSql) {
              try {
                const tcResult = await OneCompilerService.executeSql(
                  testCase.setupSql,
                  questionData.solutionSql,
                  questionData.dialect || 'sqlite'
                );
                
                if (tcResult.stdout) {
                  questionData.testCases[i].expectedStdout = tcResult.stdout;
                  console.log(`[Question Create] ✓ Generated expectedStdout for test case ${i + 1}`);
                }
              } catch (err) {
                console.warn(`[Question Create] Failed to generate stdout for test case ${i + 1}:`, err);
              }
            }
          }
        }
      } catch (err) {
        console.warn('[Question Create] Failed to auto-generate expectedStdout:', err);
        // Continue with user-provided expectedStdout as fallback
      }
    }

    const question = new Question(questionData);
    await question.save();

    res.status(201).json({
      success: true,
      question: {
        questionId: question.questionId,
        title: question.title
      }
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to create question',
      message: error.message
    });
  }
});

export default router;
