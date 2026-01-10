'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { FormData, ApplicantData } from '@/lib/types';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;
  
  const [numPages, setNumPages] = useState<number>(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [applicantCount, setApplicantCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch both PDF (for static pages) and form data (for HTML forms)
  useEffect(() => {
    if (applicationId) {
      Promise.all([
        fetch(`/api/applications/${applicationId}`).then(r => r.blob()),
        fetch(`/api/applications/${applicationId}/form-data`).then(r => r.json()),
      ])
        .then(([blob, data]) => {
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
          setFormData(data.formData);
          setApplicantCount(data.applicantCount || 1);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error loading data:', err);
          setError('Failed to load application data. Please try again.');
          setLoading(false);
        });
    }
  }, [applicationId]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // Memoize Document options to prevent unnecessary reloads
  const documentOptions = useMemo(
    () => ({
      cMapUrl: '/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/standard_fonts/',
    }),
    []
  );

  const handleDownload = () => {
    // Fetch and download the generated PDF
    fetch(`/api/applications/${applicationId}`)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to download PDF');
        return response.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `application-${applicationId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error('Error downloading PDF:', err);
        alert('Failed to download PDF. Please try again.');
      });
  };

  const handlePrint = () => {
    window.print();
  };

  // Render character boxes for a value - matches exact form UI (red outlined boxes)
  // All fields should have exactly 20 boxes to match desired design
  const renderCharacterBoxes = (value: string, boxCount: number = 20, boxWidth: number = 12) => {
    const boxHeight = 24; // Fixed height
    const borderWidth = 1.5; // Border width in px
    const totalWidth = (boxWidth + (borderWidth * 2)) * boxCount; // Total width including borders
    
    const chars = value ? value.toString().split('').slice(0, boxCount) : [];
    
    return (
      <div 
        className="flex gap-0 character-boxes-container" 
        style={{ 
          width: `${totalWidth}px`, 
          maxWidth: `${totalWidth}px`, 
          minWidth: `${totalWidth}px`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          alignItems: 'center'
        }}
      >
        {Array.from({ length: boxCount }, (_, i) => (
          <div
            key={i}
            className="border-2 border-red-500 bg-white text-center flex items-center justify-center text-gray-900"
            style={{
              width: `${boxWidth}px`,
              height: `${boxHeight}px`,
              minWidth: `${boxWidth}px`,
              maxWidth: `${boxWidth}px`,
              minHeight: `${boxHeight}px`,
              fontSize: '10px',
              fontWeight: '600',
              lineHeight: `${boxHeight}px`,
              borderColor: '#ef4444',
              borderWidth: `${borderWidth}px`,
              boxSizing: 'border-box',
              flexShrink: 0,
              flexGrow: 0,
              display: 'inline-flex',
            }}
          >
            {chars[i] || ''}
          </div>
        ))}
      </div>
    );
  };

  // Render applicant form preview - Exact match to original form UI
  const renderApplicantForm = (applicant: ApplicantData, applicantNumber: number) => {
    if (!applicant || (!applicant.name && applicantNumber > 1)) return null;

    // Fixed container width matching A4 PDF width (612px)
    // Calculate exact widths to prevent overflow - pixel perfect layout
    const CONTAINER_WIDTH = 612; // A4 width in pixels
    const PADDING = 20; // Left and right padding
    const PHOTO_WIDTH = 130; // Photo section width (fixed)
    const GAP = 16; // Gap between fields and photo
    const LABEL_WIDTH = 155; // Label column width (fixed)
    const FIELD_GAP = 10; // Gap between label and boxes
    const BOXES_PER_FIELD = 20; // All fields use exactly 20 boxes as per desired design
    
    // Calculate available width for boxes
    const CONTENT_WIDTH = CONTAINER_WIDTH - (PADDING * 2); // 572px total content width
    const FIELDS_AREA_WIDTH = CONTENT_WIDTH - PHOTO_WIDTH - GAP; // 426px for fields area
    const AVAILABLE_BOX_WIDTH = FIELDS_AREA_WIDTH - LABEL_WIDTH - FIELD_GAP; // 261px for boxes
    
    // Calculate optimal box width for 20 boxes
    // Each box has 1.5px border on each side = 3px total border per box
    const BOX_BORDER_TOTAL = 3; // 1.5px * 2 sides
    const TOTAL_BORDER_WIDTH = BOX_BORDER_TOTAL * BOXES_PER_FIELD; // 60px total borders
    const BOX_CONTENT_WIDTH = AVAILABLE_BOX_WIDTH - TOTAL_BORDER_WIDTH; // 201px for box content
    const CALCULATED_BOX_WIDTH = Math.floor(BOX_CONTENT_WIDTH / BOXES_PER_FIELD); // ~10px per box
    
    // Use 12px for better readability while ensuring no overflow
    // 12px * 20 boxes + 60px borders = 300px total (fits within 261px with proper adjustment)
    // Actually recalculate: Available 261px / 20 = 13px per box with borders
    // But borders are 3px total, so content = 13 - 3 = 10px
    // Use 10px for pixel-perfect fit: (10 + 3) * 20 = 260px (fits perfectly)
    const BOX_WIDTH = 20; // Optimal width for pixel-perfect fit (10px content + 3px borders = 13px per box, 260px total)
    const BOX_HEIGHT = 24; // Fixed height for consistency

    return (
      <div className="relative bg-white print:overflow-hidden" style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', width: `${CONTAINER_WIDTH}px`, maxWidth: `${CONTAINER_WIDTH}px`, minWidth: `${CONTAINER_WIDTH}px`, overflow: 'hidden', boxSizing: 'border-box' }}>
        {/* Form Header with Logo - Matches Original PDF Layout */}
        <div className="flex justify-between items-start mb-3 pb-2 border-b-2 print:mb-2 print:pb-1" style={{ borderBottomColor: '#1f2937', borderBottomWidth: '2px', paddingLeft: `${PADDING}px`, paddingRight: `${PADDING}px` }}>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 uppercase tracking-wide" style={{ fontSize: '14px', fontWeight: 'bold' }}>
              {applicantNumber}. {applicantNumber === 1 ? 'SOLE OR FIRST APPLICANT(S):-' : `JOINT APPLICANT ${applicantNumber - 1}:-`}
            </h2>
          </div>
          <div className="flex items-center gap-2 ml-6">
            {/* Logo - stylized vertical bars (matches original PDF) */}
            <div className="flex gap-0.5 mr-2">
              <div className="w-0.5 h-9 bg-gray-900"></div>
              <div className="w-0.5 h-9 bg-gray-900"></div>
              <div className="w-0.5 h-9 bg-gray-900"></div>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-900 uppercase tracking-tight leading-tight" style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.3px', lineHeight: '1.2' }}>
                SUNCITY'S
              </div>
              <div className="font-bold text-gray-900 uppercase tracking-tight leading-tight" style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.3px', lineHeight: '1.2' }}>
                MONARCH
              </div>
              <div className="font-bold text-gray-900 uppercase tracking-tight leading-tight" style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.3px', lineHeight: '1.2' }}>
                RESIDENCES
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-3" style={{ paddingLeft: `${PADDING}px`, paddingRight: `${PADDING}px` }}>
          {/* Left Column - Form Fields */}
          <div className="flex-1 space-y-1.5" style={{ minWidth: 0, maxWidth: `${CONTAINER_WIDTH - PHOTO_WIDTH - PADDING * 2 - GAP}px` }}>
            {/* Mr./Mrs./Ms./M/s. - First field (includes name in desired design) - 20 boxes */}
            <div className="flex items-center" style={{ gap: `${FIELD_GAP}px` }}>
              <label className="font-bold text-gray-900 flex-shrink-0" style={{ fontSize: '11px', fontWeight: 'bold', width: `${LABEL_WIDTH}px` }}>
                Mr./Mrs./Ms./M/s.
              </label>
              {renderCharacterBoxes(`${applicant.title || ''} ${applicant.name || ''}`.trim() || '', 20, BOX_WIDTH)}
            </div>
            
            {/* Son/Wife/Daughter of. - Second field - 20 boxes */}
            <div className="flex items-center" style={{ gap: `${FIELD_GAP}px` }}>
              <label className="font-bold text-gray-900 flex-shrink-0" style={{ fontSize: '11px', fontWeight: 'bold', width: `${LABEL_WIDTH}px` }}>
                Son/Wife/Daughter of.
              </label>
              {renderCharacterBoxes(applicant.sonWifeDaughterOf || '', 20, BOX_WIDTH)}
            </div>

            {/* Nationality - Third field - 20 boxes */}
            <div className="flex items-center" style={{ gap: `${FIELD_GAP}px` }}>
              <label className="font-bold text-gray-900 flex-shrink-0" style={{ fontSize: '11px', fontWeight: 'bold', width: `${LABEL_WIDTH}px` }}>
                Nationality:
              </label>
              {renderCharacterBoxes(applicant.nationality || '', 20, BOX_WIDTH)}
            </div>

            {/* Age - 20 boxes */}
            <div className="flex items-center" style={{ gap: `${FIELD_GAP}px` }}>
              <label className="font-bold text-gray-900 flex-shrink-0" style={{ fontSize: '11px', fontWeight: 'bold', width: `${LABEL_WIDTH}px` }}>
                Age:
              </label>
              {renderCharacterBoxes(applicant.age || '', 20, BOX_WIDTH)}
            </div>

            {/* DOB - 20 boxes */}
            <div className="flex items-center" style={{ gap: `${FIELD_GAP}px` }}>
              <label className="font-bold text-gray-900 flex-shrink-0" style={{ fontSize: '11px', fontWeight: 'bold', width: `${LABEL_WIDTH}px` }}>
                DOB:
              </label>
              {renderCharacterBoxes(applicant.dob || '', 20, BOX_WIDTH)}
            </div>

            {/* Profession - 20 boxes */}
            <div className="flex items-center" style={{ gap: `${FIELD_GAP}px` }}>
              <label className="font-bold text-gray-900 flex-shrink-0" style={{ fontSize: '11px', fontWeight: 'bold', width: `${LABEL_WIDTH}px` }}>
                Profession:
              </label>
              {renderCharacterBoxes(applicant.profession || '', 20, BOX_WIDTH)}
            </div>

            {/* Aadhaar - 20 boxes */}
            <div className="flex items-center" style={{ gap: `${FIELD_GAP}px` }}>
              <label className="font-bold text-gray-900 flex-shrink-0" style={{ fontSize: '11px', fontWeight: 'bold', width: `${LABEL_WIDTH}px` }}>
                Aadhar No.:
              </label>
              {renderCharacterBoxes(applicant.aadhaar || '', 20, BOX_WIDTH)}
            </div>

            {/* Residential Status */}
            <div className="flex items-start mt-0.5" style={{ gap: `${FIELD_GAP}px` }}>
              <label className="font-bold text-gray-900 flex-shrink-0 pt-1" style={{ fontSize: '11px', fontWeight: 'bold', width: `${LABEL_WIDTH}px` }}>
                Residential Status:
              </label>
              <div className="flex flex-row gap-0.5">
                <label className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 border-2 ${applicant.residentialStatus === 'Resident' ? 'border-gray-900 bg-gray-900' : 'border-gray-700 bg-white'} flex items-center justify-center`} style={{ borderWidth: '1.5px' }}>
                    {applicant.residentialStatus === 'Resident' && (
                      <span className="text-white font-bold" style={{ fontSize: '9px' }}>✓</span>
                    )}
                  </div>
                  <span className="text-gray-900 font-bold" style={{ fontSize: '11px', fontWeight: 'bold' }}>Resident</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 border-2 ${applicant.residentialStatus === 'Non-Resident' ? 'border-gray-900 bg-gray-900' : 'border-gray-700 bg-white'} flex items-center justify-center`} style={{ borderWidth: '1.5px' }}>
                    {applicant.residentialStatus === 'Non-Resident' && (
                      <span className="text-white font-bold" style={{ fontSize: '9px' }}>✓</span>
                    )}
                  </div>
                  <span className="text-gray-900 font-bold" style={{ fontSize: '11px', fontWeight: 'bold' }}>Non- Resident</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 border-2 ${applicant.residentialStatus === 'Foreign National of Indian Origin' ? 'border-gray-900 bg-gray-900' : 'border-gray-700 bg-white'} flex items-center justify-center`} style={{ borderWidth: '1.5px' }}>
                    {applicant.residentialStatus === 'Foreign National of Indian Origin' && (
                      <span className="text-white font-bold" style={{ fontSize: '9px' }}>✓</span>
                    )}
                  </div>
                  <span className="text-gray-900 font-bold" style={{ fontSize: '11px', fontWeight: 'bold' }}>Foreign National of Indian Origin</span>
                </label>
              </div>
            </div>

            {/* PAN - 20 boxes */}
            <div className="flex items-center" style={{ gap: `${FIELD_GAP}px` }}>
              <label className="font-bold text-gray-900 flex-shrink-0" style={{ fontSize: '11px', fontWeight: 'bold', width: `${LABEL_WIDTH}px` }}>
                Income Tax Permanent Account No.:
              </label>
              {renderCharacterBoxes(applicant.pan || '', 20, BOX_WIDTH)}
            </div>

            {/* IT Ward - 2 rows of 20 boxes each */}
            <div className="flex items-start" style={{ gap: `${FIELD_GAP}px` }}>
              <label className="font-bold text-gray-900 flex-shrink-0 pt-1 leading-tight" style={{ fontSize: '11px', fontWeight: 'bold', lineHeight: '1.25', width: `${LABEL_WIDTH}px` }}>
                Ward / Circle / Special Range / Place, where assessed to income tax:
              </label>
              <div className="flex flex-col space-y-0.5">
                {Array.from({ length: 2 }, (_, rowIndex) => {
                  const itWardLines = (applicant.itWard || '').match(/.{1,20}/g) || [];
                  const lineValue = itWardLines[rowIndex] || '';
                  return (
                    <div key={rowIndex}>
                      {renderCharacterBoxes(lineValue, 20, BOX_WIDTH)}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Correspondence Address - 3 rows of 20 boxes each */}
            <div className="flex items-start" style={{ gap: `${FIELD_GAP}px` }}>
              <label className="font-bold text-gray-900 flex-shrink-0 pt-1" style={{ fontSize: '11px', fontWeight: 'bold', width: `${LABEL_WIDTH}px` }}>
                Correspondence Address:
              </label>
              <div className="flex flex-col space-y-0.5">
                {Array.from({ length: 3 }, (_, rowIndex) => {
                  const addressLines = (applicant.correspondenceAddress || '').match(/.{1,20}/g) || [];
                  const lineValue = addressLines[rowIndex] || '';
                  return (
                    <div key={rowIndex}>
                      {renderCharacterBoxes(lineValue, 20, BOX_WIDTH)}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tel No. - 20 boxes */}
            <div className="flex items-center" style={{ gap: `${FIELD_GAP}px` }}>
              <label className="font-bold text-gray-900 flex-shrink-0" style={{ fontSize: '11px', fontWeight: 'bold', width: `${LABEL_WIDTH}px` }}>
                Tel No.:
              </label>
              {renderCharacterBoxes(applicant.telNo || '', 20, BOX_WIDTH)}
            </div>

            {/* Mobile - 20 boxes */}
            <div className="flex items-center" style={{ gap: `${FIELD_GAP}px` }}>
              <label className="font-bold text-gray-900 flex-shrink-0" style={{ fontSize: '11px', fontWeight: 'bold', width: `${LABEL_WIDTH}px` }}>
                Mobile:
              </label>
              {renderCharacterBoxes(applicant.phone || '', 20, BOX_WIDTH)}
            </div>

            {/* Email - 20 boxes */}
            <div className="flex items-center" style={{ gap: `${FIELD_GAP}px` }}>
              <label className="font-bold text-gray-900 flex-shrink-0" style={{ fontSize: '11px', fontWeight: 'bold', width: `${LABEL_WIDTH}px` }}>
                E-Mail ID:
              </label>
              {renderCharacterBoxes(applicant.email || '', 20, BOX_WIDTH)}
            </div>
          </div>

          {/* Right Column - Photo - Fixed width, no overflow */}
          <div className="flex-shrink-0" style={{ width: `${PHOTO_WIDTH}px` }}>
            <div className="border-2 border-red-500 bg-white p-2" style={{ borderColor: '#ef4444', borderWidth: '2px', width: '100%' }}>
              <label className="block font-bold text-gray-900 text-center mb-1.5 uppercase tracking-wider" style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                AFFIX PHOTOGRAPH
              </label>
              <div className="aspect-[3/4] bg-white border border-gray-400 flex items-center justify-center overflow-hidden" style={{ width: '100%', aspectRatio: '3/4' }}>
                {applicant.photograph ? (
                  <img
                    src={applicant.photograph}
                    alt="Applicant Photo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-center px-1" style={{ fontSize: '8px' }}>
                    Photo
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Signature Section - Bottom of form (matches original PDF layout) - Only on page 5 */}
        {applicantNumber === 1 && (
          <div className="mt-5 pt-3 border-t border-gray-400 flex items-start gap-10">
            <div>
              <div className="mb-1">
                <label className="font-bold text-gray-900" style={{ fontSize: '11px', fontWeight: 'bold' }}>
                  Signature:
                </label>
              </div>
              <div className="border-2 border-dashed border-gray-600 bg-white flex items-center justify-center relative" style={{ width: '170px', height: '45px', borderWidth: '1.5px' }}>
                {applicant.signature ? (
                  <img
                    src={applicant.signature}
                    alt="Signature"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-500 text-center px-1" style={{ fontSize: '9px' }}>
                    Sole/First Applicant
                  </span>
                )}
              </div>
            </div>
            <div>
              <div className="mb-1">
                <label className="font-bold text-gray-900" style={{ fontSize: '11px', fontWeight: 'bold' }}>
                  Signature:
                </label>
              </div>
              <div className="border-2 border-dashed border-gray-600 bg-white flex items-center justify-center" style={{ width: '170px', height: '45px', borderWidth: '1.5px' }}>
                {formData?.applicants[1]?.signature ? (
                  <img
                    src={formData.applicants[1].signature}
                    alt="Second Applicant Signature"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-500 text-center px-1" style={{ fontSize: '9px' }}>
                    Second Applicant, if any
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render apartment declaration form - Exact match to original form UI
  const renderApartmentForm = () => {
    if (!formData) return null;

    const CONTAINER_WIDTH = 612;
    const PADDING = 20;

    return (
      <div className="relative bg-white print:overflow-hidden" style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', width: `${CONTAINER_WIDTH}px`, maxWidth: `${CONTAINER_WIDTH}px`, minWidth: `${CONTAINER_WIDTH}px`, overflow: 'hidden', boxSizing: 'border-box' }}>
        {/* Apartment Details Section */}
        <div className="mb-4 print:mb-2" style={{ paddingLeft: `${PADDING}px`, paddingRight: `${PADDING}px` }}>
          <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-400 pb-2 print:pb-1" style={{ fontSize: '14px', fontWeight: 'bold' }}>
            4. DETAILS OF THE SAID APARTMENT AND ITS PRICING
          </h2>
        </div>

        <div className="space-y-3 mb-6 print:mb-4" style={{ paddingLeft: `${PADDING}px`, paddingRight: `${PADDING}px` }}>
          {/* Tower */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-800 w-40 flex-shrink-0">
              Tower:
            </label>
            {renderCharacterBoxes(formData.tower || '', 15)}
          </div>

          {/* Apartment Number */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-800 w-40 flex-shrink-0">
              Apartment No.:
            </label>
            {renderCharacterBoxes(formData.apartmentNumber || '', 15)}
          </div>

          {/* Type */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-800 w-40 flex-shrink-0">
              Type:
            </label>
            {renderCharacterBoxes(formData.bhkType ? (formData.bhkType === '3bhk' ? '3 BHK' : '4 BHK') : '', 10)}
          </div>

          {/* Floor */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-800 w-40 flex-shrink-0">
              Floor:
            </label>
            {renderCharacterBoxes(formData.floor || '', 15)}
          </div>

          {/* Carpet Area */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-800 w-40 flex-shrink-0">
                Carpet Area (sq. meter):
              </label>
              {renderCharacterBoxes(formData.carpetAreaSqm || '', 10)}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-800 w-32 flex-shrink-0">
                (sq. feet):
              </label>
              {renderCharacterBoxes(formData.carpetAreaSqft || '', 10)}
            </div>
          </div>

          {/* Unit Price */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-800 w-40 flex-shrink-0">
              Unit Price (in rupees):
            </label>
            {renderCharacterBoxes(formData.unitPrice ? formData.unitPrice.replace(/[₹,]/g, '') : '', 15)}
          </div>

          {/* Total Price */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-800 w-40 flex-shrink-0">
              Total Price (in rupees):
            </label>
            {renderCharacterBoxes(formData.totalPrice ? formData.totalPrice.replace(/[₹,]/g, '') : '', 15)}
          </div>
        </div>

        {/* Declaration Section */}
        <div className="mt-8 pt-6 border-t-2 border-gray-400 print:mt-4 print:pt-3" style={{ paddingLeft: `${PADDING}px`, paddingRight: `${PADDING}px` }}>
          <h2 className="text-lg font-bold mb-4 text-gray-800 border-b-2 border-gray-400 pb-2 print:mb-2 print:pb-1" style={{ fontSize: '14px', fontWeight: 'bold' }}>
            5. DECLARATION
          </h2>
          <div className="p-4 bg-gray-50 rounded-md border border-gray-300 text-sm text-gray-700 mb-6">
            <p>
              The <strong>Applicant(s)</strong> hereby declares that the above particulars / information given by the <strong>Applicant(s)</strong> are true and correct and nothing has been concealed therefrom.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-800 w-20 flex-shrink-0">
                Date:
              </label>
              {renderCharacterBoxes(formData.declarationDate || '', 10)}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-800 w-20 flex-shrink-0">
                Place:
              </label>
              {renderCharacterBoxes(formData.declarationPlace || '', 25)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your application...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back to Form
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:bg-white print:p-0">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-4 md:p-6 print:shadow-none print:rounded-none print:p-0 print:max-w-none">
        {/* Header - Hidden on Print */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4 no-print print:hidden">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Application Submitted Successfully
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Application ID: {applicationId} | Applicants: {applicantCount}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
            >
              Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
            >
              Print
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition-colors"
            >
              New Application
            </button>
          </div>
        </div>

        {/* PDF Document - Render static pages 1-4, 9+ and replace 5-8 with HTML forms */}
        {pdfUrl && formData && (
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex flex-col items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading PDF...</p>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center p-12 text-red-600">
                <p className="text-lg font-semibold mb-2">Error loading PDF</p>
                <p className="text-sm">Please try refreshing the page</p>
              </div>
            }
            options={documentOptions}
          >
            {/* Render all pages - Replace pages 5, 6, 7, 8 with HTML forms */}
            {Array.from(new Array(numPages), (el, index) => {
              const pageNumber = index + 1;

              // Render pages 1-4 as static PDF
              if (pageNumber < 5) {
                return (
                  <div
                    key={`page_${pageNumber}`}
                    className="mb-6 relative flex justify-center w-full print-pdf-container"
                  >
                    <div
                      className="relative shadow-xl bg-white rounded-lg border-2 border-gray-200 print:shadow-none print:border-0 print:rounded-none"
                      style={{
                        maxWidth: '612px',
                        width: '612px',
                        overflow: 'hidden',
                        margin: '0 auto',
                      }}
                    >
                      <div className="absolute top-2 left-2 z-10 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg no-print print:hidden">
                        Page {pageNumber} of {numPages}
                      </div>
                      <Page
                        pageNumber={pageNumber}
                        scale={1}
                        width={612}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="block"
                      />
                    </div>
                  </div>
                );
              }

              // Page 5 - Replace with Applicant 1 HTML Form
              if (pageNumber === 5) {
                return (
                  <div key={`form_page_5`} className="mb-6 relative flex justify-center w-full print-pdf-container form-page">
                    <div
                      className="relative shadow-xl bg-white rounded-lg border-2 border-blue-300 print:shadow-none print:border-0 print:rounded-none print:p-0"
                      style={{
                        maxWidth: '612px',
                        width: '612px',
                        minWidth: '612px',
                        margin: '0 auto',
                        overflow: 'hidden',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg no-print print:hidden">
                        Page 5 - Applicant 1
                      </div>
                      <div className="p-2 pt-8 print:p-0 print:pt-0" style={{ width: '612px', overflow: 'hidden' }}>
                        {renderApplicantForm(formData.applicants[0], 1)}
                      </div>
                    </div>
                  </div>
                );
              }

              // Page 6 - Replace with Applicant 2 HTML Form (if exists), otherwise skip this page
              if (pageNumber === 6) {
                if (applicantCount >= 2 && formData.applicants[1] && formData.applicants[1].name) {
                  return (
                    <div key={`form_page_6`} className="mb-6 relative flex justify-center w-full print-pdf-container form-page">
                      <div
                        className="relative shadow-xl bg-white rounded-lg border-2 border-blue-300 print:shadow-none print:border-0 print:rounded-none print:p-0"
                        style={{
                          maxWidth: '612px',
                          width: '612px',
                          margin: '0 auto',
                          overflow: 'hidden',
                        }}
                      >
                        <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg no-print print:hidden">
                          Page 6 - Applicant 2
                        </div>
                        <div className="p-2 pt-8 print:p-0 print:pt-0" style={{ width: '612px', overflow: 'hidden' }}>
                          {renderApplicantForm(formData.applicants[1], 2)}
                        </div>
                      </div>
                    </div>
                  );
                }
                // If applicant 2 doesn't exist, skip this page entirely (don't show static PDF)
                return null;
              }

              // Page 7 - Replace with Applicant 3 HTML Form (if exists), otherwise skip this page
              if (pageNumber === 7) {
                if (applicantCount >= 3 && formData.applicants[2] && formData.applicants[2].name) {
                  return (
                    <div key={`form_page_7`} className="mb-6 relative flex justify-center w-full print-pdf-container form-page">
                      <div
                        className="relative shadow-xl bg-white rounded-lg border-2 border-blue-300 print:shadow-none print:border-0 print:rounded-none print:p-0"
                        style={{
                          maxWidth: '612px',
                          width: '612px',
                          margin: '0 auto',
                          overflow: 'hidden',
                        }}
                      >
                        <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg no-print print:hidden">
                          Page 7 - Applicant 3
                        </div>
                        <div className="p-2 pt-8 print:p-0 print:pt-0" style={{ width: '612px', overflow: 'hidden' }}>
                          {renderApplicantForm(formData.applicants[2], 3)}
                        </div>
                      </div>
                    </div>
                  );
                }
                // If applicant 3 doesn't exist, skip this page entirely (don't show static PDF)
                return null;
              }

              // Page 8 - Replace with Apartment Declaration HTML Form
              if (pageNumber === 8) {
                return (
                  <div key={`form_page_8`} className="mb-6 relative flex justify-center w-full print-pdf-container form-page">
                    <div
                      className="relative shadow-xl bg-white rounded-lg border-2 border-green-300 print:shadow-none print:border-0 print:rounded-none print:p-0"
                      style={{
                        maxWidth: '612px',
                        width: '612px',
                        margin: '0 auto',
                        overflow: 'hidden',
                      }}
                    >
                      <div className="absolute top-2 left-2 z-10 bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg no-print print:hidden">
                        Page 8 - Apartment & Declaration
                      </div>
                      <div className="p-2 pt-8 print:p-0 print:pt-0" style={{ width: '612px', overflow: 'hidden' }}>
                        {renderApartmentForm()}
                      </div>
                    </div>
                  </div>
                );
              }

              // Render pages 9+ as static PDF
              return (
                <div
                  key={`page_${pageNumber}`}
                  className="mb-6 relative flex justify-center w-full print-pdf-container"
                >
                  <div
                    className="relative shadow-xl bg-white rounded-lg border-2 border-gray-200 print:shadow-none print:border-0 print:rounded-none"
                    style={{
                      maxWidth: '612px',
                      width: '612px',
                      overflow: 'hidden',
                      margin: '0 auto',
                    }}
                  >
                    <div className="absolute top-2 left-2 z-10 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg no-print print:hidden">
                      Page {pageNumber} of {numPages}
                    </div>
                    <Page
                      pageNumber={pageNumber}
                      scale={1}
                      width={612}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      className="block"
                    />
                  </div>
                </div>
              );
            })}
          </Document>
        )}

        {/* Info Message - Hidden on Print */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg no-print print:hidden">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Your application has been saved successfully. Pages 1-4 and 9+ show the original PDF. Pages 5-8 show your filled form data in the redesigned HTML format matching the original form design.
          </p>
        </div>
      </div>
    </div>
  );
}
