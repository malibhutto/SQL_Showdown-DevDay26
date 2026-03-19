import { SqlValidator } from '../src/utils/SqlValidator';

function test(sql: string, requiredTables: string[] = [], requiredColumns: string[] = []) {
  const res = SqlValidator.validate(sql, 1000, requiredTables, requiredColumns);
  console.log('SQL:', sql);
  console.log('Required tables:', requiredTables, 'Required cols:', requiredColumns);
  console.log('Result:', res);
  console.log('---');
}

(async function run() {
  // Scenario: q12 (Employees, salary)
  const reqTables = ['Employees'];
  const reqCols = ['salary'];

  test("SELECT 90000;", reqTables, reqCols); // trivial constant - should be blocked
  test("SELECT '90000';", reqTables, reqCols); // trivial string - blocked
  test("SELECT salary FROM Employees WHERE salary = 90000;", reqTables, reqCols); // valid
  test("SELECT salary FROM OtherTable WHERE salary = 90000;", reqTables, reqCols); // wrong table - blocked
  test("SELECT 90000 as salary FROM Employees;", reqTables, reqCols); // literal with FROM Employees - should be blocked by trivial detection
  test("SELECT e.salary FROM Employees e ORDER BY e.salary DESC LIMIT 1;", reqTables, reqCols); // valid
  test("WITH t AS (SELECT salary FROM Employees) SELECT * FROM t;", reqTables, reqCols); // valid
})();
