import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function run() {
  const API_BASE = process.env.LOCAL_API_BASE || 'http://localhost:5001/api';
  const ADMIN_KEY = process.env.ADMIN_SECRET || '12345';

  const payload = {
    questionId: 'q19',
    title: 'The Self-Watchers',
    description: "Some citizens are viewing their own profiles due to a glitch. Return the distinct citizen_id values for citizens who viewed their own profile (rows where citizen_id = viewer_id).",
    setupSql: "CREATE TABLE IF NOT EXISTS ProfileViews (view_id INTEGER PRIMARY KEY, citizen_id INTEGER, viewer_id INTEGER, view_date DATE);\nINSERT INTO ProfileViews(view_id, citizen_id, viewer_id, view_date) VALUES\n(1, 3, 5, '2901-08-01'),(2, 3, 6, '2901-08-02'),(3, 7, 7, '2901-08-01'),(4, 7, 6, '2901-08-02'),(5, 7, 1, '2901-07-22'),(6, 4, 4, '2901-07-21'),(7, 4, 4, '2901-07-21');",
    starterSql: '',
    solutionSql: 'SELECT DISTINCT citizen_id FROM ProfileViews WHERE citizen_id = viewer_id ORDER BY citizen_id;',
    expectedStdout: 'citizen_id\n4\n7\n',
    dialect: 'sqlite',
    expectedOutput: {
      type: 'table',
      columns: ['citizen_id'],
      rows: [[4], [7]],
      orderMatters: false,
      caseSensitive: false,
      numericTolerance: 0
    },
    constraints: {
      allowOnlySelect: true,
      maxRows: 100,
      maxQueryLength: 5000
    },
    points: 10,
    difficulty: 'easy',
    testCases: [
      {
        setupSql: "CREATE TABLE IF NOT EXISTS ProfileViews(view_id INTEGER PRIMARY KEY, citizen_id INTEGER, viewer_id INTEGER, view_date DATE);",
        expectedStdout: 'citizen_id\n4\n7\n',
        isHidden: false
      }
      ,
      {
        // Hidden test 1
        setupSql: "CREATE TABLE IF NOT EXISTS ProfileViews(view_id INTEGER PRIMARY KEY, citizen_id INTEGER, viewer_id INTEGER, view_date DATE);\nINSERT INTO ProfileViews(view_id, citizen_id, viewer_id, view_date) VALUES (1,10,10,'2901-01-01'),(2,20,30,'2901-01-02'),(3,30,30,'2901-01-03');",
        expectedStdout: 'citizen_id\n10\n30\n',
        isHidden: true
      },
      {
        // Hidden test 2
        setupSql: "CREATE TABLE IF NOT EXISTS ProfileViews(view_id INTEGER PRIMARY KEY, citizen_id INTEGER, viewer_id INTEGER, view_date DATE);\nINSERT INTO ProfileViews(view_id, citizen_id, viewer_id, view_date) VALUES (1,5,10,'2901-02-01'),(2,10,20,'2901-02-02');",
        expectedStdout: 'citizen_id\n',
        isHidden: true
      }
    ]
  };

  try {
    console.log(`POSTing to ${API_BASE}/questions using x-admin-key=${ADMIN_KEY}`);
    const res = await axios.post(`${API_BASE}/questions`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_KEY
      },
      timeout: 10000
    });

    console.log('Status:', res.status);
    console.log('Response data:', JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    if (err.response) {
      console.error('Request failed with status', err.response.status);
      console.error('Response body:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Request error:', err.message || err);
    }
    process.exit(1);
  }
}

run().then(() => process.exit(0));
