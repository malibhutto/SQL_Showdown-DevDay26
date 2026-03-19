import mongoose from 'mongoose';
import { Question } from '../models/Question';
import { config } from '../config';
import { OneCompilerService } from '../services/OneCompilerService';

async function testAutoGeneration() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB\n');

    // Delete existing m01 if it exists
    await Question.deleteOne({ questionId: 'm01' });
    console.log('Deleted existing m01 question\n');

    // Simulate the admin panel payload (with plain text expectedStdout)
    const questionData = {
      "questionId": "m01",
      "title": "The Self-Watchers",
      "description": "Agent Veyron, something strange is happening in the Citizen Registry… Some citizens are repeatedly opening their own profiles, just like you keep checking your phone again and again to see if she finally sent a message… 📱💔 Spoiler alert: She didn't. She's busy viewing someone else's profile. But these self-watchers? They're stuck in a loop. Find all citizens who viewed their own profile. Bilkul waise jaise tum apni FAST registration portal refresh karte ho hoping ki classes change ho jayen... but they never do. 😭",
      "setupSql": "CREATE TABLE ProfileViews (view_id INTEGER PRIMARY KEY, citizen_id INTEGER, viewer_id INTEGER, view_date DATE);\nINSERT INTO ProfileViews VALUES (1,3,5,'2901-08-01'),(2,3,6,'2901-08-02'),(3,7,7,'2901-08-01'),(4,7,6,'2901-08-02'),(5,7,1,'2901-07-22'),(6,4,4,'2901-07-21'),(7,4,4,'2901-07-21');",
      "starterSql": "",
      "solutionSql": "SELECT DISTINCT citizen_id FROM ProfileViews WHERE citizen_id = viewer_id ORDER BY citizen_id;",
      "expectedStdout": "citizen_id\n4\n7\n",
      "dialect": "sqlite",
      "expectedOutput": {
        "type": "table",
        "columns": ["citizen_id"],
        "rows": [[4], [7]],
        "orderMatters": true,
        "caseSensitive": false,
        "numericTolerance": 0
      },
      "constraints": {
        "allowOnlySelect": true,
        "maxRows": 100,
        "maxQueryLength": 5000
      },
      "points": 10,
      "difficulty": "easy",
      "testCases": [
        {
          "setupSql": "CREATE TABLE ProfileViews (view_id INTEGER PRIMARY KEY, citizen_id INTEGER, viewer_id INTEGER, view_date DATE);\nINSERT INTO ProfileViews VALUES (1,3,5,'2901-08-01'),(2,3,6,'2901-08-02'),(3,7,7,'2901-08-01'),(4,7,6,'2901-08-02'),(5,7,1,'2901-07-22'),(6,4,4,'2901-07-21'),(7,4,4,'2901-07-21');",
          "expectedStdout": "citizen_id\n4\n7\n",
          "isHidden": false
        },
        {
          "setupSql": "CREATE TABLE ProfileViews (view_id INTEGER PRIMARY KEY, citizen_id INTEGER, viewer_id INTEGER, view_date DATE);\nINSERT INTO ProfileViews VALUES (1,10,10,'2901-01-01'),(2,20,30,'2901-01-02'),(3,30,30,'2901-01-03'),(4,40,50,'2901-01-04'),(5,50,60,'2901-01-05');",
          "expectedStdout": "citizen_id\n10\n30\n",
          "isHidden": true
        },
        {
          "setupSql": "CREATE TABLE ProfileViews (view_id INTEGER PRIMARY KEY, citizen_id INTEGER, viewer_id INTEGER, view_date DATE);\nINSERT INTO ProfileViews VALUES (1,5,10,'2901-02-01'),(2,10,20,'2901-02-02'),(3,15,25,'2901-02-03'),(4,20,30,'2901-02-04');",
          "expectedStdout": "citizen_id\n",
          "isHidden": true
        }
      ]
    };

    console.log('=== BEFORE AUTO-GENERATION ===');
    console.log('Main expectedStdout:', JSON.stringify(questionData.expectedStdout));
    console.log('Test case 1 expectedStdout:', JSON.stringify(questionData.testCases[0].expectedStdout));
    console.log('Test case 2 expectedStdout:', JSON.stringify(questionData.testCases[1].expectedStdout));
    console.log('Test case 3 expectedStdout:', JSON.stringify(questionData.testCases[2].expectedStdout));

    // Simulate the auto-generation logic
    console.log('\n=== AUTO-GENERATING expectedStdout ===\n');
    
    const result = await OneCompilerService.executeSql(
      questionData.setupSql,
      questionData.solutionSql,
      questionData.dialect
    );
    
    if (result.stdout) {
      questionData.expectedStdout = result.stdout;
      console.log('✓ Generated main expectedStdout');
    }
    
    // Generate for test cases
    for (let i = 0; i < questionData.testCases.length; i++) {
      const testCase = questionData.testCases[i];
      const tcResult = await OneCompilerService.executeSql(
        testCase.setupSql,
        questionData.solutionSql,
        questionData.dialect
      );
      
      if (tcResult.stdout) {
        questionData.testCases[i].expectedStdout = tcResult.stdout;
        console.log(`✓ Generated test case ${i + 1} expectedStdout`);
      }
    }

    console.log('\n=== AFTER AUTO-GENERATION ===');
    console.log('Main expectedStdout length:', questionData.expectedStdout.length);
    console.log('Main expectedStdout preview:', questionData.expectedStdout.substring(0, 50) + '...');
    console.log('\nTest case 1 expectedStdout length:', questionData.testCases[0].expectedStdout.length);
    console.log('Test case 2 expectedStdout length:', questionData.testCases[1].expectedStdout.length);
    console.log('Test case 3 expectedStdout length:', questionData.testCases[2].expectedStdout.length);

    // Save the question
    const question = new Question(questionData);
    await question.save();
    
    console.log('\n✓ Question saved to database');
    
    // Verify by fetching it back
    const saved = await Question.findOne({ questionId: 'm01' });
    console.log('\n=== VERIFICATION ===');
    console.log('Saved expectedStdout matches generated:', saved!.expectedStdout === questionData.expectedStdout);
    console.log('Test case 1 matches:', saved!.testCases![0].expectedStdout === questionData.testCases[0].expectedStdout);
    console.log('Test case 2 matches:', saved!.testCases![1].expectedStdout === questionData.testCases[1].expectedStdout);
    console.log('Test case 3 matches:', saved!.testCases![2].expectedStdout === questionData.testCases[2].expectedStdout);

    await mongoose.disconnect();
    console.log('\n✓ Done');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAutoGeneration();
