import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { blogService, BlogPost } from '../services/blogService';

const BlogPostDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchBlogPost = async () => {
      if (!slug) {
        setError('Invalid blog post');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const post = await blogService.getBlogPost(slug);
        if (!cancelled) setBlogPost(post);
      } catch {
        if (!cancelled) setError('Blog post not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBlogPost();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <section className="max-w-4xl mx-auto px-4 md:px-8 pt-24 sm:pt-[200px] md:pt-[220px] pb-32 text-[#4E1B00] min-w-0 overflow-x-hidden w-full max-w-[100vw]">
        <div className="text-center">
          <div className="text-[#BCADA5] text-lg">Loading blog post...</div>
        </div>
      </section>
    );
  }

  if (error || !blogPost) {
    return (
      <section className="max-w-4xl mx-auto px-4 md:px-8 pt-24 sm:pt-[200px] md:pt-[220px] pb-32 text-[#4E1B00] min-w-0 overflow-x-hidden w-full max-w-[100vw]">
        <div className="text-center">
          <div className="text-red-600 text-lg">{error ?? 'Blog post not found'}</div>
          <Link
            to="/blog"
            className="mt-4 inline-block px-6 py-2 rounded-full bg-[#DED7CD] text-[#AA6641] font-['Luxurious_Roman'] text-[18px] tracking-wide border border-[#CAC3BC] shadow-inner transition hover:opacity-90"
          >
            Back to Blog
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-4 md:px-8 pt-24 sm:pt-[200px] md:pt-[220px] pb-32 text-[#4E1B00] min-w-0 overflow-x-hidden w-full max-w-[100vw]">
      {/* Back to Blog Link */}
      <div className="mb-8">
        <Link
          to="/blog"
          className="inline-flex items-center text-[#BCADA5] hover:text-[#AA6641] transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Blog
        </Link>
      </div>

      {/* Featured Image */}
      {blogPost.featuredImage && (
        <div className="mb-8">
          <img
            src={blogPost.featuredImage}
            alt={blogPost.title}
            className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
          />
        </div>
      )}

      {/* Article Header */}
      <header className="mb-8">
        {/* Category */}
        <div className="mb-4">
          <span className="inline-block px-3 py-1 bg-[#DED7CD] text-[#AA6641] rounded-full text-sm font-medium">
            {blogPost.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="font-['Lusitana'] text-4xl md:text-5xl tracking-wide mb-4 leading-tight">
          {blogPost.title}
        </h1>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-4 text-[#BCADA5] text-sm mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span>By LUNARA Team</span>
          </div>

          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{blogService.formatDate(blogPost.publishDate ?? blogPost.createdAt)}</span>
          </div>

          {blogPost.readTime && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{blogPost.readTime} min read</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span>{blogPost.viewCount} views</span>
          </div>
        </div>

        {/* Excerpt */}
        <div className="text-lg text-[#BCADA5] leading-relaxed border-l-4 border-[#DED7CD] pl-6 mb-8">
          {blogPost.excerpt}
        </div>
      </header>

      {/* Tags */}
      {blogPost.tags.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {blogPost.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-[#F5F5F5] text-[#666] rounded-full text-sm">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Article Content */}
      <article className="prose prose-lg max-w-none">
        <div
          className="font-['Luxurious_Roman'] text-[18px] leading-relaxed text-[#4E1B00]"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blogPost.content) }}
        />
      </article>

      {/* Article Footer */}
      <footer className="mt-12 pt-8 border-t border-[#DED7CD]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="font-['Lusitana'] text-xl text-[#4E1B00] mb-2">About LUNARA</h3>
            <p className="text-[#BCADA5]">
              The LUNARA team is dedicated to sharing insights and experiences to support new mothers and families.
            </p>
          </div>

          <div className="flex gap-4">
            <Link
              to="/blog"
              className="px-6 py-2 rounded-full bg-[#DED7CD] text-[#AA6641] font-['Luxurious_Roman'] text-[18px] tracking-wide border border-[#CAC3BC] shadow-inner transition hover:opacity-90"
            >
              More Posts
            </Link>
          </div>
        </div>
      </footer>
    </section>
  );
};

export default BlogPostDetail;
