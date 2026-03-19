import mongoose from 'mongoose';
import { config } from '../config';
import { Question, User, Progress } from '../models';
import { OneCompilerService } from '../services/OneCompilerService';
import * as fs from 'fs';
import * as path from 'path';

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function seed() {
  try {
    console.log('🌱 Starting Chest 1 Questions Seed...');
    console.log('');

    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected to MongoDB');

    // Clear existing questions
    await Question.deleteMany({});
    console.log('✅ Cleared existing questions');

    // Read the JSON file
    const jsonPath = path.resolve(__dirname, '../../../CHEST_1_EASY_QUESTIONS.json');
    console.log(`📁 Reading from: ${jsonPath}`);
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`File not found: ${jsonPath}`);
    }

    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    const questions = JSON.parse(fileContent);
    
    console.log(`✅ Loaded ${questions.length} questions from JSON`);
    console.log('');
    console.log('🔄 Auto-generating expectedStdout for questions and test cases...');
    console.log('');

    // Auto-generate expectedStdout for each question and test case
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      // Generate main expectedStdout
      if (q.solutionSql && q.setupSql) {
        try {
          const result = await OneCompilerService.executeSql(
            q.setupSql,
            q.solutionSql,
            q.dialect || 'sqlite'
          );
          
          if (result.stdout) {
            q.expectedStdout = result.stdout;
            console.log(`  ✓ ${q.questionId}: Generated expectedStdout (${result.stdout.length} chars)`);
          }
        } catch (err: any) {
          console.warn(`  ⚠ ${q.questionId}: Failed to generate expectedStdout - ${err.message}`);
        }
      }
      
      // Generate expectedStdout for each test case
      if (q.testCases && Array.isArray(q.testCases)) {
        for (let j = 0; j < q.testCases.length; j++) {
          const testCase = q.testCases[j];
          if (testCase.setupSql && q.solutionSql) {
            try {
              const tcResult = await OneCompilerService.executeSql(
                testCase.setupSql,
                q.solutionSql,
                q.dialect || 'sqlite'
              );
              
              if (tcResult.stdout) {
                q.testCases[j].expectedStdout = tcResult.stdout;
                console.log(`    ✓ ${q.questionId} test case ${j + 1}: Generated expectedStdout`);
              }
            } catch (err: any) {
              console.warn(`    ⚠ ${q.questionId} test case ${j + 1}: Failed - ${err.message}`);
            }
          }
        }
      }
    }
    
    console.log('');
    console.log('� Randomizing question order...');
    const shuffledQuestions = shuffleArray(questions);
    console.log('✅ Questions shuffled for random insertion');
    
    console.log('');
    console.log('💾 Inserting questions into database...');

    // Insert questions directly (they already have the correct structure)
    await Question.insertMany(shuffledQuestions);
    console.log(`✅ Inserted ${shuffledQuestions.length} questions into database`);
    
    console.log('');
    console.log('📚 Questions Summary:');
    console.log('─'.repeat(60));
    
    const byDifficulty: Record<string, number> = {};
    let totalPoints = 0;
    
    questions.forEach((q: any) => {
      const difficulty = q.difficulty || 'unknown';
      byDifficulty[difficulty] = (byDifficulty[difficulty] || 0) + 1;
      totalPoints += q.points || 0;
      console.log(`  ✓ ${q.questionId.padEnd(4)} ${q.title.padEnd(40)} ${difficulty.padEnd(8)} ${q.points || 0} pts`);
    });
    
    console.log('─'.repeat(60));
    const difficultyStr = Object.entries(byDifficulty)
      .map(([diff, count]) => `${diff.charAt(0).toUpperCase() + diff.slice(1)}: ${count}`)
      .join(' | ');
    console.log(`  ${difficultyStr}`);
    console.log(`  Total: ${questions.length} questions, ${totalPoints} points`);
    console.log('');

    // Check if demo teams exist, create if not
    const existingTeams = await User.countDocuments();
    
    if (existingTeams === 0) {
      console.log('👥 Creating demo teams...');
      const teams = [
        { teamName: 'demo_team', password: 'demo123' },
        { teamName: 'team_alpha', password: 'sql123' },
        { teamName: 'team_beta', password: 'sql123' },
        { teamName: 'team_gamma', password: 'sql123' },
        { teamName: 'devsquad', password: 'sql123' }
      ];

      for (const team of teams) {
        await User.create({
          teamName: team.teamName,
          passwordHash: team.password,
          isActive: true
        });
      }
      console.log('✅ Created demo teams');
    } else {
      console.log(`ℹ️  ${existingTeams} teams already exist, skipping team creation`);
    }
    
    console.log('');
    console.log('🎉 Seed completed successfully!');
    console.log('');
    console.log('💡 Questions seeded (IDs: q01-q20) in RANDOM order');
    console.log('   • Tab 1 (q01-q07): Mostly Medium, 25-30 pts');
    console.log('   • Tab 2 (q08-q13): Medium/Hard, 30-50 pts');
    console.log('   • Tab 3 (q14-q20): Easy, 10-15 pts');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
