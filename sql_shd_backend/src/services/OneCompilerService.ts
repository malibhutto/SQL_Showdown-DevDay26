import axios from 'axios';
import { config } from '../config';
import { AsciiTableParser, ParsedTable } from '../utils/AsciiTableParser';

export interface ExecutionResult {
  stdout: string;
  stderr: string | null;
  executionTimeMs: number;
  memoryUsedKb: number;
  parsedOutput?: ParsedTable;
}

export interface OneCompilerRequest {
  language: string;
  files: {
    name: string;
    content: string;
  }[];
}

export interface OneCompilerResponse {
  stdout?: string;
  stderr?: string;
  exception?: string;
  status?: string;
}

export class OneCompilerService {
  /**
   * Execute SQL query via OneCompiler API
   */
  static async executeSql(
    setupSql: string,
    userSql: string,
    dialect: string = 'sqlite'
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Combine setup and user SQL
      const fullSql = `${setupSql}\n\n${userSql}`;
      
      // Prepare request
      const requestData: OneCompilerRequest = {
        language: dialect,
        files: [
          {
            name: 'script.sql',
            content: fullSql
          }
        ]
      };
      
      // Make API request
      const response = await axios.post<OneCompilerResponse>(
        config.oneCompiler.url,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': config.oneCompiler.apiKey,
            'X-RapidAPI-Host': config.oneCompiler.host
          },
          timeout: 30000 // 30 second timeout
        }
      );
      
      const executionTimeMs = Date.now() - startTime;
      
      // Extract results
      const stdout = response.data.stdout || '';
      const stderr = response.data.stderr || response.data.exception || null;
      
      // Parse output if successful
      let parsedOutput: ParsedTable | undefined;
      if (stdout && !stderr) {
        try {
          parsedOutput = AsciiTableParser.parseAuto(stdout);
        } catch (parseError) {
          console.error('Error parsing output:', parseError);
        }
      }
      
      return {
        stdout,
        stderr,
        executionTimeMs,
        memoryUsedKb: 0, // OneCompiler doesn't provide this
        parsedOutput
      };
      
    } catch (error: any) {
      const executionTimeMs = Date.now() - startTime;
      
      // Handle API errors
      let errorMessage = 'Execution failed';
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage = `API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
        } else if (error.request) {
          errorMessage = 'No response from OneCompiler API';
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        stdout: '',
        stderr: errorMessage,
        executionTimeMs,
        memoryUsedKb: 0
      };
    }
  }
  
  /**
   * Test OneCompiler connectivity
   */
  static async testConnection(): Promise<boolean> {
    try {
      const result = await this.executeSql('', 'SELECT 1 as test;', 'sqlite');
      return !result.stderr;
    } catch (error) {
      return false;
    }
  }
}
