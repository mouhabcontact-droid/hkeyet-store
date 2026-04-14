import React, { useEffect, useState, useRef } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Settings, Bookmark, BookmarkCheck, Highlighter as Highlight, X, Menu, Sun, Moon, Type, Search, Home, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../utils/navigation';
import { useToast } from '../components/Toast';
import * as pdfjsLib from 'pdfjs-dist';
import { parseEpubFromUrl, type EpubChapter } from '../utils/epubReader';
import { BookPageFlip } from '../components/BookPageFlip';

interface ReaderProps {
  ebookId: string;
  preview?: boolean;
}

export function Reader({ ebookId, preview = false }: ReaderProps) {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [ebook, setEbook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [readingProgress, setReadingProgress] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [epubChapters, setEpubChapters] = useState<EpubChapter[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [internalPage, setInternalPage] = useState(1);
  const [totalInternalPages, setTotalInternalPages] = useState(1);

  const [readerSettings, setReaderSettings] = useState({
    theme: 'light' as 'light' | 'dark' | 'sepia',
    fontSize: 18,
    fontFamily: 'Georgia' as 'Georgia' | 'Arial' | 'Times New Roman',
    lineHeight: 1.6,
    margin: 'medium' as 'narrow' | 'medium' | 'wide',
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const sessionStart = useRef<Date>(new Date());
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user && !preview) {
      navigate('/login');
      return;
    }

    fetchEbook();
  }, [user, authLoading, ebookId]);

  useEffect(() => {
    if (fileUrl && ebook?.format === 'PDF') {
      loadPdfContent();
    } else if (fileUrl && ebook?.format === 'EPUB') {
      loadEpubContent();
    }
  }, [fileUrl, ebook]);

  useEffect(() => {
    return () => {
      saveReadingProgress();
    };
  }, [currentPage, readingProgress]);

  const fetchEbook = async () => {
    setLoading(true);
    try {
      const { data: ebookData } = await supabase
        .from('ebooks')
        .select('*')
        .eq('id', ebookId)
        .maybeSingle();

      if (!ebookData) {
        showToast('eBook not found', 'error');
        navigate('/ebooks');
        return;
      }

      setEbook(ebookData);

      if (ebookData.file_url) {
        try {
          const urlObj = new URL(ebookData.file_url);
          if (urlObj.hostname.includes('supabase')) {
            const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^\/]+)\/(.+)/);

            if (pathMatch) {
              const bucket = pathMatch[1];
              const fileName = pathMatch[2];

              const { data: publicUrlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

              if (publicUrlData?.publicUrl) {
                setFileUrl(publicUrlData.publicUrl);
              } else {
                setFileUrl(ebookData.file_url);
              }
            } else {
              setFileUrl(ebookData.file_url);
            }
          } else {
            setFileUrl(ebookData.file_url);
          }
        } catch (error) {
          console.error('Error parsing file URL:', error);
          setFileUrl(ebookData.file_url);
        }
      }

      if (user && !preview) {
        const { data: libraryItem } = await supabase
          .from('user_library')
          .select('*')
          .eq('user_id', user.id)
          .eq('ebook_id', ebookId)
          .maybeSingle();

        if (!libraryItem) {
          showToast('You do not own this eBook', 'error');
          navigate('/ebooks');
          return;
        }

        setCurrentPage(libraryItem.current_page || 1);
        setReadingProgress(libraryItem.reading_progress || 0);

        const { data: bookmarksData } = await supabase
          .from('bookmarks')
          .select('*')
          .eq('user_id', user.id)
          .eq('ebook_id', ebookId)
          .order('created_at', { ascending: false });

        if (bookmarksData) {
          setBookmarks(bookmarksData);
          setIsBookmarked(bookmarksData.some(b => b.page_number === currentPage));
        }

        await supabase
          .from('user_library')
          .update({ last_opened: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('ebook_id', ebookId);
      }
    } catch (error) {
      console.error('Error fetching ebook:', error);
      showToast('Failed to load eBook', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveReadingProgress = async () => {
    if (!user || preview || !ebook) return;

    const sessionEnd = new Date();
    const durationMinutes = Math.floor((sessionEnd.getTime() - sessionStart.current.getTime()) / 60000);

    try {
      await supabase
        .from('user_library')
        .update({
          current_page: currentPage,
          reading_progress: readingProgress,
          total_reading_time: supabase.rpc('increment', { x: durationMinutes }),
        })
        .eq('user_id', user.id)
        .eq('ebook_id', ebookId);

      if (durationMinutes > 0) {
        await supabase.from('reading_sessions').insert([{
          user_id: user.id,
          ebook_id: ebookId,
          started_at: sessionStart.current.toISOString(),
          ended_at: sessionEnd.toISOString(),
          duration_minutes: durationMinutes,
          pages_read: 1,
        }]);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const loadEpubContent = async () => {
    if (!fileUrl) return;

    setLoadingContent(true);
    try {
      const chapters = await parseEpubFromUrl(fileUrl);
      const maxChapters = preview ? Math.min(ebook.preview_pages || 5, chapters.length) : chapters.length;
      setEpubChapters(chapters.slice(0, maxChapters));
    } catch (error: any) {
      console.error('Error loading EPUB:', error);
      showToast(`Failed to load EPUB: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setLoadingContent(false);
    }
  };

  const loadPdfContent = async () => {
    if (!fileUrl) return;

    setLoadingContent(true);
    try {
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      if (isSafari) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      } else {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      }

      let pdf;
      try {
        const response = await fetch(fileUrl, {
          mode: 'cors',
          credentials: 'omit',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();

        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          isEvalSupported: false,
          useWorkerFetch: false,
          useSystemFonts: true,
          verbosity: 0,
        });

        pdf = await loadingTask.promise;
      } catch (fetchError: any) {
        const loadingTask = pdfjsLib.getDocument({
          url: fileUrl,
          withCredentials: false,
          isEvalSupported: false,
          useWorkerFetch: false,
          useSystemFonts: true,
          verbosity: 0,
        });
        pdf = await loadingTask.promise;
      }

      const maxPages = preview ? Math.min(ebook.preview_pages || 20, pdf.numPages) : pdf.numPages;
      const pages: string[] = new Array(maxPages).fill('');

      setPdfPages(pages);
      setLoadingContent(false);

      loadPdfPage(pdf, 1, maxPages);
    } catch (error: any) {
      console.error('Error loading PDF:', error);
      showToast(`Failed to load PDF: ${error.message || 'Unknown error'}`, 'error');
      setLoadingContent(false);
    }
  };

  const loadPdfPage = async (pdf: any, pageNum: number, maxPages: number) => {
    try {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');

      setPdfPages(prev => {
        const updated = [...prev];
        updated[pageNum - 1] = pageText;
        return updated;
      });

      if (pageNum < Math.min(5, maxPages)) {
        loadPdfPage(pdf, pageNum + 1, maxPages);
      }
    } catch (error) {
      console.error(`Error loading page ${pageNum}:`, error);
    }
  };

  const toggleBookmark = async () => {
    if (!user || preview) {
      showToast('Sign in to save bookmarks', 'info');
      return;
    }

    try {
      if (isBookmarked) {
        const bookmark = bookmarks.find(b => b.page_number === currentPage);
        if (bookmark) {
          await supabase
            .from('bookmarks')
            .delete()
            .eq('id', bookmark.id);

          setBookmarks(bookmarks.filter(b => b.id !== bookmark.id));
          setIsBookmarked(false);
          showToast('Bookmark removed', 'success');
        }
      } else {
        const { data } = await supabase
          .from('bookmarks')
          .insert([{
            user_id: user.id,
            ebook_id: ebookId,
            page_number: currentPage,
          }])
          .select()
          .single();

        if (data) {
          setBookmarks([data, ...bookmarks]);
          setIsBookmarked(true);
          showToast('Bookmark added', 'success');
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      showToast('Failed to update bookmark', 'error');
    }
  };

  const handleInternalPageChange = (internal: number, total: number) => {
    setInternalPage(internal);
    setTotalInternalPages(total);
  };

  const calculateOverallProgress = () => {
    let totalPages: number;

    if (ebook.format === 'PDF') {
      totalPages = pdfPages.length > 0 ? pdfPages.length : ebook.page_count;
    } else if (ebook.format === 'EPUB') {
      totalPages = epubChapters.length;
    } else {
      totalPages = ebook.page_count || 1;
    }

    if (totalInternalPages > 1) {
      const chapterProgress = (internalPage - 1) / totalInternalPages;
      const overallProgress = ((currentPage - 1 + chapterProgress) / totalPages) * 100;
      return overallProgress;
    } else {
      return (currentPage / totalPages) * 100;
    }
  };

  const getCurrentDisplayPage = () => {
    if (totalInternalPages > 1) {
      let pagesBeforeCurrent = currentPage - 1;
      return pagesBeforeCurrent * totalInternalPages + internalPage;
    }
    return currentPage;
  };

  const getTotalDisplayPages = () => {
    let totalPages: number;

    if (ebook.format === 'PDF') {
      totalPages = pdfPages.length > 0 ? pdfPages.length : ebook.page_count;
    } else if (ebook.format === 'EPUB') {
      totalPages = epubChapters.length;
    } else {
      totalPages = ebook.page_count || 1;
    }

    if (totalInternalPages > 1) {
      return totalPages * totalInternalPages;
    }
    return totalPages;
  };

  const handlePageChange = (newPage: number) => {
    if (isTransitioning) return;

    let totalPages: number;
    let maxPage: number;

    if (ebook.format === 'PDF') {
      totalPages = pdfPages.length > 0 ? pdfPages.length : ebook.page_count;
      maxPage = preview ? Math.min(ebook.preview_pages || 20, totalPages) : totalPages;
    } else if (ebook.format === 'EPUB') {
      totalPages = epubChapters.length;
      maxPage = preview ? Math.min(ebook.preview_pages || 5, totalPages) : totalPages;
    } else {
      totalPages = ebook.page_count || 1;
      maxPage = preview ? Math.min(ebook.preview_pages || 20, totalPages) : totalPages;
    }

    if (newPage < 1 || newPage > maxPage) return;

    setIsTransitioning(true);
    setCurrentPage(newPage);
    const progress = calculateOverallProgress();
    setReadingProgress(progress);
    setIsBookmarked(bookmarks.some(b => b.page_number === newPage));

    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }

    setTimeout(() => setIsTransitioning(false), 300);

    if (ebook?.format === 'PDF' && !pdfPages[newPage - 1]) {
      loadPageOnDemand(newPage);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (isTransitioning) return;

    const swipeThreshold = 75;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        handlePageChange(currentPage + 1);
      } else {
        handlePageChange(currentPage - 1);
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const loadPageOnDemand = async (pageNum: number) => {
    if (!fileUrl) return;

    try {
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      if (isSafari) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      } else {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      }

      const response = await fetch(fileUrl, {
        mode: 'cors',
        credentials: 'omit',
      });
      const arrayBuffer = await response.arrayBuffer();

      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        isEvalSupported: false,
        useWorkerFetch: false,
        useSystemFonts: true,
        verbosity: 0,
      });

      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');

      setPdfPages(prev => {
        const updated = [...prev];
        updated[pageNum - 1] = pageText;
        return updated;
      });
    } catch (error) {
      console.error(`Error loading page ${pageNum}:`, error);
    }
  };

  const getThemeStyles = () => {
    const themes = {
      light: { bg: 'bg-white', text: 'text-gray-900' },
      dark: { bg: 'bg-gray-900', text: 'text-gray-100' },
      sepia: { bg: 'bg-[#f4ecd8]', text: 'text-gray-900' },
    };
    return themes[readerSettings.theme];
  };

  const getMarginClass = () => {
    const margins = {
      narrow: 'max-w-4xl',
      medium: 'max-w-3xl',
      wide: 'max-w-2xl',
    };
    return margins[readerSettings.margin];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F05A28]" />
      </div>
    );
  }

  if (!ebook) return null;

  const theme = getThemeStyles();

  let totalPages: number;
  let maxPage: number;

  if (ebook.format === 'PDF') {
    totalPages = pdfPages.length > 0 ? pdfPages.length : ebook.page_count;
    maxPage = preview ? Math.min(ebook.preview_pages || 20, totalPages) : totalPages;
  } else if (ebook.format === 'EPUB') {
    totalPages = epubChapters.length;
    maxPage = preview ? Math.min(ebook.preview_pages || 5, totalPages) : totalPages;
  } else {
    totalPages = ebook.page_count || 1;
    maxPage = preview ? Math.min(ebook.preview_pages || 20, totalPages) : totalPages;
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} transition-colors duration-300`}>
      <div className="sticky top-0 z-50 bg-opacity-95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <button
                onClick={() => navigate(preview ? '/ebooks' : '/library')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex-shrink-0"
              >
                <Home size={18} className="sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors md:hidden flex-shrink-0"
              >
                <Menu size={18} className="sm:w-5 sm:h-5" />
              </button>
              <div className="hidden md:block min-w-0">
                <h1 className="font-medium text-base sm:text-lg line-clamp-1">{ebook.title}</h1>
                <p className="text-xs sm:text-sm opacity-70">{ebook.author}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {preview && (
                <span className="hidden sm:inline px-2 sm:px-3 py-1 bg-orange-100 text-orange-800 text-xs sm:text-sm font-medium rounded-full">
                  Preview
                </span>
              )}
              <button
                onClick={toggleBookmark}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                {isBookmarked ? (
                  <BookmarkCheck size={18} className="sm:w-5 sm:h-5 text-[#F05A28]" />
                ) : (
                  <Bookmark size={18} className="sm:w-5 sm:h-5" />
                )}
              </button>
              <button
                onClick={() => setBookmarksOpen(!bookmarksOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors hidden sm:flex"
              >
                <BookOpen size={18} className="sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <Settings size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          <div className="mt-2 sm:mt-3">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                  <span>{getCurrentDisplayPage()} / {getTotalDisplayPages()}</span>
                  <span>{calculateOverallProgress().toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
                  <div
                    className="bg-[#F05A28] h-1.5 sm:h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calculateOverallProgress()}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= maxPage}
                className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <ChevronRight size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={contentRef}
        className={`mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12 select-none`}
        style={{
          overscrollBehavior: 'contain',
        }}
      >
        <div className="max-w-none">
          {ebook.format === 'EPUB' ? (
            <div className="w-full">
              {loadingContent ? (
                <div className="w-full min-h-[600px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <Loader className="animate-spin w-12 h-12 text-[#F05A28] mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading EPUB...</p>
                  </div>
                </div>
              ) : epubChapters.length > 0 ? (
                <div className="pb-12">
                  <BookPageFlip
                    content={epubChapters[currentPage - 1]?.content || 'No content available for this chapter.'}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                    totalPages={epubChapters.length}
                    fontSize={readerSettings.fontSize}
                    fontFamily={readerSettings.fontFamily}
                    lineHeight={readerSettings.lineHeight}
                    theme={theme}
                    title={currentPage === 1 ? ebook.title : epubChapters[currentPage - 1]?.title}
                    author={currentPage === 1 ? ebook.author : undefined}
                    onInternalPageChange={handleInternalPageChange}
                  />

                  {preview && currentPage >= (ebook.preview_pages || 5) && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-6 my-8 rounded-r-lg">
                      <h3 className="text-xl font-bold mb-2">Preview Limit Reached</h3>
                      <p className="mb-4">You've reached the end of the preview. Purchase the full eBook to continue reading.</p>
                      <button
                        onClick={() => navigate('/ebooks')}
                        className="px-6 py-2 bg-[#F05A28] text-white rounded-lg hover:bg-[#d94d20] transition-colors"
                      >
                        Buy Full eBook
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full min-h-[600px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-600 dark:text-gray-400">Unable to load EPUB content</p>
                </div>
              )}
            </div>
          ) : ebook.format === 'PDF' ? (
            <div className="w-full">
              {loadingContent ? (
                <div className="w-full min-h-[600px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <Loader className="animate-spin w-12 h-12 text-[#F05A28] mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading PDF...</p>
                  </div>
                </div>
              ) : pdfPages.length > 0 ? (
                <div className="pb-12">
                  {!pdfPages[currentPage - 1] ? (
                    <div className="w-full flex items-center justify-center min-h-[75vh] bg-gray-100 dark:bg-gray-800 rounded-lg shadow-2xl">
                      <div className="text-center">
                        <Loader className="animate-spin w-8 h-8 text-[#F05A28] mx-auto mb-2" />
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Loading page...</p>
                      </div>
                    </div>
                  ) : (
                    <BookPageFlip
                      content={pdfPages[currentPage - 1]}
                      currentPage={currentPage}
                      onPageChange={handlePageChange}
                      totalPages={pdfPages.length}
                      fontSize={readerSettings.fontSize}
                      fontFamily={readerSettings.fontFamily}
                      lineHeight={readerSettings.lineHeight}
                      theme={theme}
                      title={currentPage === 1 ? ebook.title : undefined}
                      author={currentPage === 1 ? ebook.author : undefined}
                      onInternalPageChange={handleInternalPageChange}
                    />
                  )}

                  {preview && currentPage >= (ebook.preview_pages || 20) && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-6 my-8 rounded-r-lg">
                      <h3 className="text-xl font-bold mb-2">Preview Limit Reached</h3>
                      <p className="mb-4">You've reached the end of the preview. Purchase the full eBook to continue reading.</p>
                      <button
                        onClick={() => navigate('/ebooks')}
                        className="px-6 py-2 bg-[#F05A28] text-white rounded-lg hover:bg-[#d94d20] transition-colors"
                      >
                        Buy Full eBook
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full min-h-[600px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-600 dark:text-gray-400">Unable to load PDF content</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">{ebook.title}</h2>
              <p className="text-lg sm:text-xl mb-6 sm:mb-8">by {ebook.author}</p>

              <div className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
                  <h3 className="text-lg font-bold mb-2">Unsupported Format</h3>
                  <p className="mb-4">
                    This format is not directly viewable in the browser. Please download the file to read it.
                  </p>
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      download
                      className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Download File
                    </a>
                  )}
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="font-bold text-lg mb-3">About this eBook</h4>
                  <p className="text-gray-700 mb-4">{ebook.description || 'No description available.'}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Format:</span>
                      <span className="ml-2 text-gray-900">{ebook.format}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Pages:</span>
                      <span className="ml-2 text-gray-900">{ebook.page_count}</span>
                    </div>
                    {ebook.isbn && (
                      <div>
                        <span className="font-medium text-gray-600">ISBN:</span>
                        <span className="ml-2 text-gray-900">{ebook.isbn}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {settingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold">Reading Settings</h3>
              <button onClick={() => setSettingsOpen(false)} className="p-1">
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReaderSettings({ ...readerSettings, theme: 'light' })}
                    className={`flex-1 px-2 sm:px-4 py-2 border rounded-lg ${
                      readerSettings.theme === 'light' ? 'border-[#F05A28] bg-orange-50' : ''
                    }`}
                  >
                    <Sun size={18} className="sm:w-5 sm:h-5 mx-auto" />
                    <span className="block text-xs mt-1">Light</span>
                  </button>
                  <button
                    onClick={() => setReaderSettings({ ...readerSettings, theme: 'dark' })}
                    className={`flex-1 px-2 sm:px-4 py-2 border rounded-lg ${
                      readerSettings.theme === 'dark' ? 'border-[#F05A28] bg-orange-50' : ''
                    }`}
                  >
                    <Moon size={18} className="sm:w-5 sm:h-5 mx-auto" />
                    <span className="block text-xs mt-1">Dark</span>
                  </button>
                  <button
                    onClick={() => setReaderSettings({ ...readerSettings, theme: 'sepia' })}
                    className={`flex-1 px-2 sm:px-4 py-2 border rounded-lg ${
                      readerSettings.theme === 'sepia' ? 'border-[#F05A28] bg-orange-50' : ''
                    }`}
                  >
                    <BookOpen size={18} className="sm:w-5 sm:h-5 mx-auto" />
                    <span className="block text-xs mt-1">Sepia</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Font Size: {readerSettings.fontSize}px
                </label>
                <input
                  type="range"
                  min="14"
                  max="24"
                  value={readerSettings.fontSize}
                  onChange={(e) =>
                    setReaderSettings({ ...readerSettings, fontSize: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Font Family</label>
                <select
                  value={readerSettings.fontFamily}
                  onChange={(e) =>
                    setReaderSettings({ ...readerSettings, fontFamily: e.target.value as any })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="Georgia">Georgia</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Margin</label>
                <div className="flex gap-2">
                  {(['narrow', 'medium', 'wide'] as const).map((margin) => (
                    <button
                      key={margin}
                      onClick={() => setReaderSettings({ ...readerSettings, margin })}
                      className={`flex-1 px-4 py-2 border rounded-lg capitalize ${
                        readerSettings.margin === margin ? 'border-[#F05A28] bg-orange-50' : ''
                      }`}
                    >
                      {margin}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {bookmarksOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Bookmarks</h3>
              <button onClick={() => setBookmarksOpen(false)}>
                <X size={24} />
              </button>
            </div>

            {bookmarks.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No bookmarks yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {bookmarks.map((bookmark) => (
                  <button
                    key={bookmark.id}
                    onClick={() => {
                      handlePageChange(bookmark.page_number);
                      setBookmarksOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Page {bookmark.page_number}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(bookmark.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {bookmark.note && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{bookmark.note}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
