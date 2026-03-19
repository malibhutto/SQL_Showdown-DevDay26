import mongoose from 'mongoose';
import { Question } from '../models/Question';
import { config } from '../config';

async function fixM01() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB\n');

    const question = await Question.findOne({ questionId: 'm01' });
    
    if (!question) {
      console.log('Question m01 not found');
      return;
    }

    console.log('Current expectedStdout:');
    console.log('---');
    console.log(question.expectedStdout);
    console.log('---\n');

    // Fix the expectedStdout with proper ASCII table format
    const correctStdout = `┌────────────┐
│ citizen_id │
├────────────┤
│ 4          │
│ 7          │
└────────────┘
`;

    question.expectedStdout = correctStdout;

    // Fix test cases
    if (question.testCases && question.testCases.length > 0) {
      // Test case 1 - same as main
      question.testCases[0].expectedStdout = correctStdout;
      
      // Test case 2 - hidden test case with 10 and 30
      if (question.testCases.length > 1) {
        question.testCases[1].expectedStdout = `┌────────────┐
│ citizen_id │
├────────────┤
│ 10         │
│ 30         │
└────────────┘
`;
      }
    }

    await question.save();
    console.log('✓ Updated question m01 with correct expectedStdout format');
    console.log('\nNew expectedStdout:');
    console.log('---');
    console.log(question.expectedStdout);
    console.log('---');

    await mongoose.disconnect();
    console.log('\n✓ Done');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixM01();
