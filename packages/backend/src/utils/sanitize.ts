export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>?/gm, '');
}

export function basicPromptInjectionGuard(input: string): boolean {
  const patterns = [
    /ignore\s+previous\s+instructions/i,
    /disregard\s+all\s+rules/i,
    /system:\s*|assistant:\s*/i,
    /pretend\s+to\s+be/i,
  ];
  return patterns.some((rx) => rx.test(input));
}
