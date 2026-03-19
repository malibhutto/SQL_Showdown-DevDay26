import mongoose from 'mongoose';
import { Question } from '../models/Question';
import { config } from '../config';

async function deleteAndCheck() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB\n');

    // Delete existing m01
    const result = await Question.deleteOne({ questionId: 'm01' });
    console.log('Deleted m01:', result.deletedCount, 'document(s)');

    // Check all questions
    const allQuestions = await Question.find({}).select('questionId title');
    console.log('\nAll questions in database:');
    allQuestions.forEach(q => {
      console.log(`  - ${q.questionId}: ${q.title}`);
    });

    await mongoose.disconnect();
    console.log('\n✓ Done - Now you can create m01 via admin panel');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteAndCheck();
