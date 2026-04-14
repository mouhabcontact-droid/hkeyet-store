import { useState, useEffect } from 'react';
import { Download, Eye, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../utils/navigation';
import { Toast } from '../components/Toast';

interface Manuscript {
  id: string;
  user_id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  file_size: number;
  status: 'not_reviewed' | 'reviewing' | 'accepted' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    email: string;
    full_name: string | null;
  };
}

export default function ManageManuscripts() {
  const { user, profile } = useAuth();
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedManuscript, setSelectedManuscript] = useState<Manuscript | null>(null);
  const [updating, setUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [updateForm, setUpdateForm] = useState({
    status: '',
    admin_notes: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (profile?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadManuscripts();
  }, [user, profile, navigate]);

  const loadManuscripts = async () => {
    try {
      const { data, error } = await supabase
        .from('manuscripts')
        .select(`
          *,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setManuscripts(data || []);
    } catch (error) {
      console.error('Error loading manuscripts:', error);
      setToast({ message: 'Failed to load manuscripts', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (manuscript: Manuscript) => {
    try {
      const { data, error } = await supabase.storage
        .from('manuscripts')
        .download(manuscript.file_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = manuscript.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      setToast({ message: 'Failed to download file', type: 'error' });
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManuscript) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('manuscripts')
        .update({
          status: updateForm.status,
          admin_notes: updateForm.admin_notes || null
        })
        .eq('id', selectedManuscript.id);

      if (error) throw error;

      setToast({ message: 'Manuscript updated successfully', type: 'success' });
      setSelectedManuscript(null);
      setUpdateForm({ status: '', admin_notes: '' });
      loadManuscripts();
    } catch (error) {
      console.error('Error updating manuscript:', error);
      setToast({ message: 'Failed to update manuscript', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const openUpdateModal = (manuscript: Manuscript) => {
    setSelectedManuscript(manuscript);
    setUpdateForm({
      status: manuscript.status,
      admin_notes: manuscript.admin_notes || ''
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'rejected':
        return <XCircle className="text-red-500" size={20} />;
      case 'reviewing':
        return <Eye className="text-blue-500" size={20} />;
      default:
        return <Clock className="text-gray-500" size={20} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'not_reviewed':
        return 'Not Reviewed';
      case 'reviewing':
        return 'Under Review';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const filteredManuscripts = filterStatus === 'all'
    ? manuscripts
    : manuscripts.filter(m => m.status === filterStatus);

  const statusCounts = {
    all: manuscripts.length,
    not_reviewed: manuscripts.filter(m => m.status === 'not_reviewed').length,
    reviewing: manuscripts.filter(m => m.status === 'reviewing').length,
    accepted: manuscripts.filter(m => m.status === 'accepted').length,
    rejected: manuscripts.filter(m => m.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Manage Manuscripts</h1>

          <div className="flex gap-2 mb-6 overflow-x-auto">
            {[
              { key: 'all', label: 'All' },
              { key: 'not_reviewed', label: 'Not Reviewed' },
              { key: 'reviewing', label: 'Under Review' },
              { key: 'accepted', label: 'Accepted' },
              { key: 'rejected', label: 'Rejected' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  filterStatus === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {label} ({statusCounts[key as keyof typeof statusCounts]})
              </button>
            ))}
          </div>
        </div>

        {filteredManuscripts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No manuscripts found</h3>
            <p className="text-gray-500">
              {filterStatus === 'all'
                ? 'No manuscripts have been submitted yet.'
                : `No manuscripts with status "${getStatusText(filterStatus)}".`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredManuscripts.map((manuscript) => (
                    <tr key={manuscript.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{manuscript.title}</div>
                          {manuscript.description && (
                            <div className="text-sm text-gray-500 line-clamp-1">{manuscript.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {manuscript.profiles?.full_name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">{manuscript.profiles?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{manuscript.file_name}</div>
                        <div className="text-sm text-gray-500">{formatFileSize(manuscript.file_size)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(manuscript.status)}
                          <span className="text-sm text-gray-900">{getStatusText(manuscript.status)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(manuscript.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownload(manuscript)}
                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded"
                            title="Download"
                          >
                            <Download size={18} />
                          </button>
                          <button
                            onClick={() => openUpdateModal(manuscript)}
                            className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded"
                            title="Update Status"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedManuscript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Update Manuscript Status</h2>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{selectedManuscript.title}</h3>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Author:</span> {selectedManuscript.profiles?.full_name || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Email:</span> {selectedManuscript.profiles?.email}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">File:</span> {selectedManuscript.file_name}
                </p>
                {selectedManuscript.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Description:</span> {selectedManuscript.description}
                  </p>
                )}
              </div>

              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    required
                    value={updateForm.status}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select status</option>
                    <option value="not_reviewed">Not Reviewed</option>
                    <option value="reviewing">Under Review</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={updateForm.admin_notes}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, admin_notes: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add notes for the author (optional)"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {updating ? 'Updating...' : 'Update Status'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedManuscript(null);
                      setUpdateForm({ status: '', admin_notes: '' });
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
