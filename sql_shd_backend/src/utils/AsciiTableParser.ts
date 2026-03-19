/**
 * ASCII Table Parser
 * Parses OneCompiler ASCII table output to structured data
 */

export interface ParsedTable {
  columns: string[];
  rows: (string | number | null)[][];
}

export class AsciiTableParser {
  /**
   * Parse ASCII table format from OneCompiler output
   */
  static parse(output: string): ParsedTable {
    if (!output || output.trim().length === 0) {
      return { columns: [], rows: [] };
    }
    
    const lines = output.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length === 0) {
      return { columns: [], rows: [] };
    }
    
    // Find lines that are not borders
    const contentLines = lines.filter(line => !this.isBorderLine(line));
    
    if (contentLines.length === 0) {
      return { columns: [], rows: [] };
    }
    
    // First content line is headers
    const headerLine = contentLines[0];
    const columns = this.parseLine(headerLine);
    
    // Remaining lines are data rows
    const rows = contentLines.slice(1).map(line => {
      const values = this.parseLine(line);
      return values.map(val => this.parseValue(val));
    });
    
    return { columns, rows };
  }
  
  /**
   * Check if a line is a border (contains only ─, ┌, ┐, └, ┘, ├, ┤, ┬, ┴, ┼, │, -, +, |)
   */
  private static isBorderLine(line: string): boolean {
    const borderChars = /^[─┌┐└┘├┤┬┴┼│\-+|\s]+$/;
    return borderChars.test(line);
  }
  
  /**
   * Parse a single line into cell values
   */
  private static parseLine(line: string): string[] {
    // Remove leading/trailing border characters
    let cleaned = line.trim();
    
    // Remove leading and trailing | or │
    if (cleaned.startsWith('|') || cleaned.startsWith('│')) {
      cleaned = cleaned.substring(1);
    }
    if (cleaned.endsWith('|') || cleaned.endsWith('│')) {
      cleaned = cleaned.substring(0, cleaned.length - 1);
    }
    
    // Split by | or │
    const cells = cleaned.split(/[|│]/).map(cell => cell.trim());
    
    return cells.filter(cell => cell.length > 0 || cells.length === 1);
  }
  
  /**
   * Parse individual cell value
   */
  private static parseValue(value: string): string | number | null {
    const trimmed = value.trim();
    
    // Check for NULL
    if (trimmed.toUpperCase() === 'NULL' || trimmed === '') {
      return null;
    }
    
    // Try to parse as number
    const num = Number(trimmed);
    if (!isNaN(num) && trimmed !== '') {
      return num;
    }
    
    // Return as string
    return trimmed;
  }
  
  /**
   * Alternative parser for simple format (tab or space separated)
   */
  static parseSimple(output: string): ParsedTable {
    const lines = output.trim().split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length === 0) {
      return { columns: [], rows: [] };
    }
    
    // First line is headers
    const columns = lines[0].split(/\s+/).filter(col => col.length > 0);
    
    // Remaining lines are data
    const rows = lines.slice(1).map(line => {
      const values = line.split(/\s+/).filter(val => val.length > 0);
      return values.map(val => this.parseValue(val));
    });
    
    return { columns, rows };
  }
  
  /**
   * Try multiple parsing strategies
   */
  static parseAuto(output: string): ParsedTable {
    // Try ASCII table format first
    const result = this.parse(output);
    
    // If we got valid results, return them
    if (result.columns.length > 0 || result.rows.length > 0) {
      return result;
    }
    
    // Otherwise try simple format
    return this.parseSimple(output);
  }
}
