import axios from 'axios';

async function testAdminCreate() {
  try {
    // First, delete the existing m01 question
    console.log('Testing admin panel question creation with auto-generation...\n');

    const questionPayload = {
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

    console.log('Payload before sending:');
    console.log('- Main expectedStdout:', JSON.stringify(questionPayload.expectedStdout));
    console.log('- Test case 1 expectedStdout:', JSON.stringify(questionPayload.testCases[0].expectedStdout));

    // Send request with admin key
    const response = await axios.post('http://localhost:5001/api/questions', questionPayload, {
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': '12345' // Replace with your actual admin key
      }
    });

    console.log('\n✓ Question created successfully!');
    console.log('Response:', response.data);

    // Now fetch it back to verify
    console.log('\nFetching question back from database...');
    const getResponse = await axios.get('http://localhost:5001/api/questions/m01');
    
    console.log('\n=== VERIFICATION ===');
    console.log('Question found:', !!getResponse.data.question);
    console.log('Title:', getResponse.data.question?.title);

  } catch (error: any) {
    if (error.response) {
      console.error('❌ Error creating question:');
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testAdminCreate();
