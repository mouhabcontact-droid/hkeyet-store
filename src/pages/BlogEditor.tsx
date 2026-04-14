import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Eye, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { RichTextEditor } from '../components/RichTextEditor';
import { ImageUpload } from '../components/ImageUpload';
import { generateSlug, calculateReadingTime } from '../utils/blog';

interface BlogEditorProps {
  postId?: string;
}

export function BlogEditor({ postId }: BlogEditorProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSEO, setShowSEO] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_url: '',
    category: '',
    tags: [] as string[],
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    is_published: false,
    featured: false
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (profile === null) {
      return;
    }

    if (profile?.role !== 'admin') {
      window.location.href = '/';
      return;
    }

    setLoading(false);

    if (postId) {
      fetchPost();
    }
  }, [profile, postId]);

  const fetchPost = async () => {
    if (!postId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          title: data.title || '',
          slug: data.slug || '',
          excerpt: data.excerpt || '',
          content: data.content || '',
          cover_url: data.cover_url || '',
          category: data.category || '',
          tags: data.tags || [],
          seo_title: data.seo_title || '',
          seo_description: data.seo_description || '',
          seo_keywords: data.seo_keywords || '',
          is_published: data.is_published || false,
          featured: data.featured || false
        });
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      alert('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: postId ? prev.slug : generateSlug(title)
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag)
    }));
  };

  const handleSave = async (publish: boolean = false) => {
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (!formData.slug.trim()) {
      alert('Please enter a slug');
      return;
    }

    setSaving(true);

    try {
      const readingTime = calculateReadingTime(formData.content);

      const postData = {
        ...formData,
        reading_time: readingTime,
        is_published: publish,
        author_id: user?.id
      };

      if (postId) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', postId);

        if (error) throw error;
        alert('Post updated successfully!');
      } else {
        const { error } = await supabase.from('blog_posts').insert([postData]);

        if (error) throw error;
        alert('Post created successfully!');
        window.location.href = '/admin/blog';
      }
    } catch (error: any) {
      console.error('Error saving post:', error);
      if (error.code === '23505') {
        alert('A post with this slug already exists. Please use a different slug.');
      } else {
        alert('Failed to save post. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (profile?.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 text-[#F05A28] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <a
              href="/admin/blog"
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </a>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {postId ? 'Edit Post' : 'New Post'}
              </h1>
              <p className="text-gray-600 mt-1">
                {postId ? 'Update your blog post' : 'Create a new blog post'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Save Draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#F05A28] text-white rounded-lg hover:bg-[#d14920] transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
              Publish
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter post title..."
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:border-[#F05A28] focus:ring-2 focus:ring-[#F05A28] focus:ring-opacity-20 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="post-url-slug"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#F05A28] focus:ring-2 focus:ring-[#F05A28] focus:ring-opacity-20 outline-none font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL: https://hkeyet.store/blog/{formData.slug || 'post-slug'}
              </p>
            </div>

            <ImageUpload
              currentImage={formData.cover_url}
              onUpload={(url) => setFormData({ ...formData, cover_url: url })}
              folder="covers"
              label="Cover Image"
              aspectRatio="16/9"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Brief description of your post..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#F05A28] focus:ring-2 focus:ring-[#F05A28] focus:ring-opacity-20 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#F05A28] focus:ring-2 focus:ring-[#F05A28] focus:ring-opacity-20 outline-none"
                >
                  <option value="">Select category...</option>
                  <option value="Book News">Book News</option>
                  <option value="Literary Articles">Literary Articles</option>
                  <option value="New Releases">New Releases</option>
                  <option value="Reading Guides">Reading Guides</option>
                  <option value="Author Spotlights">Author Spotlights</option>
                  <option value="Recommendations">Recommendations</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add tag..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:border-[#F05A28] focus:ring-2 focus:ring-[#F05A28] focus:ring-opacity-20 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-blue-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-5 h-5 text-[#F05A28] border-gray-300 rounded focus:ring-[#F05A28]"
                />
                <span className="text-sm font-medium text-gray-700">Featured Post</span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <button
              type="button"
              onClick={() => setShowSEO(!showSEO)}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-xl font-bold text-gray-900">SEO Settings</h2>
              <span className="text-gray-400">{showSEO ? '−' : '+'}</span>
            </button>

            {showSEO && (
              <div className="mt-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={formData.seo_title}
                    onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                    placeholder="Optimized title for search engines..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#F05A28] focus:ring-2 focus:ring-[#F05A28] focus:ring-opacity-20 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Defaults to post title if not set. Recommended: 50-60 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Description
                  </label>
                  <textarea
                    value={formData.seo_description}
                    onChange={(e) =>
                      setFormData({ ...formData, seo_description: e.target.value })
                    }
                    placeholder="Meta description for search engines..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#F05A28] focus:ring-2 focus:ring-[#F05A28] focus:ring-opacity-20 outline-none resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Defaults to excerpt if not set. Recommended: 150-160 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Keywords
                  </label>
                  <input
                    type="text"
                    value={formData.seo_keywords}
                    onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                    placeholder="keyword1, keyword2, keyword3..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#F05A28] focus:ring-2 focus:ring-[#F05A28] focus:ring-opacity-20 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Comma-separated keywords for SEO
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
