import mongoose from 'mongoose';
import { Question } from '../models/Question';
import { config } from '../config';

async function testM01() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB\n');

    // Find the question
    const question = await Question.findOne({ questionId: 'm01' });
    
    if (!question) {
      console.log('Question with ID "m01" not found in database.');
      console.log('\nSearching for similar IDs...');
      const allQuestions = await Question.find({}).select('questionId title');
      console.log('All questions in database:');
      allQuestions.forEach(q => {
        console.log(`  - ${q.questionId}: ${q.title}`);
      });
    } else {
      console.log('Found question:');
      console.log('ID:', question.questionId);
      console.log('Title:', question.title);
      console.log('\nExpected Output Configuration:');
      console.log('Type:', question.expectedOutput.type);
      console.log('Columns:', question.expectedOutput.columns);
      console.log('Rows:', JSON.stringify(question.expectedOutput.rows, null, 2));
      console.log('Order Matters:', question.expectedOutput.orderMatters);
      console.log('Case Sensitive:', question.expectedOutput.caseSensitive);
      console.log('Numeric Tolerance:', question.expectedOutput.numericTolerance);
      
      console.log('\nExpected Stdout:');
      console.log('---');
      console.log(question.expectedStdout);
      console.log('---');
      
      console.log('\nSolution SQL:');
      console.log(question.solutionSql);
      
      if (question.testCases && question.testCases.length > 0) {
        console.log('\n\nTest Cases:');
        question.testCases.forEach((tc, idx) => {
          console.log(`\nTest Case #${idx + 1} (Hidden: ${tc.isHidden}):`);
          console.log('Expected Stdout:');
          console.log('---');
          console.log(tc.expectedStdout);
          console.log('---');
          if (tc.expectedRows) {
            console.log('Expected Rows:', JSON.stringify(tc.expectedRows, null, 2));
          }
        });
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testM01();
