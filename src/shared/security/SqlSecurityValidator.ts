/**
 * SQL 安全校验器
 * 确保只执行安全的只读查询，防止危险操作
 */

export interface SecurityPolicyConfig {
  /** 查询超时（毫秒） */
  queryTimeout: number;
  /** 最大结果集行数 */
  maxResultRows: number;
  /** 是否允许 JOIN */
  allowJoin: boolean;
  /** 是否允许子查询 */
  allowSubquery: boolean;
}

export interface ValidationResult {
  /** 是否通过校验 */
  isValid: boolean;
  /** 错误信息 */
  errors: string[];
  /** 警告信息 */
  warnings: string[];
}

export class SqlSecurityValidator {
  private config: SecurityPolicyConfig;

  /** 危险关键词黑名单 */
  private readonly DANGEROUS_KEYWORDS = [
    'DROP',
    'DELETE',
    'UPDATE',
    'INSERT',
    'CREATE',
    'ALTER',
    'TRUNCATE',
    'GRANT',
    'REVOKE',
    'EXEC',
    'EXECUTE',
  ];

  /** 危险函数黑名单 */
  private readonly DANGEROUS_FUNCTIONS = [
    'pg_sleep',
    'benchmark',
    'load_file',
    'into outfile',
    'system',
  ];

  constructor(config?: Partial<SecurityPolicyConfig>) {
    this.config = {
      queryTimeout: config?.queryTimeout ?? 30000,
      maxResultRows: config?.maxResultRows ?? 1000,
      allowJoin: config?.allowJoin ?? true,
      allowSubquery: config?.allowSubquery ?? true,
    };
  }

  /**
   * 校验 SQL 查询是否安全
   */
  validate(sql: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const cleanSql = this.cleanSql(sql);
    const upperSql = cleanSql.toUpperCase();

    // 1. 检查是否为空
    if (!cleanSql.trim()) {
      errors.push('SQL 语句不能为空');
      return { isValid: false, errors, warnings };
    }

    // 2. 检查是否只包含 SELECT 语句
    if (!this.isSelectQuery(upperSql)) {
      errors.push('只允许 SELECT 查询');
    }

    // 3. 检查危险关键词
    const foundDangerousKeywords = this.findDangerousKeywords(upperSql);
    if (foundDangerousKeywords.length > 0) {
      errors.push(`检测到危险关键词: ${foundDangerousKeywords.join(', ')}`);
    }

    // 4. 检查危险函数
    const foundDangerousFunctions = this.findDangerousFunctions(upperSql);
    if (foundDangerousFunctions.length > 0) {
      errors.push(`检测到危险函数: ${foundDangerousFunctions.join(', ')}`);
    }

    // 5. 检查 SQL 注入风险
    if (this.hasSqlInjectionRisk(cleanSql)) {
      errors.push('检测到潜在的 SQL 注入风险');
    }

    // 6. 检查多条语句
    if (this.hasMultipleStatements(cleanSql)) {
      errors.push('不允许执行多条 SQL 语句');
    }

    // 7. 警告：JOIN 操作
    if (!this.config.allowJoin && upperSql.includes('JOIN')) {
      warnings.push('该策略不建议使用 JOIN 操作');
    }

    // 8. 警告：子查询
    if (!this.config.allowSubquery && this.hasSubquery(upperSql)) {
      warnings.push('该策略不建议使用子查询');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 校验并抛出异常
   */
  validateOrThrow(sql: string): void {
    const result = this.validate(sql);
    if (!result.isValid) {
      throw new Error(`SQL 安全校验失败: ${result.errors.join('; ')}`);
    }
  }

  // 私有方法
  private cleanSql(sql: string): string {
    let cleaned = sql.replace(/--[^\n]*/g, '');
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
    return cleaned.replace(/\s+/g, ' ').trim();
  }

  private isSelectQuery(sql: string): boolean {
    return sql.trim().startsWith('SELECT');
  }

  private findDangerousKeywords(sql: string): string[] {
    const found: string[] = [];
    for (const keyword of this.DANGEROUS_KEYWORDS) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(sql)) {
        found.push(keyword);
      }
    }
    return found;
  }

  private findDangerousFunctions(sql: string): string[] {
    const found: string[] = [];
    for (const func of this.DANGEROUS_FUNCTIONS) {
      if (sql.includes(func.toUpperCase())) {
        found.push(func);
      }
    }
    return found;
  }

  private hasSqlInjectionRisk(sql: string): boolean {
    const injectionPatterns = [
      /;.*DROP/i,
      /;.*DELETE/i,
      /UNION.*SELECT/i,
      /1=1/,
      /OR\s+1=1/i,
    ];
    return injectionPatterns.some((pattern) => pattern.test(sql));
  }

  private hasMultipleStatements(sql: string): boolean {
    const statements = sql.split(';').filter((s) => s.trim().length > 0);
    return statements.length > 1;
  }

  private hasSubquery(sql: string): boolean {
    const selectCount = (sql.match(/SELECT/gi) || []).length;
    return selectCount > 1;
  }

  getConfig(): SecurityPolicyConfig {
    return { ...this.config };
  }
}
