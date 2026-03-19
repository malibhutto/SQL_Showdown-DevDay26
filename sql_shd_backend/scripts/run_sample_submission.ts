import mongoose from 'mongoose';
import { config } from '../src/config';
import { Question } from '../src/models';
import { OneCompilerService } from '../src/services/OneCompilerService';
import { JudgeService } from '../src/services/JudgeService';
import { AsciiTableParser } from '../src/utils/AsciiTableParser';

async function runSample(qId: string, userSql: string) {
  await mongoose.connect(config.mongodb.uri);
  console.log('Connected to DB');
  const question = await Question.findOne({ questionId: qId }).lean();
  if (!question) {
    console.error('Question not found', qId);
    process.exit(1);
  }

  const testCases = Array.isArray(question.testCases) ? question.testCases : [];
  console.log(`Loaded ${testCases.length} test cases (visible + hidden)`);

  for (const [i, tc] of testCases.entries()) {
    console.log(`\n--- Test case #${i+1} (hidden=${!!tc.isHidden}) ---`);
    console.log('Setup SQL:', tc.setupSql);
    try {
      const res = await OneCompilerService.executeSql(tc.setupSql || '', userSql, question.dialect);
      console.log('stdout:\n', res.stdout);
      console.log('stderr:\n', res.stderr);
      const parsed = res.parsedOutput ?? AsciiTableParser.parse(res.stdout || '');
      console.log('Parsed columns:', parsed.columns);
      console.log('Parsed rows:', parsed.rows);
      let judgeResult;
      if (tc.expectedColumns && tc.expectedRows) {
        judgeResult = JudgeService.judgeTable(parsed, {
          type: 'table',
          columns: tc.expectedColumns,
          rows: tc.expectedRows,
          orderMatters: !!(tc as any).orderMatters,
          caseSensitive: !!(tc as any).caseSensitive,
          numericTolerance: (tc as any).numericTolerance ?? 0
        });

        // extra strict check
        const actualRows = Array.isArray(parsed.rows) ? parsed.rows : [];
        const expectedRows = Array.isArray(tc.expectedRows) ? tc.expectedRows : [];
        if (actualRows.length !== expectedRows.length) {
          judgeResult = { verdict: 'Wrong Answer', message: `Row count mismatch: expected ${expectedRows.length}, got ${actualRows.length}` };
        }
      } else {
        judgeResult = JudgeService.judgeByStdout(res.stdout, tc.expectedStdout || '', res.stderr);
      }
      console.log('Judge result:', judgeResult);
    } catch (err: any) {
      console.error('Execution error:', err.message || err);
    }
  }

  await mongoose.disconnect();
}

const qId = process.argv[2] || 'q12';
const sql = process.argv.slice(3).join(' ') || "select name ,salary from employees where name = 'Carol'";
runSample(qId, sql).then(()=>process.exit(0)).catch(e=>{console.error(e); process.exit(1);});
