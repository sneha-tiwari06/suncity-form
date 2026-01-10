'use client';

import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useState, useCallback } from 'react';
import { useResizeObserver } from 'react-pdf';
import '@/lib/pdfjs-worker'; // Configure PDF.js worker

interface PDFViewerProps {
  pdfUrl: string;
  fillablePages?: number[];
  onFieldChange?: (page: number, field: string, value: string) => void;
  formData?: any;
  showOnlyFillable?: boolean;
}

export default function PDFViewer({
  pdfUrl,
  fillablePages = [5, 6, 7, 8],
  onFieldChange,
  formData,
  showOnlyFillable = false,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>();

  const onResize = useCallback((entries: ResizeObserverEntry[]) => {
    const [entry] = entries;
    if (entry) {
      setContainerWidth(entry.contentRect.width);
    }
  }, []);

  useResizeObserver({
    ref: containerRef,
    onResize,
  });

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const isFillablePage = (pageNumber: number) => {
    return fillablePages.includes(pageNumber);
  };

  return (
    <div className="w-full">
      <div ref={setContainerRef} className="w-full">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="flex justify-center p-4">Loading PDF...</div>}
          error={
            <div className="flex justify-center p-4 text-red-500">
              Error loading PDF. Please ensure the PDF file exists.
            </div>
          }
        >
          {Array.from(new Array(numPages), (el, index) => {
            const pageNumber = index + 1;
            
            // If showOnlyFillable is true, only show fillable pages
            if (showOnlyFillable && !isFillablePage(pageNumber)) {
              return null;
            }

            return (
              <div
                key={`page_${pageNumber}`}
                className="mb-4 relative"
                style={{ width: containerWidth }}
              >
                <Page
                  pageNumber={pageNumber}
                  width={containerWidth ? Math.min(containerWidth, 612) : 612}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="border border-gray-300 shadow-lg"
                />
              </div>
            );
          })}
        </Document>
      </div>
    </div>
  );
}