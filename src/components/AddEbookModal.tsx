import React, { useState, useEffect } from 'react';
import { X, Upload, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';

interface AddEbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddEbookModal({ isOpen, onClose, onSuccess }: AddEbookModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [formData, setFormData] = useState({
    book_id: '',
    title: '',
    author: '',
    description: '',
    cover_image_url: '',
    file_url: '',
    format: 'EPUB' as 'EPUB' | 'PDF',
    page_count: 0,
    preview_pages: 20,
    isbn: '',
    price: 0,
    category_id: '',
    drm_enabled: true,
    download_enabled: false,
    published_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchBooks();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  };

  const fetchBooks = async () => {
    const { data } = await supabase.from('books').select('id, title, author').order('title');
    if (data) setBooks(data);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error');
      return;
    }

    setUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `ebook-cover-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('book-covers')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('book-covers').getPublicUrl(fileName);

      setFormData({ ...formData, cover_image_url: data.publicUrl });
      showToast('Cover uploaded successfully', 'success');
    } catch (error) {
      console.error('Error uploading cover:', error);
      showToast('Failed to upload cover', 'error');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/epub+zip', 'application/pdf'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.epub') && !file.name.endsWith('.pdf')) {
      showToast('Please upload an EPUB or PDF file', 'error');
      return;
    }

    setUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `ebook-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('ebooks')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('ebooks').getPublicUrl(fileName);

      const format = fileExt?.toUpperCase() === 'PDF' ? 'PDF' : 'EPUB';
      setFormData({
        ...formData,
        file_url: data.publicUrl,
        format,
        file_size: file.size
      });
      showToast('eBook file uploaded successfully', 'success');
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast('Failed to upload eBook file', 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.author || !formData.file_url) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('ebooks').insert([{
        ...formData,
        book_id: formData.book_id || null,
        category_id: formData.category_id || null,
      }]);

      if (error) throw error;

      showToast('eBook added successfully', 'success');
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error adding ebook:', error);
      showToast('Failed to add eBook', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      book_id: '',
      title: '',
      author: '',
      description: '',
      cover_image_url: '',
      file_url: '',
      format: 'EPUB',
      page_count: 0,
      preview_pages: 20,
      isbn: '',
      price: 0,
      category_id: '',
      drm_enabled: true,
      download_enabled: false,
      published_date: new Date().toISOString().split('T')[0],
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full my-8">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Add New eBook</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F05A28]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Author *
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F05A28]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link to Physical Book (Optional)
              </label>
              <select
                value={formData.book_id}
                onChange={(e) => setFormData({ ...formData, book_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F05A28]"
              >
                <option value="">None</option>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title} by {book.author}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F05A28]"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F05A28]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ISBN
              </label>
              <input
                type="text"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F05A28]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Page Count
              </label>
              <input
                type="number"
                value={formData.page_count}
                onChange={(e) => setFormData({ ...formData, page_count: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F05A28]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preview Pages
              </label>
              <input
                type="number"
                value={formData.preview_pages}
                onChange={(e) => setFormData({ ...formData, preview_pages: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F05A28]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Published Date
              </label>
              <input
                type="date"
                value={formData.published_date}
                onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F05A28]"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.drm_enabled}
                  onChange={(e) => setFormData({ ...formData, drm_enabled: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">DRM Protection</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.download_enabled}
                  onChange={(e) => setFormData({ ...formData, download_enabled: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">Allow Download</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F05A28]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cover Image
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200">
                {uploadingCover ? <Loader className="animate-spin" size={20} /> : <Upload size={20} />}
                <span className="ml-2">Upload Cover</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                  disabled={uploadingCover}
                />
              </label>
              {formData.cover_image_url && (
                <img src={formData.cover_image_url} alt="Cover" className="h-16 rounded" />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              eBook File (EPUB or PDF) *
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center px-4 py-2 bg-[#F05A28] text-white rounded-lg cursor-pointer hover:bg-[#d94d20]">
                {uploadingFile ? <Loader className="animate-spin" size={20} /> : <Upload size={20} />}
                <span className="ml-2">Upload File</span>
                <input
                  type="file"
                  accept=".epub,.pdf,application/epub+zip,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingFile}
                />
              </label>
              {formData.file_url && (
                <span className="text-sm text-green-600">File uploaded ({formData.format})</span>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingCover || uploadingFile}
              className="px-6 py-2 bg-[#F05A28] text-white rounded-lg hover:bg-[#d94d20] disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add eBook'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
