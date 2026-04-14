export interface EpubChapter {
  id: string;
  title: string;
  content: string;
}

export async function parseEpubFromUrl(url: string): Promise<EpubChapter[]> {
  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch EPUB: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return parseEpubFromBuffer(arrayBuffer);
  } catch (error) {
    console.error('Error fetching EPUB:', error);
    throw error;
  }
}

export async function parseEpubFromBuffer(arrayBuffer: ArrayBuffer): Promise<EpubChapter[]> {
  const JSZip = (await import('jszip')).default;

  try {
    const zip = await JSZip.loadAsync(arrayBuffer);

    const containerXml = await zip.file('META-INF/container.xml')?.async('text');
    if (!containerXml) {
      throw new Error('Invalid EPUB: Missing container.xml');
    }

    const parser = new DOMParser();
    const containerDoc = parser.parseFromString(containerXml, 'text/xml');
    const rootfilePath = containerDoc.querySelector('rootfile')?.getAttribute('full-path');

    if (!rootfilePath) {
      throw new Error('Invalid EPUB: Missing rootfile path');
    }

    const contentOpf = await zip.file(rootfilePath)?.async('text');
    if (!contentOpf) {
      throw new Error('Invalid EPUB: Missing content.opf');
    }

    const opfDoc = parser.parseFromString(contentOpf, 'text/xml');
    const basePath = rootfilePath.substring(0, rootfilePath.lastIndexOf('/') + 1);

    const manifest = new Map<string, string>();
    opfDoc.querySelectorAll('manifest item').forEach(item => {
      const id = item.getAttribute('id');
      const href = item.getAttribute('href');
      if (id && href) {
        manifest.set(id, basePath + href);
      }
    });

    const spine = Array.from(opfDoc.querySelectorAll('spine itemref')).map(
      item => item.getAttribute('idref') || ''
    );

    const chapters: EpubChapter[] = [];

    for (let i = 0; i < spine.length; i++) {
      const idref = spine[i];
      const filePath = manifest.get(idref);

      if (filePath) {
        const htmlContent = await zip.file(filePath)?.async('text');
        if (htmlContent) {
          const htmlDoc = parser.parseFromString(htmlContent, 'text/html');
          const title = htmlDoc.querySelector('h1, h2, h3, title')?.textContent || `Chapter ${i + 1}`;

          const body = htmlDoc.querySelector('body');
          let content = '';

          if (body) {
            content = extractTextContent(body);
          }

          chapters.push({
            id: idref,
            title: title.trim(),
            content: content.trim(),
          });
        }
      }
    }

    return chapters;
  } catch (error) {
    console.error('Error parsing EPUB:', error);
    throw error;
  }
}

function extractTextContent(element: Element): string {
  let text = '';

  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || '';
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tagName = el.tagName.toLowerCase();

      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        text += '\n\n' + extractTextContent(el) + '\n\n';
      } else if (tagName === 'p') {
        text += '\n\n' + extractTextContent(el);
      } else if (tagName === 'br') {
        text += '\n';
      } else if (tagName === 'li') {
        text += '\n• ' + extractTextContent(el);
      } else {
        text += extractTextContent(el);
      }
    }
  }

  return text;
}
