import { ParsedTable } from '../utils/AsciiTableParser';
import { IExpectedOutput, Verdict } from '../models';

export interface JudgeResult {
  verdict: Verdict;
  message?: string;
  details?: {
    expectedRows: number;
    actualRows: number;
    expectedColumns: number;
    actualColumns: number;
    firstDifference?: string;
  };
}

export class JudgeService {
  /**
   * SIMPLE STDOUT COMPARISON - Preferred method
   * Compares raw stdout strings directly
   */
  static judgeByStdout(
    actualStdout: string | null,
    expectedStdout: string,
    stderr: string | null
  ): JudgeResult {
    // If there was a runtime error
    if (stderr) {
      return {
        verdict: 'Runtime Error',
        message: stderr.substring(0, 200) // First 200 chars of error
      };
    }

    if (!actualStdout) {
      return {
        verdict: 'Wrong Answer',
        message: 'No output produced'
      };
    }

    // Normalize both outputs for comparison
    const normalizedActual = this.normalizeStdout(actualStdout);
    const normalizedExpected = this.normalizeStdout(expectedStdout);

    if (normalizedActual === normalizedExpected) {
      return {
        verdict: 'Accepted',
        message: 'Correct answer!'
      };
    }

    // Provide helpful difference info
    const actualLines = normalizedActual.split('\n');
    const expectedLines = normalizedExpected.split('\n');

    if (actualLines.length !== expectedLines.length) {
      return {
        verdict: 'Wrong Answer',
        message: `Output has ${actualLines.length} rows, expected ${expectedLines.length}`
      };
    }

    // Find first difference
    for (let i = 0; i < expectedLines.length; i++) {
      if (actualLines[i] !== expectedLines[i]) {
        return {
          verdict: 'Wrong Answer',
          message: `Difference at row ${i + 1}`
        };
      }
    }

    return {
      verdict: 'Wrong Answer',
      message: 'Output does not match expected result'
    };
  }

  /**
   * Normalize stdout for comparison
   */
  static normalizeStdout(stdout: string): string {
    return stdout
      .trim()
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\r/g, '\n')
      .replace(/[ \t]+$/gm, '') // Remove trailing whitespace from each line
      .replace(/^\s+$/gm, '')   // Empty lines with only whitespace become empty
      .toLowerCase();           // Case insensitive comparison
  }

  /**
   * Judge the SQL execution result (legacy method using parsed output)
   */
  static judge(
    actualOutput: ParsedTable,
    expectedOutput: IExpectedOutput,
    stderr: string | null
  ): JudgeResult {
    // If there was a runtime error
    if (stderr) {
      return {
        verdict: 'Runtime Error',
        message: 'Query execution failed'
      };
    }
    
    // Check based on output type
    if (expectedOutput.type === 'scalar') {
      return this.judgeScalar(actualOutput, expectedOutput);
    } else {
      return this.judgeTable(actualOutput, expectedOutput);
    }
  }
  
  /**
   * Judge scalar result (single value)
   */
  private static judgeScalar(
    actualOutput: ParsedTable,
    expectedOutput: IExpectedOutput
  ): JudgeResult {
    // Check if we have exactly 1 row and 1 column
    if (actualOutput.rows.length !== 1 || actualOutput.rows[0].length !== 1) {
      return {
        verdict: 'Wrong Answer',
        message: 'Expected single value result',
        details: {
          expectedRows: 1,
          actualRows: actualOutput.rows.length,
          expectedColumns: 1,
          actualColumns: actualOutput.rows[0]?.length || 0
        }
      };
    }
    
    const actualValue = actualOutput.rows[0][0];
    const expectedValue = expectedOutput.rows[0][0];
    
    // Compare values
    if (this.compareValues(actualValue, expectedValue, expectedOutput)) {
      return {
        verdict: 'Accepted',
        message: 'Correct answer!'
      };
    } else {
      return {
        verdict: 'Wrong Answer',
        message: `Expected ${expectedValue}, got ${actualValue}`
      };
    }
  }
  
  /**
   * Judge table result
   */
  static judgeTable(
    actualOutput: ParsedTable,
    expectedOutput: IExpectedOutput
  ): JudgeResult {
    let expectedRows = expectedOutput.rows;
    let actualRows = actualOutput.rows;
    // (debug logs removed)
    
    // Check row count
    if (actualRows.length !== expectedRows.length) {
      return {
        verdict: 'Wrong Answer',
        message: `Row count mismatch: expected ${expectedRows.length}, got ${actualRows.length}`,
        details: {
          expectedRows: expectedRows.length,
          actualRows: actualRows.length,
          expectedColumns: expectedRows[0]?.length || 0,
          actualColumns: actualRows[0]?.length || 0
        }
      };
    }
    
    // Check column count
    if (actualRows.length > 0 && expectedRows.length > 0) {
      const expectedColCount = expectedRows[0].length;
      const actualColCount = actualRows[0].length;
      
      if (actualColCount !== expectedColCount) {
        return {
          verdict: 'Wrong Answer',
          message: `Column count mismatch: expected ${expectedColCount}, got ${actualColCount}`,
          details: {
            expectedRows: expectedRows.length,
            actualRows: actualRows.length,
            expectedColumns: expectedColCount,
            actualColumns: actualColCount
          }
        };
      }
    }
    
    // Check column names if specified (but be lenient - allow different aliases)
    if (expectedOutput.columns && expectedOutput.columns.length > 0 && actualOutput.columns.length > 0) {
      const actualColumns = this.normalizeColumns(actualOutput.columns, expectedOutput.caseSensitive);
      const expectedColumns = this.normalizeColumns(expectedOutput.columns, expectedOutput.caseSensitive);
      
      // Only fail if column count differs, not names (user might use aliases)
      if (actualColumns.length !== expectedColumns.length) {
        return {
          verdict: 'Wrong Answer',
          message: 'Column count mismatch',
          details: {
            expectedRows: expectedRows.length,
            actualRows: actualRows.length,
            expectedColumns: expectedColumns.length,
            actualColumns: actualColumns.length
          }
        };
      }
    }
    
    // If order doesn't matter, use set comparison
    if (!expectedOutput.orderMatters) {
      const comparison = this.rowSetsEqual(actualRows, expectedRows, expectedOutput);
      if (!comparison.equal) {
        return {
          verdict: 'Wrong Answer',
          message: comparison.message || 'Data does not match expected result',
          details: {
            expectedRows: expectedRows.length,
            actualRows: actualRows.length,
            expectedColumns: expectedRows[0]?.length || 0,
            actualColumns: actualRows[0]?.length || 0
          }
        };
      }
      return {
        verdict: 'Accepted',
        message: 'All test cases passed!'
      };
    }
    // Order matters - compare row by row
    
    for (let i = 0; i < expectedRows.length; i++) {
      const expectedRow = expectedRows[i];
      const actualRow = actualRows[i];
      for (let j = 0; j < expectedRow.length; j++) {
        const expectedValue = expectedRow[j];
        const actualValue = actualRow[j];
        if (!this.compareValues(actualValue, expectedValue, expectedOutput)) {
          
          return {
            verdict: 'Wrong Answer',
            message: `Value mismatch at row ${i + 1}, column ${j + 1}`,
            details: {
              expectedRows: expectedRows.length,
              actualRows: actualRows.length,
              expectedColumns: expectedRow.length,
              actualColumns: actualRow.length,
              firstDifference: `Expected: ${expectedValue}, Got: ${actualValue}`
            }
          };
        }
      }
    }
    
    return {
      verdict: 'Accepted',
      message: 'All test cases passed!'
    };
  }
  
  /**
   * Compare two values considering type and tolerance
   */
  private static compareValues(
    actual: string | number | null,
    expected: string | number | null,
    options: IExpectedOutput
  ): boolean {
    // Both null or empty
    if ((actual === null || actual === '') && (expected === null || expected === '')) {
      return true;
    }
    
    // One is null/empty but not the other
    if (actual === null || actual === '' || expected === null || expected === '') {
      // Check for NULL string representation
      const actualStr = String(actual).toLowerCase().trim();
      const expectedStr = String(expected).toLowerCase().trim();
      if (actualStr === 'null' && expectedStr === 'null') return true;
      if (actualStr === '' && expectedStr === 'null') return false;
      if (actualStr === 'null' && expectedStr === '') return false;
      return false;
    }
    
    // Try to parse as numbers first
    const actualNum = this.parseNumber(actual);
    const expectedNum = this.parseNumber(expected);
    
    if (actualNum !== null && expectedNum !== null) {
      // Both are valid numbers - compare with tolerance
      const tolerance = options.numericTolerance || 0;
      return Math.abs(actualNum - expectedNum) <= tolerance;
    }
    
    // String comparison
    let actualStr = String(actual).trim();
    let expectedStr = String(expected).trim();
    
    // Case insensitive comparison
    if (!options.caseSensitive) {
      actualStr = actualStr.toLowerCase();
      expectedStr = expectedStr.toLowerCase();
    }
    
    return actualStr === expectedStr;
  }
  
  /**
   * Try to parse a value as a number
   */
  private static parseNumber(value: string | number | null): number | null {
    if (typeof value === 'number') {
      return value;
    }
    if (value === null || value === '') {
      return null;
    }
    const num = parseFloat(String(value).trim());
    return isNaN(num) ? null : num;
  }
  
  /**
   * Normalize column names
   */
  private static normalizeColumns(columns: string[], caseSensitive: boolean): string[] {
    return columns.map(col => {
      const trimmed = col.trim();
      return caseSensitive ? trimmed : trimmed.toLowerCase();
    });
  }
  
  /**
   * Sort rows for order-independent comparison
   * Creates a canonical string representation for each row and sorts
   */
  private static sortRows(rows: (string | number | null)[][]): (string | number | null)[][] {
    return [...rows].sort((a, b) => {
      // Convert each value to a normalized string for comparison
      const aStr = a.map(v => this.normalizeValueForSort(v)).join('|');
      const bStr = b.map(v => this.normalizeValueForSort(v)).join('|');
      return aStr.localeCompare(bStr);
    });
  }
  
  /**
   * Normalize a value for sorting purposes
   */
  private static normalizeValueForSort(value: string | number | null): string {
    if (value === null) return 'NULL';
    if (typeof value === 'number') {
      // Pad numbers for proper sorting
      return value.toFixed(10).padStart(20, '0');
    }
    return String(value).toLowerCase().trim();
  }
  
  /**
   * Check if two row sets are equal (ignoring order)
   * Uses a more robust set comparison
   */
  private static rowSetsEqual(
    actualRows: (string | number | null)[][],
    expectedRows: (string | number | null)[][],
    options: IExpectedOutput
  ): { equal: boolean; message?: string } {
    if (actualRows.length !== expectedRows.length) {
      return { 
        equal: false, 
        message: `Row count mismatch: expected ${expectedRows.length}, got ${actualRows.length}` 
      };
    }
    
    // Create a map of expected rows for efficient lookup
    const expectedRowStrings = new Map<string, number>();
    for (const row of expectedRows) {
      const key = this.rowToKey(row, options);
      expectedRowStrings.set(key, (expectedRowStrings.get(key) || 0) + 1);
    }
    
    // Check each actual row
    for (const row of actualRows) {
      const key = this.rowToKey(row, options);
      const count = expectedRowStrings.get(key);
      
      if (!count || count <= 0) {
        return { 
          equal: false, 
          message: `Unexpected row: [${row.join(', ')}]` 
        };
      }
      
      expectedRowStrings.set(key, count - 1);
    }
    
    return { equal: true };
  }
  
  /**
   * Convert a row to a string key for comparison
   */
  private static rowToKey(
    row: (string | number | null)[],
    options: IExpectedOutput
  ): string {
    return row.map(val => {
      if (val === null) return 'NULL';
      if (typeof val === 'number') {
        // Round to tolerance for comparison
        const tolerance = options.numericTolerance || 0;
        if (tolerance > 0) {
          return Math.round(val / tolerance) * tolerance;
        }
        return val.toString();
      }
      const str = String(val).trim();
      return options.caseSensitive ? str : str.toLowerCase();
    }).join('|||');
  }
  
  /**
   * Check if two arrays are equal
   */
  private static arraysEqual<T>(arr1: T[], arr2: T[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, idx) => val === arr2[idx]);
  }
}
