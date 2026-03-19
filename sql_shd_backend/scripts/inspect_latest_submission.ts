import mongoose from 'mongoose';
import { config } from '../src/config';
import { Submission } from '../src/models';

async function inspect(team = 'demo_team', questionId = 'q12') {
  await mongoose.connect(config.mongodb.uri);
  console.log('Connected to DB');
  const sub = await Submission.findOne({ teamName: team, questionId }).sort({ submittedAt: -1 }).lean();
  if (!sub) {
    console.log('No submission found for', team, questionId);
    process.exit(0);
  }
  console.log('Submission id:', sub._id.toString());
  console.log('Verdict:', sub.verdict);
  console.log('Judge message:', sub.judgeMessage);
  console.log('Execution summary:', {
    stdout: sub.execution?.stdout,
    stderr: sub.execution?.stderr,
    executionTimeMs: sub.execution?.executionTimeMs
  });
  console.log('\nTest case results:');
  const tcr = sub.execution?.testCaseResults || sub.testCaseResults || [];
  for (const [i, r] of (tcr as any[]).entries()) {
    console.log(`\n-- test #${i+1} hidden=${!!r.isHidden} --`);
    console.log('verdict:', r.verdict);
    console.log('message:', r.message);
    console.log('stdout:', r.stdout ? r.stdout.substring(0, 1000) : '');
    console.log('stderr:', r.stderr ? r.stderr.substring(0, 1000) : '');
    console.log('executionTimeMs:', r.executionTimeMs);
  }
  await mongoose.disconnect();
}

const team = process.argv[2] || 'demo_team';
const qId = process.argv[3] || 'q12';
inspect(team, qId).then(()=>process.exit(0)).catch(e=>{console.error(e); process.exit(1);});
