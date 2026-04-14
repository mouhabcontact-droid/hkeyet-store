import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Plus } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddBookModal({ isOpen, onClose, onSuccess }: AddBookModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [newAuthorName, setNewAuthorName] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    isbn: '',
    pages: '',
    category_id: '',
    cover_url: '',
    publisher: 'HKEYET Publishing',
    release_date: new Date().toISOString().split('T')[0],
    is_featured: false,
    is_bestseller: false,
    is_new_release: false,
  });

  useEffect(() => {
    if (isOpen) {
      fetchCategoriesAndAuthors();
    }
  }, [isOpen]);

  const fetchCategoriesAndAuthors = async () => {
    try {
      const [categoriesData, authorsData] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('authors').select('*').order('name'),
      ]);

      setCategories(categoriesData.data || []);
      setAuthors(authorsData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image must be less than 5MB', 'error');
        return;
      }

      if (!file.type.startsWith('image/')) {
        showToast('File must be an image', 'error');
        return;
      }

      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadCoverImage = async (): Promise<string | null> => {
    if (!coverImageFile) return formData.cover_url || null;

    setUploading(true);
    try {
      const fileExt = coverImageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('book-covers')
        .upload(filePath, coverImageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('book-covers')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      showToast('Failed to upload image', 'error');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAddNewAuthor = async () => {
    if (!newAuthorName.trim()) {
      showToast('Please enter author name', 'error');
      return;
    }

    try {
      const slug = newAuthorName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data: newAuthor, error } = await supabase
        .from('authors')
        .insert([{ name: newAuthorName.trim(), slug }])
        .select()
        .single();

      if (error) throw error;

      setAuthors((prev) => [...prev, newAuthor].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedAuthors((prev) => [...prev, newAuthor.id]);
      setNewAuthorName('');
      showToast('Author added successfully!', 'success');
    } catch (error: any) {
      console.error('Error adding author:', error);
      showToast(error.message || 'Failed to add author', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const coverUrl = await uploadCoverImage();

      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data: book, error: bookError } = await supabase
        .from('books')
        .insert([
          {
            title: formData.title,
            slug,
            description: formData.description,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock),
            isbn: formData.isbn || null,
            pages: formData.pages ? parseInt(formData.pages) : null,
            category_id: formData.category_id || null,
            cover_url: coverUrl,
            publisher: formData.publisher,
            release_date: formData.release_date,
            is_featured: formData.is_featured,
            is_bestseller: formData.is_bestseller,
            is_new_release: formData.is_new_release,
          },
        ])
        .select()
        .single();

      if (bookError) throw bookError;

      if (selectedAuthors.length > 0 && book) {
        const bookAuthors = selectedAuthors.map((authorId) => ({
          book_id: book.id,
          author_id: authorId,
        }));

        const { error: authorsError } = await supabase
          .from('book_authors')
          .insert(bookAuthors);

        if (authorsError) throw authorsError;
      }

      showToast('Book added successfully!', 'success');
      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error adding book:', error);
      showToast(error.message || 'Failed to add book', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      stock: '',
      isbn: '',
      pages: '',
      category_id: '',
      cover_url: '',
      publisher: 'HKEYET Publishing',
      release_date: new Date().toISOString().split('T')[0],
      is_featured: false,
      is_bestseller: false,
      is_new_release: false,
    });
    setSelectedAuthors([]);
    setCoverImageFile(null);
    setCoverPreview('');
    setNewAuthorName('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const toggleAuthor = (authorId: string) => {
    setSelectedAuthors((prev) =>
      prev.includes(authorId)
        ? prev.filter((id) => id !== authorId)
        : [...prev, authorId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Add New Book</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Book title"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F05A28] focus:border-transparent"
                placeholder="Book description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F05A28] focus:border-transparent"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price * ($)
              </label>
              <Input
                type="number"
                step="0.01"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock *
              </label>
              <Input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ISBN
              </label>
              <Input
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
                placeholder="978-1-234567-89-0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pages
              </label>
              <Input
                type="number"
                name="pages"
                value={formData.pages}
                onChange={handleChange}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Publisher
              </label>
              <Input
                name="publisher"
                value={formData.publisher}
                onChange={handleChange}
                placeholder="Publisher name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Release Date
              </label>
              <Input
                type="date"
                name="release_date"
                value={formData.release_date}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image
              </label>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#F05A28] transition-colors">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">Upload from device</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>

                  {coverPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImageFile(null);
                        setCoverPreview('');
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {coverPreview && (
                  <div className="relative w-32 h-48 border rounded-lg overflow-hidden">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="text-xs text-gray-500">OR</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>

                <Input
                  name="cover_url"
                  value={formData.cover_url}
                  onChange={handleChange}
                  placeholder="Enter image URL"
                  disabled={!!coverImageFile}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Authors
              </label>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newAuthorName}
                    onChange={(e) => setNewAuthorName(e.target.value)}
                    placeholder="Add new author name"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewAuthor();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddNewAuthor}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>

                <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {authors.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No authors yet. Add one above!
                    </p>
                  ) : (
                    authors.map((author) => (
                      <label key={author.id} className="flex items-center gap-2 mb-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAuthors.includes(author.id)}
                          onChange={() => toggleAuthor(author.id)}
                          className="w-4 h-4 text-[#F05A28] border-gray-300 rounded focus:ring-[#F05A28]"
                        />
                        <span className="text-sm text-gray-700">{author.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#F05A28] border-gray-300 rounded focus:ring-[#F05A28]"
                />
                <span className="text-sm text-gray-700">Featured Book</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_bestseller"
                  checked={formData.is_bestseller}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#F05A28] border-gray-300 rounded focus:ring-[#F05A28]"
                />
                <span className="text-sm text-gray-700">Bestseller</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_new_release"
                  checked={formData.is_new_release}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#F05A28] border-gray-300 rounded focus:ring-[#F05A28]"
                />
                <span className="text-sm text-gray-700">New Release</span>
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={loading || uploading}
            >
              {uploading ? 'Uploading...' : loading ? 'Adding...' : 'Add Book'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
