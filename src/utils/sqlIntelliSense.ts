import { DatabaseMetadata, TableMetadata } from '../types';

export const SQL_KEYWORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'INSERT INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE FROM',
  'JOIN',
  'INNER JOIN',
  'LEFT JOIN',
  'RIGHT JOIN',
  'FULL JOIN',
  'CROSS JOIN',
  'ON',
  'GROUP BY',
  'ORDER BY',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'UNION',
  'UNION ALL',
  'DISTINCT',
  'AS',
  'AND',
  'OR',
  'NOT',
  'IN',
  'BETWEEN',
  'LIKE',
  'ILIKE',
  'IS NULL',
  'IS NOT NULL',
  'CREATE TABLE',
  'DROP TABLE',
  'ALTER TABLE',
  'TRUNCATE TABLE',
  'CREATE INDEX',
  'DROP INDEX',
  'PRIMARY KEY',
  'FOREIGN KEY',
  'REFERENCES',
  'DEFAULT',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
  'COALESCE',
  'NULLIF',
  'EXISTS',
  'CAST',
  'DESCRIBE',
  'SHOW TABLES',
  'EXPLAIN',
  'PRAGMA',
  'ASC',
  'DESC',
  'TRUE',
  'FALSE',
  'NULL',
];

export const SQL_FUNCTIONS = [
  { name: 'COUNT', snippet: 'COUNT(${1:*})', desc: 'Cuenta el número de filas o valores no nulos' },
  { name: 'SUM', snippet: 'SUM(${1:columna})', desc: 'Calcula la suma total de valores numéricos' },
  { name: 'AVG', snippet: 'AVG(${1:columna})', desc: 'Calcula el promedio de valores numéricos' },
  { name: 'MIN', snippet: 'MIN(${1:columna})', desc: 'Obtiene el valor mínimo de una columna' },
  { name: 'MAX', snippet: 'MAX(${1:columna})', desc: 'Obtiene el valor máximo de una columna' },
  { name: 'COALESCE', snippet: 'COALESCE(${1:val1}, ${2:val2})', desc: 'Retorna el primer valor no nulo' },
  { name: 'ROUND', snippet: 'ROUND(${1:numero}, ${2:2})', desc: 'Redondea un número a N decimales' },
  { name: 'NOW', snippet: 'NOW()', desc: 'Fecha y hora actual del servidor' },
  { name: 'LOWER', snippet: 'LOWER(${1:texto})', desc: 'Convierte el texto a minúsculas' },
  { name: 'UPPER', snippet: 'UPPER(${1:texto})', desc: 'Convierte el texto a mayúsculas' },
  { name: 'TRIM', snippet: 'TRIM(${1:texto})', desc: 'Elimina espacios al inicio y final' },
  { name: 'CONCAT', snippet: 'CONCAT(${1:str1}, ${2:str2})', desc: 'Concatena dos o más cadenas' },
  { name: 'LENGTH', snippet: 'LENGTH(${1:texto})', desc: 'Longitud de la cadena' },
];

export const SQL_SNIPPETS = [
  {
    label: 'sel (SELECT * FROM)',
    insertText: 'SELECT *\nFROM ${1:tabla}\nLIMIT 100;',
    detail: 'Snippet: Consulta SELECT básica con LIMIT',
  },
  {
    label: 'ins (INSERT INTO)',
    insertText: 'INSERT INTO ${1:tabla} (${2:columnas})\nVALUES (${3:valores});',
    detail: 'Snippet: Sentencia INSERT INTO plantilla',
  },
  {
    label: 'upd (UPDATE ... SET)',
    insertText: 'UPDATE ${1:tabla}\nSET ${2:columna} = ${3:valor}\nWHERE ${4:condicion};',
    detail: 'Snippet: Sentencia UPDATE con filtro WHERE',
  },
  {
    label: 'del (DELETE FROM)',
    insertText: 'DELETE FROM ${1:tabla}\nWHERE ${2:condicion};',
    detail: 'Snippet: Sentencia DELETE con filtro WHERE',
  },
  {
    label: 'join (INNER JOIN)',
    insertText: 'INNER JOIN ${1:tabla_b} ON ${1:tabla_b}.${2:id} = ${3:tabla_a}.${4:id}',
    detail: 'Snippet: Unión INNER JOIN por clave foránea',
  },
  {
    label: 'leftjoin (LEFT JOIN)',
    insertText: 'LEFT JOIN ${1:tabla_b} ON ${1:tabla_b}.${2:id} = ${3:tabla_a}.${4:id}',
    detail: 'Snippet: Unión LEFT JOIN',
  },
  {
    label: 'group (GROUP BY + COUNT)',
    insertText: 'SELECT ${1:columna}, COUNT(*) AS total\nFROM ${2:tabla}\nGROUP BY ${1:columna}\nORDER BY total DESC;',
    detail: 'Snippet: Agrupación y conteo',
  },
];

/**
 * Extracts table aliases defined in a SQL query.
 * e.g. "FROM users u" or "FROM users AS u" -> u: users
 */
export function extractTableAliases(sql: string): Map<string, string> {
  const map = new Map<string, string>();
  const regex = /(?:FROM|JOIN)\s+([a-zA-Z0-9_"`]+)(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(sql)) !== null) {
    const rawTable = match[1].replace(/[`"]/g, '');
    const alias = match[2];
    if (
      alias &&
      !['ON', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'GROUP', 'ORDER', 'LIMIT', 'SET', 'VALUES'].includes(
        alias.toUpperCase()
      )
    ) {
      map.set(alias.toLowerCase(), rawTable);
    }
  }

  return map;
}

/**
 * Builds Monaco completion items based on active database metadata, keywords, snippets, and context.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createSqlCompletionProvider(monacoInstance: any, getMetadata: () => DatabaseMetadata | null | undefined) {
  return {
    triggerCharacters: [' ', '.', '(', ',', '\n'],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provideCompletionItems: (model: any, position: any) => {
      const lineContent = model.getLineContent(position.lineNumber);
      const textUntilPosition = lineContent.substring(0, position.column - 1);
      const fullText = model.getValue();

      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const meta = getMetadata();
      const allTables: TableMetadata[] = [];
      if (meta?.schemas) {
        for (const schema of meta.schemas) {
          allTables.push(...schema.tables);
        }
      }

      // 1. Detect if cursor is right after a dot (e.g. "table." or "alias." or "schema.")
      const dotMatch = textUntilPosition.match(/([a-zA-Z0-9_]+)\.$/);
      if (dotMatch) {
        const identifier = dotMatch[1].toLowerCase();
        const aliasMap = extractTableAliases(fullText);

        // Check if identifier is an alias (e.g. "u." -> users)
        const targetTableName = aliasMap.get(identifier) || identifier;

        // Find table
        const matchingTable = allTables.find(
          (t) => t.name.toLowerCase() === targetTableName
        );

        if (matchingTable) {
          const columnSuggestions = matchingTable.columns.map((col, idx) => ({
            label: col.name,
            kind: monacoInstance.languages.CompletionItemKind.Field,
            detail: `${col.data_type}${col.is_primary_key ? ' 🔑 PK' : ''} (${matchingTable.name})`,
            documentation: {
              value: [
                `### 🏷️ Columna: \`${col.name}\``,
                `*Tabla:* **${matchingTable.name}**`,
                '',
                `- **Tipo:** \`${col.data_type}\``,
                `- **Nulo:** ${col.is_nullable ? 'Sí' : 'No'}`,
                `- **Llave primaria:** ${col.is_primary_key ? '🔑 Sí (PRIMARY KEY)' : 'No'}`,
              ].join('\n'),
            },
            insertText: col.name,
            sortText: `0_${String(idx).padStart(3, '0')}`,
            range,
          }));

          return { suggestions: columnSuggestions };
        }

        // Check if identifier is a schema name (e.g. "public.")
        const matchingSchema = meta?.schemas.find(
          (s) => s.name.toLowerCase() === identifier
        );
        if (matchingSchema) {
          const schemaTableSuggestions = matchingSchema.tables.map((t, idx) => ({
            label: t.name,
            kind: t.table_type.includes('VIEW')
              ? monacoInstance.languages.CompletionItemKind.Interface
              : monacoInstance.languages.CompletionItemKind.Class,
            detail: `${t.table_type} (${matchingSchema.name})`,
            insertText: t.name,
            sortText: `0_${String(idx).padStart(3, '0')}`,
            range,
          }));

          return { suggestions: schemaTableSuggestions };
        }
      }

      // 2. Context detection for prioritization
      const trimmedPrefix = textUntilPosition.trim();
      const lastWord = trimmedPrefix.split(/\s+/).pop()?.toUpperCase() || '';
      const isFromOrJoin = ['FROM', 'JOIN', 'INTO', 'UPDATE', 'TABLE'].includes(lastWord);
      const isSelectOrWhere = ['SELECT', 'WHERE', 'AND', 'OR', 'ON', 'SET', 'BY', 'HAVING'].includes(lastWord);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const suggestions: any[] = [];

      // A. Tables & Views
      allTables.forEach((table) => {
        const isView = table.table_type.includes('VIEW');
        suggestions.push({
          label: table.name,
          kind: isView
            ? monacoInstance.languages.CompletionItemKind.Interface
            : monacoInstance.languages.CompletionItemKind.Class,
          detail: `${table.table_type}${table.row_count_estimate ? ` (~${table.row_count_estimate >= 1000 ? (table.row_count_estimate / 1000).toFixed(1) + 'k' : table.row_count_estimate} filas)` : ''}`,
          documentation: {
            value: [
              `### 📋 ${isView ? 'Vista' : 'Tabla'}: \`${table.name}\``,
              `**Tipo:** ${table.table_type} | **Esquema:** \`${table.schema || 'main'}\``,
              table.row_count_estimate !== undefined && table.row_count_estimate !== null
                ? `**Filas estimadas:** ~${table.row_count_estimate >= 1000 ? (table.row_count_estimate / 1000).toFixed(1) + 'k' : table.row_count_estimate}`
                : '',
              '',
              '| Columna | Tipo | Nulo | PK |',
              '| :--- | :--- | :--- | :--- |',
              ...table.columns.map(
                (c) =>
                  `| **${c.name}** | \`${c.data_type}\` | ${c.is_nullable ? 'SÍ' : 'NO'} | ${
                    c.is_primary_key ? '🔑 **PK**' : '-'
                  } |`
              ),
            ].join('\n'),
          },
          insertText: table.name,
          sortText: isFromOrJoin ? `0_${table.name}` : `1_${table.name}`,
          range,
        });
      });

      // B. Columns
      allTables.forEach((table) => {
        table.columns.forEach((col) => {
          suggestions.push({
            label: col.name,
            kind: monacoInstance.languages.CompletionItemKind.Field,
            detail: `${col.data_type}${col.is_primary_key ? ' 🔑 PK' : ''} (${table.name})`,
            documentation: {
              value: [
                `### 🏷️ Columna: \`${col.name}\``,
                `*Tabla:* **${table.name}**`,
                '',
                `- **Tipo:** \`${col.data_type}\``,
                `- **Nulo:** ${col.is_nullable ? 'Sí' : 'No'}`,
                `- **Llave primaria:** ${col.is_primary_key ? '🔑 Sí (PRIMARY KEY)' : 'No'}`,
              ].join('\n'),
            },
            insertText: col.name,
            sortText: isSelectOrWhere ? `0_${col.name}` : `2_${col.name}`,
            range,
          });
        });
      });

      // C. SQL Functions
      SQL_FUNCTIONS.forEach((fn) => {
        suggestions.push({
          label: fn.name,
          kind: monacoInstance.languages.CompletionItemKind.Function,
          detail: `Función SQL: ${fn.desc}`,
          insertText: fn.snippet,
          insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          sortText: isSelectOrWhere ? `1_${fn.name}` : `3_${fn.name}`,
          range,
        });
      });

      // D. SQL Keywords
      SQL_KEYWORDS.forEach((kw) => {
        suggestions.push({
          label: kw,
          kind: monacoInstance.languages.CompletionItemKind.Keyword,
          detail: 'Palabra clave SQL',
          insertText: kw,
          sortText: `4_${kw}`,
          range,
        });
      });

      // E. SQL Snippets
      SQL_SNIPPETS.forEach((snip) => {
        suggestions.push({
          label: snip.label,
          kind: monacoInstance.languages.CompletionItemKind.Snippet,
          detail: snip.detail,
          insertText: snip.insertText,
          insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          sortText: `5_${snip.label}`,
          range,
        });
      });

      return { suggestions };
    },
  };
}
