/**
 * SQL Safety Validator
 * Blocks dangerous SQL operations and enforces security rules
 */

export class SqlValidator {
  // Forbidden SQL keywords and operations
  private static readonly FORBIDDEN_KEYWORDS = [
    'DROP',
    'ALTER',
    'TRUNCATE',
    'DELETE',
    'INSERT',
    'UPDATE',
    'CREATE',
    'ATTACH',
    'DETACH',
    'PRAGMA',
    'REPLACE',
    'GRANT',
    'REVOKE',
    'COMMIT',
    'ROLLBACK',
    'SAVEPOINT',
    'EXEC',
    'EXECUTE',
    'LOAD_FILE',
    'INTO OUTFILE',
    'INTO DUMPFILE'
  ];
  
  // Allowed keywords for read-only queries
  private static readonly ALLOWED_KEYWORDS = [
    'SELECT',
    'WITH',
    'FROM',
    'WHERE',
    'JOIN',
    'LEFT JOIN',
    'RIGHT JOIN',
    'INNER JOIN',
    'OUTER JOIN',
    'CROSS JOIN',
    'ON',
    'GROUP BY',
    'HAVING',
    'ORDER BY',
    'LIMIT',
    'OFFSET',
    'UNION',
    'INTERSECT',
    'EXCEPT',
    'AS',
    'DISTINCT',
    'CASE',
    'WHEN',
    'THEN',
    'ELSE',
    'END',
    'AND',
    'OR',
    'NOT',
    'IN',
    'EXISTS',
    'BETWEEN',
    'LIKE',
    'IS',
    'NULL'
  ];
  
  /**
   * Validate SQL query for security
   */
  static validate(sql: string, maxLength: number = 5000, requiredTables: string[] = [], requiredColumns: string[] = []): { valid: boolean; error?: string } {
    // Check if SQL is empty
    if (!sql || sql.trim().length === 0) {
      return { valid: false, error: 'SQL query cannot be empty' };
    }
    
    // Check length
    if (sql.length > maxLength) {
      return { valid: false, error: `SQL query exceeds maximum length of ${maxLength} characters` };
    }
    
    // Normalize SQL for checking
    const normalizedSql = sql.toUpperCase();
    
    // Remove comments (both -- and /* */)
    const withoutComments = normalizedSql
      .replace(/--[^\n]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Check for forbidden keywords
    for (const keyword of this.FORBIDDEN_KEYWORDS) {
      // Use word boundaries to avoid false positives
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(withoutComments)) {
        return { valid: false, error: `Forbidden SQL operation: ${keyword}` };
      }
    }
    
    // Check for multiple statements (semicolon)
    const statements = sql.split(';').filter(s => s.trim().length > 0);
    if (statements.length > 1) {
      return { valid: false, error: 'Multiple SQL statements are not allowed' };
    }
    
    // Check if query starts with SELECT or WITH (common table expression)
    const trimmedUpperSql = withoutComments.trim();
    if (!trimmedUpperSql.startsWith('SELECT') && !trimmedUpperSql.startsWith('WITH')) {
      return { valid: false, error: 'Query must start with SELECT or WITH' };
    }
    
    // Check for suspicious patterns
    if (this.hasSuspiciousPatterns(withoutComments)) {
      return { valid: false, error: 'Query contains suspicious patterns' };
    }

    // If required tables are provided, ensure the query references them via FROM or JOIN
    if (requiredTables && requiredTables.length > 0) {
      const referencesFound = requiredTables.some(tbl => this.referencesTable(withoutComments, tbl));
      if (!referencesFound) {
        return { valid: false, error: `Query must reference one of the required tables: ${requiredTables.join(', ')}` };
      }
    }

    // If required columns are provided, ensure at least one is referenced in the query
    if (requiredColumns && requiredColumns.length > 0) {
      const colReferenced = requiredColumns.some(col => this.referencesColumn(withoutComments, col));
      if (!colReferenced) {
        return { valid: false, error: `Query must reference at least one of the required columns: ${requiredColumns.join(', ')}` };
      }
    }

    // Prevent trivial hardcoded SELECTs: SELECT 123 or SELECT 'abc' without meaningful identifiers
    if (this.isTrivialSelect(withoutComments)) {
      return { valid: false, error: 'Trivial constant SELECTs are not allowed' };
    }
    
    return { valid: true };
  }

  /**
   * Check if the SQL references a table name in FROM or JOIN clauses
   */
  private static referencesTable(sql: string, tableName: string): boolean {
    const pattern = new RegExp(`\\b(?:FROM|JOIN)\\s+(?:\\w+\\.)?${tableName}\\b`, 'i');
    return pattern.test(sql);
  }

  /**
   * Detect trivial SELECTs that are just constants
   * Returns true if the SELECT list contains only literals/numbers and no identifiers
   */
  private static isTrivialSelect(sql: string): boolean {
    try {
      const m = sql.match(/SELECT\s+([\s\S]*?)(?:\bFROM\b|$)/i);
      if (!m) return false;
      const selectList = m[1].trim();
      if (!selectList) return false;

      // Allow SELECT * (wildcard) - it's not trivial
      if (selectList === '*' || /^\*\s*$/.test(selectList)) {
        return false;
      }

      // Remove surrounding parentheses and AS aliases
      const items = selectList.split(',').map(s => s.replace(/\s+AS\s+\w+$/i, '').trim());

      // If any item looks like an identifier (contains letters or dot), it's not trivial
      for (const it of items) {
        // Allow * or table.* (wildcard patterns)
        if (it === '*' || /^\w+\.\*$/.test(it)) {
          return false;
        }
        // String literal or numeric literal
        if (/^['"].*['"]$/.test(it) || /^\d+(?:\.\d+)?$/.test(it)) {
          continue;
        }
        // Function call or identifier like table.col or col
        if (/\w+\(|\w+\.\w+|[a-zA-Z_][a-zA-Z0-9_]*/.test(it)) {
          return false;
        }
      }

      // All items were literals/numbers
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if SQL references a bare column name (or table.column)
   */
  private static referencesColumn(sql: string, columnName: string): boolean {
    // Look for table.column or bare column boundary matches
    const patterns = [
      new RegExp(`\\b${columnName}\\b`, 'i'),
      new RegExp(`\\b\\w+\\.${columnName}\\b`, 'i')
    ];
    return patterns.some(p => p.test(sql));
  }
  
  /**
   * Check for suspicious patterns that might indicate SQL injection attempts
   */
  private static hasSuspiciousPatterns(sql: string): boolean {
    const suspiciousPatterns = [
      /LOAD_FILE/i,
      /INTO\s+OUTFILE/i,
      /INTO\s+DUMPFILE/i,
      /UNION\s+SELECT.*FROM\s+INFORMATION_SCHEMA/i,
      /UNION\s+SELECT.*FROM\s+MYSQL/i,
      /UNION\s+SELECT.*FROM\s+PG_/i,
      /EXEC\s*\(/i,
      /EXECUTE\s*\(/i,
      /xp_cmdshell/i,
      /sp_executesql/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(sql));
  }
  
  /**
   * Sanitize SQL query (basic cleanup)
   */
  static sanitize(sql: string): string {
    return sql.trim();
  }
  
  /**
   * Check if query is SELECT only
   */
  static isSelectOnly(sql: string): boolean {
    const normalized = sql.toUpperCase().trim();
    return normalized.startsWith('SELECT') || normalized.startsWith('WITH');
  }
}
