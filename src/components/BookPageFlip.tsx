import React, { useState, useEffect, useRef } from 'react';

interface BookPageFlipProps {
  content: string;
  currentPage: number;
  onPageChange: (newPage: number) => void;
  totalPages: number;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  theme: { bg: string; text: string };
  title?: string;
  author?: string;
  onInternalPageChange?: (internalPage: number, totalInternalPages: number) => void;
}

export function BookPageFlip({
  content,
  currentPage,
  onPageChange,
  totalPages,
  fontSize,
  fontFamily,
  lineHeight,
  theme,
  title,
  author,
  onInternalPageChange,
}: BookPageFlipProps) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'left' | 'right'>('right');
  const [pages, setPages] = useState<string[]>([]);
  const [internalPage, setInternalPage] = useState(1);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInternalPage(1);
    paginateContent();
  }, [content, fontSize, fontFamily, lineHeight]);

  const paginateContent = () => {
    if (!contentRef.current) return;

    const containerHeight = window.innerHeight * 0.75;
    const containerWidth = contentRef.current.offsetWidth;

    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.width = `${containerWidth - 64}px`;
    tempDiv.style.fontSize = `${fontSize}px`;
    tempDiv.style.fontFamily = fontFamily;
    tempDiv.style.lineHeight = `${lineHeight}`;
    tempDiv.style.padding = '32px';
    document.body.appendChild(tempDiv);

    const words = content.split(/\s+/);
    const pagesArray: string[] = [];
    let currentPageText = '';

    for (let i = 0; i < words.length; i++) {
      const testText = currentPageText + (currentPageText ? ' ' : '') + words[i];
      tempDiv.textContent = testText;

      if (tempDiv.offsetHeight > containerHeight - 64) {
        if (currentPageText) {
          pagesArray.push(currentPageText);
          currentPageText = words[i];
        } else {
          pagesArray.push(words[i]);
          currentPageText = '';
        }
      } else {
        currentPageText = testText;
      }
    }

    if (currentPageText) {
      pagesArray.push(currentPageText);
    }

    document.body.removeChild(tempDiv);
    const finalPages = pagesArray.length > 0 ? pagesArray : [content];
    setPages(finalPages);

    if (onInternalPageChange) {
      onInternalPageChange(1, finalPages.length);
    }
  };

  useEffect(() => {
    if (onInternalPageChange && pages.length > 0) {
      onInternalPageChange(internalPage, pages.length);
    }
  }, [internalPage, pages.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (isFlipping) return;

    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        goToNextPage();
      } else {
        goToPreviousPage();
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const goToNextPage = () => {
    if (isFlipping) return;

    if (internalPage < pages.length) {
      flipPage('right', true);
    } else if (currentPage < totalPages) {
      flipPage('right', false);
    }
  };

  const goToPreviousPage = () => {
    if (isFlipping) return;

    if (internalPage > 1) {
      flipPage('left', true);
    } else if (currentPage > 1) {
      flipPage('left', false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isFlipping) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (clickX < width * 0.3) {
      goToPreviousPage();
    } else if (clickX > width * 0.7) {
      goToNextPage();
    }
  };

  const flipPage = (direction: 'left' | 'right', internal: boolean) => {
    if (isFlipping) return;

    setFlipDirection(direction);
    setIsFlipping(true);

    setTimeout(() => {
      if (internal) {
        if (direction === 'right') {
          setInternalPage(internalPage + 1);
        } else {
          setInternalPage(internalPage - 1);
        }
      } else {
        if (direction === 'right') {
          onPageChange(currentPage + 1);
        } else {
          onPageChange(currentPage - 1);
        }
      }
      setIsFlipping(false);
    }, 600);
  };

  const pageContent = pages[internalPage - 1] || content;
  const nextPageContent = pages[internalPage] || '';

  return (
    <div
      ref={contentRef}
      className="relative w-full mx-auto group"
      style={{ maxWidth: '800px', height: '75vh' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <button
        onClick={goToPreviousPage}
        disabled={internalPage === 1 && currentPage === 1}
        className="absolute left-0 top-0 bottom-0 w-[30%] z-10 opacity-0 hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed hidden md:flex items-center justify-start pl-4"
        style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.1), transparent)' }}
      >
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-2 shadow-lg">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </div>
      </button>

      <button
        onClick={goToNextPage}
        disabled={internalPage === pages.length && currentPage === totalPages}
        className="absolute right-0 top-0 bottom-0 w-[30%] z-10 opacity-0 hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed hidden md:flex items-center justify-end pr-4"
        style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.1), transparent)' }}
      >
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-2 shadow-lg">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </button>

      <div className="relative w-full h-full perspective-1000">
        {/* Base Page (underneath) - shows next page when flipping forward, current when flipping back */}
        <div
          className={`absolute inset-0 ${theme.bg} ${theme.text} rounded-lg shadow-2xl overflow-hidden`}
          style={{
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
        >
          <div className="w-full h-full p-8 overflow-hidden flex flex-col">
            {/* Show appropriate content based on flip direction */}
            {isFlipping ? (
              <>
                <div
                  className="flex-1 overflow-hidden"
                  style={{
                    fontSize: `${fontSize}px`,
                    fontFamily: fontFamily,
                    lineHeight: lineHeight,
                  }}
                >
                  <p className="whitespace-pre-wrap">
                    {flipDirection === 'right' ? nextPageContent : pageContent}
                  </p>
                </div>
                <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  {pages.length > 1
                    ? `${flipDirection === 'right' ? internalPage + 1 : internalPage} / ${pages.length}`
                    : `Chapter ${flipDirection === 'right' ? currentPage + 1 : currentPage} / ${totalPages}`
                  }
                </div>
              </>
            ) : (
              <>
                {internalPage === 1 && title && (
                  <div className="mb-6 pb-6 border-b border-gray-300 dark:border-gray-600">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">{title}</h1>
                    {author && <p className="text-lg text-gray-600 dark:text-gray-400">by {author}</p>}
                  </div>
                )}
                <div
                  className="flex-1 overflow-hidden"
                  style={{
                    fontSize: `${fontSize}px`,
                    fontFamily: fontFamily,
                    lineHeight: lineHeight,
                  }}
                >
                  <p className="whitespace-pre-wrap">{pageContent}</p>
                </div>
                <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  {pages.length > 1 ? `${internalPage} / ${pages.length}` : `Chapter ${currentPage} / ${totalPages}`}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Flipping Page (on top) - the page that physically flips */}
        {isFlipping && (
          <div
            className={`absolute inset-0 ${theme.bg} ${theme.text} rounded-lg shadow-2xl overflow-hidden ${
              flipDirection === 'right' ? 'animate-page-flip-forward' : 'animate-page-flip-backward'
            }`}
            style={{
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
            }}
          >
            <div className="w-full h-full p-8 overflow-hidden flex flex-col" style={{ transform: 'scaleX(-1)' }}>
              {/* Show current page when flipping forward, previous when flipping back */}
              {internalPage === 1 && flipDirection === 'left' && title && (
                <div className="mb-6 pb-6 border-b border-gray-300 dark:border-gray-600">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">{title}</h1>
                  {author && <p className="text-lg text-gray-600 dark:text-gray-400">by {author}</p>}
                </div>
              )}
              <div
                className="flex-1 overflow-hidden"
                style={{
                  fontSize: `${fontSize}px`,
                  fontFamily: fontFamily,
                  lineHeight: lineHeight,
                }}
              >
                <p className="whitespace-pre-wrap">
                  {flipDirection === 'right' ? pageContent : (pages[internalPage - 2] || '')}
                </p>
              </div>
              <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                {pages.length > 1
                  ? `${flipDirection === 'right' ? internalPage : internalPage - 1} / ${pages.length}`
                  : `Chapter ${flipDirection === 'right' ? currentPage : currentPage - 1} / ${totalPages}`
                }
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Page Indicators */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-1 mt-4">
        {pages.length > 1 ? (
          Array.from({ length: Math.min(10, pages.length) }, (_, i) => {
            const pageNum = Math.floor((internalPage - 1) / 10) * 10 + i + 1;
            if (pageNum > pages.length) return null;
            return (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  pageNum === internalPage ? 'w-8 bg-[#F05A28]' : 'w-1 bg-gray-300 dark:bg-gray-600'
                }`}
              />
            );
          })
        ) : (
          Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
            const pageNum = Math.floor((currentPage - 1) / 10) * 10 + i + 1;
            if (pageNum > totalPages) return null;
            return (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  pageNum === currentPage ? 'w-8 bg-[#F05A28]' : 'w-1 bg-gray-300 dark:bg-gray-600'
                }`}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
