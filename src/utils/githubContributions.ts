import { Action, Source } from '../types';

/**
 * Converts an Action object into a standardized Markdown format with Frontmatter.
 */
export const actionToMarkdown = (action: Action, comment: string): string => {
  const frontmatter = `---
type: action
approved: false
comment: "${comment.replace(/"/g, '\\"')}"
submittedAt: "${new Date().toISOString()}"
---`;

  return `${frontmatter}

# ${action.name}

## Contributor Comment
${comment}

## Data
\`\`\`json
${JSON.stringify(action, null, 2)}
\`\`\`
`;
};

/**
 * Converts a Source object into a standardized Markdown format with Frontmatter.
 */
export const sourceToMarkdown = (source: Source, comment: string): string => {
  const frontmatter = `---
type: source
approved: false
comment: "${comment.replace(/"/g, '\\"')}"
submittedAt: "${new Date().toISOString()}"
---`;

  return `${frontmatter}

# ${source.name}

## Contributor Comment
${comment}

## Data
\`\`\`json
${JSON.stringify(source, null, 2)}
\`\`\`
`;
};

/**
 * Generates a GitHub Issue URL pre-filled with the contribution data.
 */
export const getGithubIssueUrl = (content: string, fileName: string): string => {
  const owner = 'MaxRebhorn'; // Set as default for this project
  const repo = 'fencing-sequencer';
  const body = encodeURIComponent(content);
  const title = encodeURIComponent(`Contribution: ${fileName}`);

  return `https://github.com/${owner}/${repo}/issues/new?title=${title}&body=${body}`;
};
