require('dotenv').config();
const fs = require('fs/promises');
const path = require('path');
const Parser = require('rss-parser');

const readmeFilePath = path.resolve(__dirname, '../README.md');

const START_BLOG_MARKER = '<!-- BLOG-LIST:START -->';
const END_BLOG_MARKER = '<!-- BLOG-LIST:END -->';
const BLOG_MARKER_FINDER = new RegExp(
  START_BLOG_MARKER + '(.|[\r\n])*?' + END_BLOG_MARKER
);

const BLOG_RSS_URL = 'https://or.guetta.tech/rss.xml';

async function main(): Promise<void> {
  try {
    const posts = await getLatestBlogPosts();
    const blogMarkup = generateBlogMarkup(posts);
    const template = await getTemplate();

    const newReadMe = template.replace(
      BLOG_MARKER_FINDER,
      START_BLOG_MARKER + blogMarkup + END_BLOG_MARKER
    );

    await saveReadMe(newReadMe);
    console.log(`✅ Updated README with ${posts.length} latest blog posts`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error updating blog section:', errorMessage);
    process.exit(1);
  }
}

async function getLatestBlogPosts(limit: number = 5): Promise<any[]> {
  const parser = new Parser();

  try {
    const feed = await parser.parseURL(BLOG_RSS_URL);
    
    return feed.items
      .slice(0, limit)
      .map((item: any) => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
      }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch RSS feed: ${errorMessage}`);
  }
}

function generateBlogMarkup(posts: any[]): string {
  if (posts.length === 0) {
    return '<p>No blog posts available yet.</p>';
  }

  const postsList = posts
    .map((post) => {
      return `- [${post.title}](${post.link})`;
    })
    .join('\n');

  return `\n${postsList}\n`;
}

async function getTemplate(): Promise<string> {
  return await fs.readFile(readmeFilePath, 'utf-8');
}

async function saveReadMe(content: string): Promise<void> {
  await fs.writeFile(readmeFilePath, content);
}

main();
