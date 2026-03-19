import mongoose from 'mongoose';
import { config } from '../config';
import { Question, User, Progress } from '../models';
import { OneCompilerService } from '../services/OneCompilerService';
import { AsciiTableParser } from '../utils/AsciiTableParser';

interface ParsedOutput {
  stdout: string;
  columns: string[];
  rows: (string | number | null)[][];
}

// Comprehensive SQL Questions covering various topics
const sampleQuestions = [
  // ============ BASIC SELECT & WHERE ============
  {
    questionId: 'q1',
    title: 'Filter by Condition',
    description: `Find all products with price greater than 100. Return product_name and price, ordered by price ascending.`,
    setupSql: `
CREATE TABLE Products (
  id INTEGER PRIMARY KEY,
  product_name TEXT NOT NULL,
  category TEXT,
  price REAL,
  stock INTEGER
);

INSERT INTO Products VALUES
  (1, 'Laptop', 'Electronics', 999.99, 50),
  (2, 'Mouse', 'Electronics', 29.99, 200),
  (3, 'Keyboard', 'Electronics', 79.99, 150),
  (4, 'Monitor', 'Electronics', 299.99, 75),
  (5, 'Headphones', 'Electronics', 149.99, 100),
  (6, 'USB Cable', 'Accessories', 9.99, 500),
  (7, 'Webcam', 'Electronics', 89.99, 80),
  (8, 'Desk Lamp', 'Office', 45.99, 120);
    `.trim(),
    starterSql: '-- Find products with price > 100\n-- Return product_name, price ordered by price ASC',
    solutionSql: `SELECT product_name, price FROM Products WHERE price > 100 ORDER BY price ASC;`,
    dialect: 'sqlite',
    points: 50,
    difficulty: 'easy'
  },

  // ============ INNER JOIN ============
  {
    questionId: 'q2',
    title: 'Employee Department Join',
    description: `List all employees with their department names. Return employee_name and dept_name, ordered by employee_name.`,
    setupSql: `
CREATE TABLE Departments (
  dept_id INTEGER PRIMARY KEY,
  dept_name TEXT NOT NULL
);

CREATE TABLE Employees (
  emp_id INTEGER PRIMARY KEY,
  employee_name TEXT NOT NULL,
  dept_id INTEGER,
  salary INTEGER
);

INSERT INTO Departments VALUES
  (1, 'Engineering'),
  (2, 'Marketing'),
  (3, 'Sales'),
  (4, 'HR');

INSERT INTO Employees VALUES
  (101, 'Alice', 1, 85000),
  (102, 'Bob', 2, 65000),
  (103, 'Charlie', 1, 92000),
  (104, 'Diana', 3, 72000),
  (105, 'Eve', 1, 78000),
  (106, 'Frank', 2, 68000);
    `.trim(),
    starterSql: '-- Join employees with departments\n-- Return employee_name, dept_name ordered by employee_name',
    solutionSql: `SELECT e.employee_name, d.dept_name FROM Employees e INNER JOIN Departments d ON e.dept_id = d.dept_id ORDER BY e.employee_name;`,
    dialect: 'sqlite',
    points: 75,
    difficulty: 'easy'
  },

  // ============ LEFT JOIN ============
  {
    questionId: 'q3',
    title: 'Customers Without Orders',
    description: `Find customers who have NOT placed any orders. Return customer_name only, ordered alphabetically.`,
    setupSql: `
CREATE TABLE Customers (
  customer_id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL,
  email TEXT
);

CREATE TABLE Orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  amount REAL,
  order_date TEXT
);

INSERT INTO Customers VALUES
  (1, 'Alice Smith', 'alice@email.com'),
  (2, 'Bob Johnson', 'bob@email.com'),
  (3, 'Carol White', 'carol@email.com'),
  (4, 'David Brown', 'david@email.com'),
  (5, 'Emma Davis', 'emma@email.com');

INSERT INTO Orders VALUES
  (101, 1, 150.00, '2025-01-15'),
  (102, 1, 200.00, '2025-02-20'),
  (103, 3, 75.50, '2025-03-10'),
  (104, 5, 320.00, '2025-03-15');
    `.trim(),
    starterSql: '-- Find customers with no orders using LEFT JOIN\n-- Return customer_name ordered alphabetically',
    solutionSql: `SELECT c.customer_name FROM Customers c LEFT JOIN Orders o ON c.customer_id = o.customer_id WHERE o.order_id IS NULL ORDER BY c.customer_name;`,
    dialect: 'sqlite',
    points: 100,
    difficulty: 'medium'
  },

  // ============ COUNT & GROUP BY ============
  {
    questionId: 'q4',
    title: 'Count Orders Per Customer',
    description: `Count how many orders each customer has placed. Return customer_name and order_count, ordered by order_count descending.`,
    setupSql: `
CREATE TABLE Customers (
  customer_id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL
);

CREATE TABLE Orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  amount REAL
);

INSERT INTO Customers VALUES
  (1, 'Alice'),
  (2, 'Bob'),
  (3, 'Carol'),
  (4, 'David');

INSERT INTO Orders VALUES
  (1, 1, 100), (2, 1, 200), (3, 1, 150),
  (4, 2, 300), (5, 2, 250),
  (6, 3, 175),
  (7, 4, 400), (8, 4, 350), (9, 4, 225), (10, 4, 180);
    `.trim(),
    starterSql: '-- Count orders per customer\n-- Return customer_name, order_count ordered by count DESC',
    solutionSql: `SELECT c.customer_name, COUNT(o.order_id) as order_count FROM Customers c JOIN Orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id ORDER BY order_count DESC;`,
    dialect: 'sqlite',
    points: 100,
    difficulty: 'medium'
  },

  // ============ SUM & AVG ============
  {
    questionId: 'q5',
    title: 'Department Salary Stats',
    description: `For each department, calculate the total salary and average salary. Return dept_name, total_salary, and avg_salary (rounded to 2 decimals), ordered by total_salary descending.`,
    setupSql: `
CREATE TABLE Departments (
  dept_id INTEGER PRIMARY KEY,
  dept_name TEXT
);

CREATE TABLE Employees (
  emp_id INTEGER PRIMARY KEY,
  name TEXT,
  dept_id INTEGER,
  salary REAL
);

INSERT INTO Departments VALUES (1, 'Engineering'), (2, 'Sales'), (3, 'Marketing');

INSERT INTO Employees VALUES
  (1, 'Alice', 1, 95000),
  (2, 'Bob', 1, 87000),
  (3, 'Carol', 1, 92000),
  (4, 'David', 2, 65000),
  (5, 'Eve', 2, 72000),
  (6, 'Frank', 3, 58000);
    `.trim(),
    starterSql: '-- Calculate total and average salary per department\n-- Return dept_name, total_salary, avg_salary',
    solutionSql: `SELECT d.dept_name, SUM(e.salary) as total_salary, ROUND(AVG(e.salary), 2) as avg_salary FROM Departments d JOIN Employees e ON d.dept_id = e.dept_id GROUP BY d.dept_id ORDER BY total_salary DESC;`,
    dialect: 'sqlite',
    points: 125,
    difficulty: 'medium'
  },

  // ============ HAVING CLAUSE ============
  {
    questionId: 'q6',
    title: 'High Value Customers',
    description: `Find customers who have spent more than 500 in total. Return customer_name and total_spent, ordered by total_spent descending.`,
    setupSql: `
CREATE TABLE Customers (
  id INTEGER PRIMARY KEY,
  customer_name TEXT
);

CREATE TABLE Purchases (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  amount REAL
);

INSERT INTO Customers VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Carol'), (4, 'David'), (5, 'Eve');

INSERT INTO Purchases VALUES
  (1, 1, 150), (2, 1, 200), (3, 1, 180),
  (4, 2, 400), (5, 2, 250),
  (6, 3, 100), (7, 3, 80),
  (8, 4, 600),
  (9, 5, 300), (10, 5, 350);
    `.trim(),
    starterSql: '-- Find customers with total spending > 500\n-- Use GROUP BY and HAVING',
    solutionSql: `SELECT c.customer_name, SUM(p.amount) as total_spent FROM Customers c JOIN Purchases p ON c.id = p.customer_id GROUP BY c.id HAVING SUM(p.amount) > 500 ORDER BY total_spent DESC;`,
    dialect: 'sqlite',
    points: 125,
    difficulty: 'medium'
  },

  // ============ SUBQUERY IN WHERE ============
  {
    questionId: 'q7',
    title: 'Above Average Salary',
    description: `Find all employees whose salary is above the company average. Return name and salary, ordered by salary descending.`,
    setupSql: `
CREATE TABLE Employees (
  id INTEGER PRIMARY KEY,
  name TEXT,
  department TEXT,
  salary REAL
);

INSERT INTO Employees VALUES
  (1, 'Alice', 'Engineering', 95000),
  (2, 'Bob', 'Engineering', 72000),
  (3, 'Carol', 'Sales', 68000),
  (4, 'David', 'Marketing', 85000),
  (5, 'Eve', 'Engineering', 78000),
  (6, 'Frank', 'Sales', 62000),
  (7, 'Grace', 'Marketing', 91000);
    `.trim(),
    starterSql: '-- Find employees with salary above average\n-- Use a subquery to calculate the average',
    solutionSql: `SELECT name, salary FROM Employees WHERE salary > (SELECT AVG(salary) FROM Employees) ORDER BY salary DESC;`,
    dialect: 'sqlite',
    points: 150,
    difficulty: 'medium'
  },

  // ============ SUBQUERY WITH IN ============
  {
    questionId: 'q8',
    title: 'Products in Popular Categories',
    description: `Find all products that belong to categories with more than 2 products. Return product_name and category, ordered by category then product_name.`,
    setupSql: `
CREATE TABLE Products (
  id INTEGER PRIMARY KEY,
  product_name TEXT,
  category TEXT,
  price REAL
);

INSERT INTO Products VALUES
  (1, 'Laptop', 'Electronics', 999),
  (2, 'Phone', 'Electronics', 699),
  (3, 'Tablet', 'Electronics', 499),
  (4, 'Desk', 'Furniture', 299),
  (5, 'Chair', 'Furniture', 199),
  (6, 'Lamp', 'Furniture', 49),
  (7, 'Notebook', 'Stationery', 5),
  (8, 'Pen', 'Stationery', 2);
    `.trim(),
    starterSql: '-- Find products in categories with > 2 products\n-- Use a subquery with IN',
    solutionSql: `SELECT product_name, category FROM Products WHERE category IN (SELECT category FROM Products GROUP BY category HAVING COUNT(*) > 2) ORDER BY category, product_name;`,
    dialect: 'sqlite',
    points: 150,
    difficulty: 'hard'
  },

  // ============ MULTIPLE JOINS ============
  {
    questionId: 'q9',
    title: 'Order Details Report',
    description: `Create a report showing customer_name, product_name, and quantity for all orders. Order by customer_name, then product_name.`,
    setupSql: `
CREATE TABLE Customers (
  id INTEGER PRIMARY KEY,
  customer_name TEXT
);

CREATE TABLE Products (
  id INTEGER PRIMARY KEY,
  product_name TEXT,
  price REAL
);

CREATE TABLE Orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  product_id INTEGER,
  quantity INTEGER
);

INSERT INTO Customers VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Carol');

INSERT INTO Products VALUES (1, 'Laptop', 999), (2, 'Mouse', 29), (3, 'Keyboard', 79);

INSERT INTO Orders VALUES
  (1, 1, 1, 1),
  (2, 1, 2, 2),
  (3, 2, 3, 1),
  (4, 2, 2, 3),
  (5, 3, 1, 2);
    `.trim(),
    starterSql: '-- Join all three tables\n-- Return customer_name, product_name, quantity',
    solutionSql: `SELECT c.customer_name, p.product_name, o.quantity FROM Orders o JOIN Customers c ON o.customer_id = c.id JOIN Products p ON o.product_id = p.id ORDER BY c.customer_name, p.product_name;`,
    dialect: 'sqlite',
    points: 150,
    difficulty: 'hard'
  },

  // ============ MIN/MAX WITH SUBQUERY ============
  {
    questionId: 'q10',
    title: 'Highest Paid Per Department',
    description: `Find the highest paid employee in each department. Return dept_name, employee_name, and salary, ordered by salary descending.`,
    setupSql: `
CREATE TABLE Departments (
  id INTEGER PRIMARY KEY,
  dept_name TEXT
);

CREATE TABLE Employees (
  id INTEGER PRIMARY KEY,
  employee_name TEXT,
  dept_id INTEGER,
  salary REAL
);

INSERT INTO Departments VALUES (1, 'Engineering'), (2, 'Sales'), (3, 'Marketing');

INSERT INTO Employees VALUES
  (1, 'Alice', 1, 95000),
  (2, 'Bob', 1, 87000),
  (3, 'Carol', 2, 72000),
  (4, 'David', 2, 68000),
  (5, 'Eve', 3, 82000),
  (6, 'Frank', 3, 78000);
    `.trim(),
    starterSql: '-- Find highest paid employee per department\n-- Use subquery or window function approach',
    solutionSql: `SELECT d.dept_name, e.employee_name, e.salary FROM Employees e JOIN Departments d ON e.dept_id = d.id WHERE e.salary = (SELECT MAX(e2.salary) FROM Employees e2 WHERE e2.dept_id = e.dept_id) ORDER BY e.salary DESC;`,
    dialect: 'sqlite',
    points: 200,
    difficulty: 'hard'
  },

  // ============ SELF JOIN ============
  {
    questionId: 'q11',
    title: 'Employee Manager Pairs',
    description: `List all employees with their manager's name. Return employee_name and manager_name, ordered by employee_name. Exclude employees without managers.`,
    setupSql: `
CREATE TABLE Employees (
  id INTEGER PRIMARY KEY,
  employee_name TEXT,
  manager_id INTEGER
);

INSERT INTO Employees VALUES
  (1, 'CEO', NULL),
  (2, 'Alice', 1),
  (3, 'Bob', 1),
  (4, 'Carol', 2),
  (5, 'David', 2),
  (6, 'Eve', 3);
    `.trim(),
    starterSql: '-- Self join to find employee-manager pairs\n-- Exclude employees without managers',
    solutionSql: `SELECT e.employee_name, m.employee_name as manager_name FROM Employees e JOIN Employees m ON e.manager_id = m.id WHERE e.manager_id IS NOT NULL ORDER BY e.employee_name;`,
    dialect: 'sqlite',
    points: 175,
    difficulty: 'hard'
  },

  // ============ COMPLEX NESTED QUERY ============
  {
    questionId: 'q12',
    title: 'Second Highest Salary',
    description: `Find the employee(s) with the second highest salary. Return name and salary.`,
    setupSql: `
CREATE TABLE Employees (
  id INTEGER PRIMARY KEY,
  name TEXT,
  salary REAL
);

INSERT INTO Employees VALUES
  (1, 'Alice', 95000),
  (2, 'Bob', 87000),
  (3, 'Carol', 92000),
  (4, 'David', 87000),
  (5, 'Eve', 78000);
    `.trim(),
    starterSql: '-- Find employees with the second highest salary\n-- Multiple employees may have the same salary',
    solutionSql: `SELECT name, salary FROM Employees WHERE salary = (SELECT MAX(salary) FROM Employees WHERE salary < (SELECT MAX(salary) FROM Employees));`,
    dialect: 'sqlite',
    points: 200,
    difficulty: 'hard'
  }
];

// Add expectedOutput and constraints to all questions
const questionsWithDefaults = sampleQuestions.map(q => ({
  ...q,
  expectedOutput: {
    type: 'table' as const,
    columns: [],
    rows: [],
    orderMatters: true,
    caseSensitive: false,
    numericTolerance: 0.01
  },
  constraints: {
    allowOnlySelect: true,
    maxRows: 100,
    maxQueryLength: 5000
  },
  expectedStdout: '' // Will be populated during seeding
}));

/**
 * Generate expected stdout by running solution SQL on OneCompiler
 */
async function generateExpectedOutputs(questions: typeof questionsWithDefaults): Promise<Map<string, ParsedOutput>> {
  console.log('🔄 Generating expected outputs from OneCompiler...');
  const outputs = new Map<string, ParsedOutput>();
  
  for (const q of questions) {
    try {
      console.log(`   Running solution for ${q.questionId}: ${q.title}...`);
      const result = await OneCompilerService.executeSql(
        q.setupSql,
        q.solutionSql,
        q.dialect
      );
      
      if (result.stderr) {
        console.error(`   ❌ Error for ${q.questionId}: ${result.stderr}`);
        continue;
      }
      
      // Store the raw stdout (normalized)
      const normalizedOutput = result.stdout?.trim().replace(/\r\n/g, '\n') || '';
      
      // Parse the output to get columns and rows
      const parsed = AsciiTableParser.parse(normalizedOutput);
      
      outputs.set(q.questionId, {
        stdout: normalizedOutput,
        columns: parsed.columns,
        rows: parsed.rows
      });
      
      // Show preview of output
      console.log(`   ✅ ${q.questionId}: ${parsed.columns.length} columns, ${parsed.rows.length} rows`);
      
      // Rate limit - wait between API calls
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error: any) {
      console.error(`   ❌ Failed ${q.questionId}: ${error.message}`);
    }
  }
  
  return outputs;
}

async function seed() {
  try {
    console.log('🌱 Starting database seed with comprehensive SQL questions...');
    console.log('');
    
    // Connect to database
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    await Question.deleteMany({});
    await User.deleteMany({});
    await Progress.deleteMany({});
    console.log('🗑️  Cleared existing data');
    console.log('');
    
    // Generate expected outputs by running solution queries
    const expectedOutputs = await generateExpectedOutputs(questionsWithDefaults);
    console.log('');
    

    // Add expected output and testCases to questions, generating real hidden test case outputs
    const questionsWithOutputs = await Promise.all(questionsWithDefaults.map(async q => {
      const output = expectedOutputs.get(q.questionId);
      // Only require order if the question description explicitly mentions order (not just ORDER BY in SQL)
      const requiresOrder = q.description.toLowerCase().includes('order');



      // Helper to parse stdout to structured rows/columns
      function parseStdout(stdout: string) {
        try {
          return AsciiTableParser.parse(stdout);
        } catch {
          return { columns: [], rows: [] };
        }
      }

      // Add a hidden test case for every question (default duplicates visible setup)
      let hiddenTestCase: any = {
        setupSql: q.setupSql,
        expectedStdout: '',
        expectedColumns: [] as string[],
        expectedRows: [] as (string | number | null)[][],
        isHidden: true
      };

      // Provide varied hidden datasets per question so data differs from visible tests
      if (q.questionId === 'q1') {
        hiddenTestCase.setupSql = `CREATE TABLE Products (id INTEGER PRIMARY KEY, product_name TEXT NOT NULL, category TEXT, price REAL, stock INTEGER);\nINSERT INTO Products VALUES (1, 'Pen', 'Stationery', 2.99, 100), (2, 'Notebook', 'Stationery', 5.99, 50), (3, 'Monitor', 'Electronics', 120.00, 10);`;
      }
      if (q.questionId === 'q2') {
        hiddenTestCase.setupSql = `CREATE TABLE Departments (dept_id INTEGER PRIMARY KEY, dept_name TEXT NOT NULL);\nCREATE TABLE Employees (emp_id INTEGER PRIMARY KEY, employee_name TEXT NOT NULL, dept_id INTEGER, salary INTEGER);\nINSERT INTO Departments VALUES (1, 'Support'), (2, 'Ops'), (3, 'Design');\nINSERT INTO Employees VALUES (201, 'Zara', 1, 56000), (202, 'Liam', 2, 72000), (203, 'Noah', 3, 61000), (204, 'Maya', 1, 58000);`;
      }
      if (q.questionId === 'q3') {
        hiddenTestCase.setupSql = `CREATE TABLE Customers (customer_id INTEGER PRIMARY KEY, customer_name TEXT NOT NULL, email TEXT);\nCREATE TABLE Orders (order_id INTEGER PRIMARY KEY, customer_id INTEGER, amount REAL, order_date TEXT);\nINSERT INTO Customers VALUES (11, 'Ivy', 'ivy@mail.com'), (12, 'Jake', 'jake@mail.com'), (13, 'Lara', 'lara@mail.com');\nINSERT INTO Orders VALUES (201, 11, 40.00, '2025-04-01');`;
      }
      if (q.questionId === 'q4') {
        hiddenTestCase.setupSql = `CREATE TABLE Customers (customer_id INTEGER PRIMARY KEY, customer_name TEXT NOT NULL);\nCREATE TABLE Orders (order_id INTEGER PRIMARY KEY, customer_id INTEGER, amount REAL);\nINSERT INTO Customers VALUES (21, 'Sam'), (22, 'Tina'), (23, 'Uma');\nINSERT INTO Orders VALUES (301, 21, 50), (302, 21, 70), (303, 22, 120);`;
      }
      if (q.questionId === 'q5') {
        hiddenTestCase.setupSql = `CREATE TABLE Departments (dept_id INTEGER PRIMARY KEY, dept_name TEXT);\nCREATE TABLE Employees (emp_id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER, salary REAL);\nINSERT INTO Departments VALUES (10, 'Research'), (20, 'Sales');\nINSERT INTO Employees VALUES (41, 'Owen', 10, 88000), (42, 'Pia', 10, 92000), (43, 'Quinn', 20, 61000);`;
      }
      if (q.questionId === 'q6') {
        hiddenTestCase.setupSql = `CREATE TABLE Customers (id INTEGER PRIMARY KEY, customer_name TEXT);\nCREATE TABLE Purchases (id INTEGER PRIMARY KEY, customer_id INTEGER, amount REAL);\nINSERT INTO Customers VALUES (31, 'Fred'), (32, 'Gina'), (33, 'Hank');\nINSERT INTO Purchases VALUES (401, 31, 200), (402, 31, 200), (403, 32, 600), (404, 33, 120);`;
      }
      if (q.questionId === 'q7') {
        hiddenTestCase.setupSql = `CREATE TABLE Employees (id INTEGER PRIMARY KEY, name TEXT, department TEXT, salary REAL);\nINSERT INTO Employees VALUES (51, 'Ava', 'Dev', 77000), (52, 'Ben', 'Dev', 81000), (53, 'Cara', 'Ops', 73000), (54, 'Drew', 'Ops', 82000);`;
      }
      if (q.questionId === 'q8') {
        hiddenTestCase.setupSql = `CREATE TABLE Products (id INTEGER PRIMARY KEY, product_name TEXT, category TEXT, price REAL);\nINSERT INTO Products VALUES (61, 'Stool', 'Furniture', 85), (62, 'Couch', 'Furniture', 400), (63, 'Pillow', 'Home', 20), (64, 'Blanket', 'Home', 35);`;
      }
      if (q.questionId === 'q9') {
        hiddenTestCase.setupSql = `CREATE TABLE Customers (id INTEGER PRIMARY KEY, customer_name TEXT);\nCREATE TABLE Products (id INTEGER PRIMARY KEY, product_name TEXT, price REAL);\nCREATE TABLE Orders (id INTEGER PRIMARY KEY, customer_id INTEGER, product_id INTEGER, quantity INTEGER);\nINSERT INTO Customers VALUES (71, 'Iris'), (72, 'Josh');\nINSERT INTO Products VALUES (81, 'Chair', 120), (82, 'Table', 250);\nINSERT INTO Orders VALUES (501, 71, 81, 2), (502, 72, 82, 1);`;
      }
      if (q.questionId === 'q10') {
        hiddenTestCase.setupSql = `CREATE TABLE Departments (id INTEGER PRIMARY KEY, dept_name TEXT);\nCREATE TABLE Employees (id INTEGER PRIMARY KEY, employee_name TEXT, dept_id INTEGER, salary REAL);\nINSERT INTO Departments VALUES (1, 'Alpha'), (2, 'Beta');\nINSERT INTO Employees VALUES (91, 'Ken', 1, 99000), (92, 'Luz', 1, 87000), (93, 'Moe', 2, 95000);`;
      }
      if (q.questionId === 'q11') {
        hiddenTestCase.setupSql = `CREATE TABLE Employees (id INTEGER PRIMARY KEY, employee_name TEXT, manager_id INTEGER);\nINSERT INTO Employees VALUES (101, 'Xander', NULL), (102, 'Yara', 101), (103, 'Zed', 101), (104, 'Will', 102);`;
      }
      if (q.questionId === 'q12') {
        hiddenTestCase.setupSql = `CREATE TABLE Employees (id INTEGER PRIMARY KEY, name TEXT, salary REAL);\nINSERT INTO Employees VALUES (1, 'John', 80000), (2, 'Jane', 95000), (3, 'Sam', 90000), (4, 'Alex', 95000), (5, 'Rita', 90000), (6, 'Tom', 85000);`;
      }

      try {
        const hiddenResult = await OneCompilerService.executeSql(
          hiddenTestCase.setupSql,
          q.solutionSql,
          q.dialect
        );
        hiddenTestCase.expectedStdout = hiddenResult.stdout?.trim().replace(/\r\n/g, '\n') || '';
        const parsed = parseStdout(hiddenTestCase.expectedStdout);
        hiddenTestCase.expectedColumns = parsed.columns;
        hiddenTestCase.expectedRows = parsed.rows;
      } catch (err) {
        hiddenTestCase.expectedStdout = '';
        hiddenTestCase.expectedColumns = [];
        hiddenTestCase.expectedRows = [];
      }
      // Main test case (visible)
      const mainTestCase = {
        setupSql: q.setupSql,
        expectedStdout: output?.stdout || '-',
        expectedColumns: output?.columns || [],
        expectedRows: output?.rows || [],
        isHidden: false
      };
      const testCases = [mainTestCase];
      if (hiddenTestCase) {
        if (!hiddenTestCase.expectedStdout) hiddenTestCase.expectedStdout = '-';
        testCases.push(hiddenTestCase);
      }

      return {
        ...q,
        expectedStdout: output?.stdout || '',
        expectedOutput: {
          type: 'table' as const,
          columns: output?.columns || [],
          rows: output?.rows || [],
          orderMatters: requiresOrder,
          caseSensitive: false,
          numericTolerance: 0.01
        },
        testCases
      };
    }));

    // Insert questions
    await Question.insertMany(questionsWithOutputs);
    console.log(`✅ Inserted ${questionsWithOutputs.length} questions with test cases`);
    
    // Create demo teams
    const teams = [
      { teamName: 'demo_team', password: 'demo123' },
      { teamName: 'team_alpha', password: 'sql123' },
      { teamName: 'team_beta', password: 'sql123' },
      { teamName: 'team_gamma', password: 'sql123' },
      { teamName: 'devsquad', password: 'sql123' }
    ];

    for (const team of teams) {
      await User.create({
        teamName: team.teamName,
        passwordHash: team.password,
        isActive: true
      });
    }
    console.log('✅ Created demo teams');
    
    console.log('');
    console.log('📚 Questions Summary:');
    console.log('─'.repeat(60));
    
    const byDifficulty = { easy: 0, medium: 0, hard: 0 };
    let totalPoints = 0;
    
    questionsWithDefaults.forEach((q, i) => {
      const hasOutput = expectedOutputs.has(q.questionId);
      const status = hasOutput ? '✓' : '⚠';
      console.log(`  ${status} ${q.questionId.padEnd(4)} ${q.title.padEnd(30)} ${q.difficulty.padEnd(8)} ${q.points} pts`);
      byDifficulty[q.difficulty as keyof typeof byDifficulty]++;
      totalPoints += q.points;
    });
    
    console.log('─'.repeat(60));
    console.log(`  Easy: ${byDifficulty.easy} | Medium: ${byDifficulty.medium} | Hard: ${byDifficulty.hard}`);
    console.log(`  Total: ${questionsWithDefaults.length} questions, ${totalPoints} points`);
    console.log('');
    console.log('🎉 Seed completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
