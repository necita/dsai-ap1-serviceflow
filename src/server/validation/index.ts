import { ValidationError, type ValidationIssue } from "../errors";

export function validateInput<T>(
  schema: {
    safeParse(input: unknown):
      | { success: true; data: T }
      | {
          success: false;
          error: { issues: { path: PropertyKey[]; code: string }[] };
        };
  },
  input: unknown,
): T {
  const result = schema.safeParse(input);

  if (result.success) {
    return result.data;
  }

  const issues: ValidationIssue[] = result.error.issues.map((issue) => ({
    path: issue.path.filter(
      (segment): segment is string | number =>
        typeof segment === "string" || typeof segment === "number",
    ),
    code: issue.code,
  }));

  throw new ValidationError(issues);
}
