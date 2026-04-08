/**
 * @module BlogPage
 * Public blog listing page. Fetches published posts from the blog API
 * and renders them as cards with excerpts and "Read More" links.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogService, BlogPost } from '../services/blogService';

/**
 * Truncates a text string to a maximum word count.
 * @param text - The source string to truncate.
 * @param wordLimit - Maximum number of words to keep (default 30).
 * @returns The original text if within the limit, otherwise truncated with ellipsis.
 */
const truncateText = (text: string, wordLimit: number = 30): string => {
  const words = text.split(' ');
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(' ') + '...';
};

/**
 * Blog listing page rendered at `/blog`.
 * Displays a responsive grid of published blog post cards.
 * @returns The blog post grid, a loading indicator, or an error message.
 */
const BlogPage: React.FC = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setLoading(true);
        const response = await blogService.getBlogPosts({ limit: 10 });
        setBlogPosts(response.posts);
      } catch {
        setError('Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  if (loading) {
    return (
      <section className="max-w-full md:max-w-[1076px] mx-auto px-4 md:px-8 pt-24 sm:pt-[200px] md:pt-[220px] pb-32 text-[#4E1B00] min-w-0 overflow-x-hidden">
        <div className="text-center">
          <div className="text-[#BCADA5] text-lg">Loading blog posts...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="max-w-full md:max-w-[1076px] mx-auto px-4 md:px-8 pt-24 sm:pt-[200px] md:pt-[220px] pb-32 text-[#4E1B00] min-w-0 overflow-x-hidden">
        <div className="text-center">
          <div className="text-red-600 text-lg">{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-full md:max-w-[1076px] mx-auto px-4 md:px-8 pt-24 sm:pt-[200px] md:pt-[220px] pb-32 text-[#4E1B00] min-w-0 overflow-x-hidden">
      {blogPosts.length === 0 ? (
        <div className="text-center mt-16">
          <div className="text-[#BCADA5] text-lg">
            No blog posts available yet. Check back soon!
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 justify-items-center">
          {blogPosts.map(post => {
            const date = blogService.formatDate(post.publishDate ?? post.createdAt);
            return (
              <article
                key={post.id}
                className="bg-[#FAF7F2] shadow-[0_4px_19px_rgba(78,27,0,0.17)] px-6 py-5 md:px-8 md:py-6 rounded-md relative"
              >
                <div className="flex items-center gap-3 mb-3">
                  <p className="font-['Lusitana'] text-[16px] text-[#BCADA5] tracking-wide">
                    {date}
                  </p>
                  <span className="h-px flex-1 bg-[#A1AEAF] block" />
                </div>

                <h2 className="font-['Lusitana'] text-[26px] md:text-[28px] tracking-wide mb-3 leading-snug">
                  {post.title}
                </h2>

                <p className="font-['Luxurious_Roman'] text-[18px] leading-snug mb-6 max-w-3xl">
                  {truncateText(post.excerpt, 20)}
                </p>

                <Link
                  to={`/blog/${post.slug}`}
                  className="px-6 py-2 rounded-full bg-[#DED7CD] text-[#AA6641] font-['Luxurious_Roman'] text-[18px] tracking-wide border border-[#CAC3BC] shadow-inner transition hover:opacity-90"
                >
                  Read More
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default BlogPage;
