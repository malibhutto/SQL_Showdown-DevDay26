import mongoose from 'mongoose';
import { Question } from '../models/Question';
import { config } from '../config';
import { OneCompilerService } from '../services/OneCompilerService';
import { AsciiTableParser } from '../utils/AsciiTableParser';
import { JudgeService } from '../services/JudgeService';

async function debugM01() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB\n');

    // Find the question
    const question = await Question.findOne({ questionId: 'm01' });
    
    if (!question) {
      console.log('Question not found');
      return;
    }

    console.log('Testing question:', question.title);
    console.log('Solution SQL:', question.solutionSql);
    console.log('\n=== TESTING MAIN TEST CASE ===\n');
    
    // Execute the solution
    const result = await OneCompilerService.executeSql(
      question.setupSql,
      question.solutionSql,
      question.dialect
    );

    console.log('Execution result:');
    console.log('- stdout length:', result.stdout?.length || 0);
    console.log('- stderr:', result.stderr || '(none)');
    
    console.log('\nRaw stdout (with visible special chars):');
    const stdoutWithChars = (result.stdout || '')
      .replace(/\n/g, '\\n\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    console.log('---');
    console.log(stdoutWithChars);
    console.log('---');
    
    console.log('\nExpected stdout (with visible special chars):');
    const expectedWithChars = (question.expectedStdout || '')
      .replace(/\n/g, '\\n\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    console.log('---');
    console.log(expectedWithChars);
    console.log('---');
    
    console.log('\n=== COMPARISON ===');
    console.log('Actual stdout bytes:', Buffer.from(result.stdout || '').toString('hex'));
    console.log('Expected stdout bytes:', Buffer.from(question.expectedStdout || '').toString('hex'));
    
    // Parse the output
    const parsed = AsciiTableParser.parse(result.stdout || '');
    console.log('\nParsed output:');
    console.log('- columns:', parsed.columns);
    console.log('- rows:', parsed.rows);
    
    console.log('\n=== JUDGE BY STDOUT ===');
    const judgeByStdout = JudgeService.judgeByStdout(
      result.stdout,
      question.expectedStdout,
      result.stderr
    );
    console.log('Verdict:', judgeByStdout.verdict);
    console.log('Message:', judgeByStdout.message);
    
    console.log('\n=== JUDGE BY TABLE ===');
    const judgeByTable = JudgeService.judgeTable(parsed, question.expectedOutput);
    console.log('Verdict:', judgeByTable.verdict);
    console.log('Message:', judgeByTable.message);
    if (judgeByTable.details) {
      console.log('Details:', judgeByTable.details);
    }
    
    // Test with testCase if exists
    if (question.testCases && question.testCases.length > 0) {
      console.log('\n=== TESTING FIRST TEST CASE ===\n');
      const testCase = question.testCases[0];
      
      const tcResult = await OneCompilerService.executeSql(
        testCase.setupSql,
        question.solutionSql,
        question.dialect
      );
      
      console.log('Test case stdout:');
      console.log('---');
      console.log(tcResult.stdout);
      console.log('---');
      
      console.log('\nTest case expected stdout:');
      console.log('---');
      console.log(testCase.expectedStdout);
      console.log('---');
      
      const tcJudge = JudgeService.judgeByStdout(
        tcResult.stdout,
        testCase.expectedStdout,
        tcResult.stderr
      );
      console.log('\nTest case verdict:', tcJudge.verdict);
      console.log('Test case message:', tcJudge.message);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugM01();
