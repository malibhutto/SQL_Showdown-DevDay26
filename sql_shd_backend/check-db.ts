import mongoose from 'mongoose';
import { config } from './src/config';
import { Question } from './src/models';

async function check() {
  await mongoose.connect(config.mongodb.uri);
  const q = await Question.findOne({ questionId: 'q1' });
  console.log('Question q1:');
  console.log('setupSql exists:', !!q?.setupSql);
  console.log('setupSql length:', q?.setupSql?.length);
  console.log('setupSql sample:', q?.setupSql?.substring(0, 300));
  await mongoose.disconnect();
  process.exit(0);
}
check();
