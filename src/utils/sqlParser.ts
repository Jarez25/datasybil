export interface SqlStatement {
  sql: string;
  startLine: number;
  endLine: number;
}

/**
 * Splits an SQL script into discrete statements, respecting string literals
 * (single quotes, double quotes, backticks), escape characters (\'),
 * single-line comments (--), multi-line block comments (/* *\/),
 * and PostgreSQL dollar-quoted blocks ($$ ... $$ or $tag$ ... $tag$).
 */
export function extractStatements(fullSql: string): SqlStatement[] {
  const lines = fullSql.split('\n');
  const statements: SqlStatement[] = [];
  let currentSql = '';
  let startLine = 1;
  let inString = false;
  let stringChar = '';
  let inBlockComment = false;
  let dollarTag: string | null = null;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const lineNum = lineIdx + 1;

    let i = 0;
    while (i < line.length) {
      const char = line[i];

      // 1. Inside multi-line block comment /* ... */
      if (inBlockComment) {
        if (char === '*' && i + 1 < line.length && line[i + 1] === '/') {
          currentSql += '*/';
          inBlockComment = false;
          i += 2;
          continue;
        }
        currentSql += char;
        i++;
        continue;
      }

      // 2. Inside PostgreSQL dollar-quoted block e.g. $$ ... $$ or $body$ ... $body$
      if (dollarTag !== null) {
        if (line.startsWith(dollarTag, i)) {
          currentSql += dollarTag;
          i += dollarTag.length;
          dollarTag = null;
          continue;
        }
        currentSql += char;
        i++;
        continue;
      }

      // 3. Inside standard string literal ('...', "...", `...`)
      if (inString) {
        // Backslash escaping (\' or \\ or \")
        if (char === '\\' && i + 1 < line.length) {
          currentSql += char + line[i + 1];
          i += 2;
          continue;
        }

        // Quote closing or SQL standard doubled quote ('' or "" or ``)
        if (char === stringChar) {
          if (i + 1 < line.length && line[i + 1] === stringChar) {
            currentSql += stringChar + stringChar;
            i += 2;
            continue;
          }
          inString = false;
          stringChar = '';
          currentSql += char;
          i++;
          continue;
        }

        currentSql += char;
        i++;
        continue;
      }

      // 4. Outside strings and comments: Normal SQL parsing

      // Check start of multi-line block comment /*
      if (char === '/' && i + 1 < line.length && line[i + 1] === '*') {
        if (currentSql.trim() === '') {
          startLine = lineNum;
        }
        inBlockComment = true;
        currentSql += '/*';
        i += 2;
        continue;
      }

      // Check single-line comment --
      if (char === '-' && i + 1 < line.length && line[i + 1] === '-') {
        if (currentSql.trim() === '') {
          startLine = lineNum;
        }
        currentSql += line.slice(i);
        break; // Remainder of line is comment
      }

      // Check start of string literal
      if (char === "'" || char === '"' || char === '`') {
        if (currentSql.trim() === '') {
          startLine = lineNum;
        }
        inString = true;
        stringChar = char;
        currentSql += char;
        i++;
        continue;
      }

      // Check start of PostgreSQL dollar quoting ($$ or $tag$)
      if (char === '$') {
        const remainder = line.slice(i);
        const match = remainder.match(/^\$[a-zA-Z0-9_]*\$/);
        if (match) {
          if (currentSql.trim() === '') {
            startLine = lineNum;
          }
          dollarTag = match[0];
          currentSql += dollarTag;
          i += dollarTag.length;
          continue;
        }
      }

      // Statement boundary: Semicolon ;
      if (char === ';') {
        currentSql += char;
        const trimmed = currentSql.trim();
        if (trimmed.length > 0) {
          statements.push({
            sql: trimmed,
            startLine,
            endLine: lineNum,
          });
        }
        currentSql = '';
        startLine = lineNum + 1;
        i++;

        // Peek ahead on this same line: if non-whitespace exists, startLine is current line
        const restOfLine = line.slice(i).trim();
        if (restOfLine.length > 0) {
          startLine = lineNum;
        }
        continue;
      }

      // Non-whitespace character starts statement tracking if empty
      if (currentSql.trim() === '' && !char.match(/\s/)) {
        startLine = lineNum;
      }

      currentSql += char;
      i++;
    }

    if (currentSql !== '') {
      currentSql += '\n';
    }
  }

  const remainingTrimmed = currentSql.trim();
  if (remainingTrimmed.length > 0) {
    statements.push({
      sql: remainingTrimmed,
      startLine,
      endLine: lines.length,
    });
  }

  return statements;
}

/**
 * Returns the statement that encompasses the given cursor line number.
 */
export function getStatementAtLine(fullSql: string, lineNumber: number): SqlStatement | null {
  const statements = extractStatements(fullSql);
  if (statements.length === 0) return null;

  for (const stmt of statements) {
    if (lineNumber >= stmt.startLine && lineNumber <= stmt.endLine) {
      return stmt;
    }
  }

  // If cursor is before the first statement
  if (lineNumber < statements[0].startLine) {
    return statements[0];
  }

  // If cursor is between statements, find the closest statement
  for (let idx = 0; idx < statements.length - 1; idx++) {
    if (lineNumber > statements[idx].endLine && lineNumber < statements[idx + 1].startLine) {
      return statements[idx];
    }
  }

  // Fallback to last statement
  return statements[statements.length - 1] || null;
}
