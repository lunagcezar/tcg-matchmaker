export type ValidationResult<T> =
  { success: true; data: T } | { success: false; error: string; issues: string[] };

interface SafeParseIssue {
  message: string;
}

interface SafeParseError {
  issues: SafeParseIssue[];
}

interface SafeParseSchema<T> {
  safeParse(body: unknown): { success: false; error: SafeParseError } | { success: true; data: T };
}

export function validate<T>(schema: SafeParseSchema<T>, body: unknown): ValidationResult<T> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => i.message);
    return { success: false, error: `Validation failed: ${issues.join(', ')}`, issues };
  }
  return { success: true, data: parsed.data };
}
