/**
 * Applies template token substitution.
 * Replaces {{date}} and {{title}} globally.
 * Strips .md extension from vars.title before substitution.
 */
export function applyTokens(content: string, vars: { title: string; date: string }): string {
  const title = vars.title.replace(/\.md$/, '');
  return content
    .replace(/\{\{date\}\}/g, vars.date)
    .replace(/\{\{title\}\}/g, title);
}
