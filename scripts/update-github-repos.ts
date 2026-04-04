require('dotenv').config();
const fs = require('fs/promises');
const path = require('path');
const axios = require('axios');

const readmeFilePath = path.resolve(__dirname, '../README.md');

const START_REPOS_MARKER = '<!-- GITHUB-REPOS:START -->';
const END_REPOS_MARKER = '<!-- GITHUB-REPOS:END -->';
const REPOS_MARKER_FINDER = new RegExp(
  START_REPOS_MARKER + '(.|[\r\n])*?' + END_REPOS_MARKER
);

const GITHUB_USERNAME = 'orguetta';
const GITHUB_API_URL = 'https://api.github.com';

async function main(): Promise<void> {
  try {
    const repos = await getTopRepositories();
    const reposMarkup = generateReposMarkup(repos);
    const template = await getTemplate();

    const newReadMe = template.replace(
      REPOS_MARKER_FINDER,
      START_REPOS_MARKER + reposMarkup + END_REPOS_MARKER
    );

    await saveReadMe(newReadMe);
    console.log(`✅ Updated README with ${repos.length} top repositories`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error updating repositories section:', errorMessage);
    process.exit(1);
  }
}

async function getTopRepositories(limit: number = 5): Promise<any[]> {
  try {
    const response = await axios.get(
      `${GITHUB_API_URL}/users/${GITHUB_USERNAME}/repos`,
      {
        params: {
          sort: 'stars',
          order: 'desc',
          per_page: limit,
          type: 'owner',
        },
        headers: process.env.GITHUB_TOKEN
          ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
          : {},
      }
    );

    return response.data.map((repo: any) => ({
      name: repo.name,
      description: repo.description || 'No description',
      url: repo.html_url,
      stars: repo.stargazers_count,
      language: repo.language || 'N/A',
    }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch repositories: ${errorMessage}`);
  }
}

function generateReposMarkup(repos: any[]): string {
  if (repos.length === 0) {
    return '<p>No repositories available yet.</p>';
  }

  const reposList = repos
    .map((repo) => {
      const langBadge = repo.language ? ` ![${repo.language}](https://img.shields.io/badge/${repo.language}-blue)` : '';
      const starBadge = repo.stars > 0 ? ` ⭐ ${repo.stars}` : '';
      return `- [${repo.name}](${repo.url}) - ${repo.description}${langBadge}${starBadge}`;
    })
    .join('\n');

  return `\n${reposList}\n`;
}

async function getTemplate(): Promise<string> {
  return await fs.readFile(readmeFilePath, 'utf-8');
}

async function saveReadMe(content: string): Promise<void> {
  await fs.writeFile(readmeFilePath, content);
}

main();
