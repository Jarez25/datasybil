export interface SqlStatement {
  sql: string;
  startLine: number;
  endLine: number;
}

/**
 * Splits an SQL script into discrete statements, respecting string literals,
 * comments (-- and /* *\/) and semicolons.
 */
export function extractStatements(fullSql: string): SqlStatement[] {
  const lines = fullSql.split('\n');
  const statements: SqlStatement[] = [];
  let currentSql = '';
  let startLine = 1;
  let inString = false;
  let stringChar = '';

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const lineNum = lineIdx + 1;

    if (currentSql.trim() === '') {
      startLine = lineNum;
    }

    let i = 0;
    while (i < line.length) {
      const char = line[i];

      // Single line comments --
      if (!inString && char === '-' && i + 1 < line.length && line[i + 1] === '-') {
        currentSql += line.slice(i) + '\n';
        break;
      }

      // String quotes (', ", `)
      if (char === "'" || char === '"' || char === '`') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (stringChar === char) {
          // Escaped quote e.g. ''
          if (i + 1 < line.length && line[i + 1] === char) {
            currentSql += char + char;
            i += 2;
            continue;
          }
          inString = false;
        }
      }

      // Semicolon statement boundary
      if (!inString && char === ';') {
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
        i++;
        startLine = lineNum;
        continue;
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

  // Fallback to closest statement
  return statements[statements.length - 1] || null;
}
