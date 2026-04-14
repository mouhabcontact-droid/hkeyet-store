# eBook Format Guide

## Recommended Formats for Online Reading

### 1. EPUB (Best for Most Use Cases) ⭐

**Pros:**
- Native web support with our EPUB reader
- Smallest file size (typically 1-5 MB)
- Fastest loading on mobile devices
- Reflowable text adapts to screen size
- Best for novels, non-fiction, and text-heavy content
- Instant chapter navigation

**Cons:**
- May not preserve complex layouts
- Not ideal for heavily formatted documents

**Performance:**
- Initial load: ~1-2 seconds
- Chapter switching: Instant
- Mobile experience: Excellent

**Best for:** Novels, non-fiction books, educational content, magazines

---

### 2. PDF (Good for Fixed-Layout Content)

**Pros:**
- Preserves exact layout and formatting
- Good for textbooks, graphic novels, or image-heavy content
- Universal format support

**Cons:**
- Larger file sizes (10-50+ MB typical)
- Slower loading, especially on mobile
- Less flexible on different screen sizes
- Requires lazy-loading for good performance

**Performance:**
- Initial load: ~3-10 seconds (with lazy-loading)
- Page switching: 1-2 seconds
- Mobile experience: Fair to Good

**Best for:** Textbooks, graphic novels, magazines with complex layouts, technical manuals

---

### 3. HTML (Best Performance)

**Pros:**
- Instant loading
- Native web format
- Smallest possible size
- Perfect for web-first content

**Cons:**
- Requires manual conversion
- Not a standard ebook format
- No standard tools for creation

**Performance:**
- Initial load: Instant
- Page switching: Instant
- Mobile experience: Excellent

**Best for:** Web-first content, blog compilations, documentation

---

## File Size Guidelines

- **EPUB:** Aim for under 5 MB
- **PDF:** Keep under 50 MB for online viewing
- **Images:** Compress and optimize before embedding

## Conversion Tips

### Converting to EPUB
- Use Calibre (free desktop app)
- Use online converters like CloudConvert
- Many word processors can export to EPUB

### Optimizing PDFs
- Compress images before creating PDF
- Use "Save as Optimized PDF" in Adobe Acrobat
- Target 150 DPI for images in text-heavy PDFs

## Implementation Notes

The bookstore now supports:
- ✅ EPUB with instant chapter loading
- ✅ PDF with lazy-loading for better performance
- ✅ Automatic format detection
- ✅ Optimized mobile experience

For the best user experience, **prioritize EPUB format** for text-based books and reserve PDF for content that requires precise layout control.
