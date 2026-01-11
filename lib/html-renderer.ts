import { FormData, ApplicantData } from './types';

/**
 * Server-side HTML rendering utilities for pages 5-8
 * These generate HTML strings that match the preview page design
 */

const CONTAINER_WIDTH = 612; // A4 width in pixels
const PADDING = 20;
const PHOTO_WIDTH = 130;
const GAP = 16;
const LABEL_WIDTH = 155;
const FIELD_GAP = 10;
const BOX_WIDTH = 20;
const BOX_HEIGHT = 24;
const BORDER_WIDTH = 1.5;

/**
 * Render character boxes HTML
 */
function renderCharacterBoxesHTML(value: string, boxCount: number = 20, boxWidth: number = BOX_WIDTH): string {
  const chars = value ? value.toString().split('').slice(0, boxCount) : [];
  const totalWidth = (boxWidth + (BORDER_WIDTH * 2)) * boxCount;

  const boxes = Array.from({ length: boxCount }, (_, i) => {
    const char = chars[i] || '';
    return `
      <div style="
        width: ${boxWidth}px;
        height: ${BOX_HEIGHT}px;
        min-width: ${boxWidth}px;
        max-width: ${boxWidth}px;
        min-height: ${BOX_HEIGHT}px;
        font-size: 10px;
        font-weight: 600;
        line-height: ${BOX_HEIGHT}px;
        border: ${BORDER_WIDTH}px solid #ef4444;
        background-color: white;
        color: #111827;
        text-align: center;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        flex-shrink: 0;
        flex-grow: 0;
      ">${char}</div>
    `;
  }).join('');

  return `
    <div style="
      display: flex;
      gap: 0;
      width: ${totalWidth}px;
      max-width: ${totalWidth}px;
      min-width: ${totalWidth}px;
      overflow: hidden;
      flex-direction: row;
      flex-wrap: nowrap;
      align-items: center;
    ">${boxes}</div>
  `;
}

/**
 * Render signature footer HTML
 */
function renderSignatureFooterHTML(formData: FormData): string {
  const hasFirstSignature = formData.applicants[0]?.signature;
  const hasSecondSignature = formData.applicants[1]?.signature;

  if (!hasFirstSignature && !hasSecondSignature) return '';

  let html = '<div style="margin-top: 20px; padding-top: 12px; border-top: 1px solid #9ca3af; display: flex; align-items: flex-start; gap: 40px; padding-left: 20px; padding-right: 20px;">';

  if (hasFirstSignature) {
    html += `
      <div>
        <div style="margin-bottom: 4px; text-align: center;">
          <span style="color: #374151; font-style: italic; font-size: 11px;">Sole/First Applicant</span>
        </div>
        <div style="margin-bottom: 4px;">
          <label style="font-weight: bold; color: #111827; font-size: 11px;">Signature:</label>
        </div>
        <div style="border: 1.5px dashed #ef4444; background-color: white; width: 170px; height: 45px; display: flex; align-items: center; justify-content: center;">
          <img src="${formData.applicants[0].signature}" alt="Signature" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
        </div>
      </div>
    `;
  }

  if (hasSecondSignature) {
    html += `
      <div>
        <div style="margin-bottom: 4px; text-align: center;">
          <span style="color: #374151; font-style: italic; font-size: 11px;">Second Applicant, if any</span>
        </div>
        <div style="margin-bottom: 4px;">
          <label style="font-weight: bold; color: #111827; font-size: 11px;">Signature:</label>
        </div>
        <div style="border: 1.5px dashed #ef4444; background-color: white; width: 170px; height: 45px; display: flex; align-items: center; justify-content: center;">
          <img src="${formData.applicants[1].signature}" alt="Second Applicant Signature" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
        </div>
      </div>
    `;
  }

  html += '</div>';
  return html;
}

/**
 * Render applicant form HTML (Page 5, 6, 7)
 */
export function renderApplicantFormHTML(applicant: ApplicantData, applicantNumber: number, formData: FormData): string {
  if (!applicant || (!applicant.name && applicantNumber > 1)) return '';

  const titleName = `${applicant.title || ''} ${applicant.name || ''}`.trim() || '';
  const residentialStatus = applicant.residentialStatus || '';
  
  // Split multi-line fields
  const itWardLines = (applicant.itWard || '').match(/.{1,20}/g) || [];
  const addressLines = (applicant.correspondenceAddress || '').match(/.{1,20}/g) || [];

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=612, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          width: ${CONTAINER_WIDTH}px;
          max-width: ${CONTAINER_WIDTH}px;
          min-width: ${CONTAINER_WIDTH}px;
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          font-size: 13px;
          background: white;
          overflow: hidden;
        }
        .container {
          width: ${CONTAINER_WIDTH}px;
          max-width: ${CONTAINER_WIDTH}px;
          min-width: ${CONTAINER_WIDTH}px;
          overflow: hidden;
          box-sizing: border-box;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #1f2937;
          padding-left: ${PADDING}px;
          padding-right: ${PADDING}px;
        }
        .field-row {
          display: flex;
          align-items: center;
          gap: ${FIELD_GAP}px;
          margin-bottom: 6px;
        }
        .label {
          font-weight: bold;
          color: #111827;
          font-size: 9px;
          width: ${LABEL_WIDTH}px;
          flex-shrink: 0;
        }
        .fields-area {
          display: flex;
          gap: ${GAP}px;
          margin-bottom: 12px;
          padding-left: ${PADDING}px;
          padding-right: ${PADDING}px;
        }
        .photo-section {
          width: ${PHOTO_WIDTH}px;
          flex-shrink: 0;
        }
        .photo-box {
          border: 2px solid #ef4444;
          background: white;
          padding: 8px;
          width: 100%;
        }
        .photo-label {
          font-weight: bold;
          color: #111827;
          text-align: center;
          margin-bottom: 6px;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .photo-container {
          aspect-ratio: 3/4;
          background: white;
          border: 1px solid #9ca3af;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .photo-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .checkbox-group {
          display: flex;
          flex-direction: row;
          gap: 6px;
        }
        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .checkbox {
          width: 12px;
          height: 12px;
          border: 1.5px solid #374151;
          background: ${residentialStatus === 'Resident' ? '#111827' : 'white'};
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .checkbox-text {
          font-weight: bold;
          color: #111827;
          font-size: 9px;
        }
        .multi-line-field {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="flex: 1;">
            <h2 style="font-weight: bold; color: #111827; text-transform: uppercase; font-size: 14px; margin: 0;">
              ${applicantNumber}. ${applicantNumber === 1 ? 'SOLE OR FIRST APPLICANT(S):-' : `JOINT APPLICANT ${applicantNumber - 1}:-`}
            </h2>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-left: 24px;">
            <div style="display: flex; gap: 2px; margin-right: 8px;">
              <div style="width: 2px; height: 36px; background: #111827;"></div>
              <div style="width: 2px; height: 36px; background: #111827;"></div>
              <div style="width: 2px; height: 36px; background: #111827;"></div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: bold; color: #111827; text-transform: uppercase; font-size: 10px; letter-spacing: 0.3px; line-height: 1.2;">SUNCITY'S</div>
              <div style="font-weight: bold; color: #111827; text-transform: uppercase; font-size: 10px; letter-spacing: 0.3px; line-height: 1.2;">MONARCH</div>
              <div style="font-weight: bold; color: #111827; text-transform: uppercase; font-size: 10px; letter-spacing: 0.3px; line-height: 1.2;">RESIDENCES</div>
            </div>
          </div>
        </div>

        <div class="fields-area">
          <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
            <div class="field-row">
              <div class="label">Mr./Mrs./Ms./M/s.</div>
              ${renderCharacterBoxesHTML(titleName, 20, BOX_WIDTH)}
            </div>
            <div class="field-row">
              <div class="label">Son/Wife/Daughter of.</div>
              ${renderCharacterBoxesHTML(applicant.sonWifeDaughterOf || '', 20, BOX_WIDTH)}
            </div>
            <div class="field-row">
              <div class="label">Nationality:</div>
              ${renderCharacterBoxesHTML(applicant.nationality || '', 20, BOX_WIDTH)}
            </div>
            <div class="field-row">
              <div class="label">Age:</div>
              ${renderCharacterBoxesHTML(applicant.age || '', 20, BOX_WIDTH)}
            </div>
            <div class="field-row">
              <div class="label">DOB:</div>
              ${renderCharacterBoxesHTML(applicant.dob || '', 20, BOX_WIDTH)}
            </div>
            <div class="field-row">
              <div class="label">Profession:</div>
              ${renderCharacterBoxesHTML(applicant.profession || '', 20, BOX_WIDTH)}
            </div>
            <div class="field-row">
              <div class="label">Aadhar No.:</div>
              ${renderCharacterBoxesHTML(applicant.aadhaar || '', 20, BOX_WIDTH)}
            </div>
            <div class="field-row" style="align-items: flex-start; padding-top: 4px;">
              <div class="label" style="padding-top: 4px;">Residential Status:</div>
              <div class="checkbox-group">
                <div class="checkbox-item">
                  <div class="checkbox" style="background: ${residentialStatus === 'Resident' ? '#111827' : 'white'}; border: 1.5px solid ${residentialStatus === 'Resident' ? '#111827' : '#374151'};">
                    ${residentialStatus === 'Resident' ? '<span style="color: white; font-weight: bold; font-size: 9px;">✓</span>' : ''}
                  </div>
                  <span class="checkbox-text">Resident</span>
                </div>
                <div class="checkbox-item">
                  <div class="checkbox" style="background: ${residentialStatus === 'Non-Resident' ? '#111827' : 'white'}; border: 1.5px solid ${residentialStatus === 'Non-Resident' ? '#111827' : '#374151'};">
                    ${residentialStatus === 'Non-Resident' ? '<span style="color: white; font-weight: bold; font-size: 9px;">✓</span>' : ''}
                  </div>
                  <span class="checkbox-text">Non- Resident</span>
                </div>
                <div class="checkbox-item">
                  <div class="checkbox" style="background: ${residentialStatus === 'Foreign National of Indian Origin' ? '#111827' : 'white'}; border: 1.5px solid ${residentialStatus === 'Foreign National of Indian Origin' ? '#111827' : '#374151'};">
                    ${residentialStatus === 'Foreign National of Indian Origin' ? '<span style="color: white; font-weight: bold; font-size: 9px;">✓</span>' : ''}
                  </div>
                  <span class="checkbox-text">Foreign National of Indian Origin</span>
                </div>
              </div>
            </div>
            <div class="field-row">
              <div class="label">Income Tax Permanent Account No.:</div>
              ${renderCharacterBoxesHTML(applicant.pan || '', 20, BOX_WIDTH)}
            </div>
            <div class="field-row" style="align-items: flex-start;">
              <div class="label" style="padding-top: 4px; line-height: 1.25;">Ward / Circle / Special Range / Place, where assessed to income tax:</div>
              <div class="multi-line-field">
                ${Array.from({ length: 2 }, (_, i) => {
                  const lineValue = itWardLines[i] || '';
                  return `<div>${renderCharacterBoxesHTML(lineValue, 20, BOX_WIDTH)}</div>`;
                }).join('')}
              </div>
            </div>
            <div class="field-row" style="align-items: flex-start;">
              <div class="label" style="padding-top: 4px;">Correspondence Address:</div>
              <div class="multi-line-field">
                ${Array.from({ length: 3 }, (_, i) => {
                  const lineValue = addressLines[i] || '';
                  return `<div>${renderCharacterBoxesHTML(lineValue, 20, BOX_WIDTH)}</div>`;
                }).join('')}
              </div>
            </div>
            <div class="field-row">
              <div class="label">Tel No.:</div>
              ${renderCharacterBoxesHTML(applicant.telNo || '', 20, BOX_WIDTH)}
            </div>
            <div class="field-row">
              <div class="label">Mobile:</div>
              ${renderCharacterBoxesHTML(applicant.phone || '', 20, BOX_WIDTH)}
            </div>
            <div class="field-row">
              <div class="label">E-Mail ID:</div>
              ${renderCharacterBoxesHTML(applicant.email || '', 20, BOX_WIDTH)}
            </div>
          </div>

          <div class="photo-section">
            <div class="photo-box">
              <div class="photo-label">AFFIX PHOTOGRAPH</div>
              <div class="photo-container">
                ${applicant.photograph ? `<img src="${applicant.photograph}" alt="Applicant Photo" />` : '<span style="color: #9ca3af; font-size: 8px;">Photo</span>'}
              </div>
            </div>
          </div>
        </div>

        ${renderSignatureFooterHTML(formData)}
      </div>
    </body>
    </html>
  `;

  return html;
}

/**
 * Render apartment form HTML (Page 8)
 */
export function renderApartmentFormHTML(formData: FormData): string {
  const RATE_BOX_WIDTH = 180;
  const bhkTypeDisplay = formData.bhkType === '3bhk' ? '3 BHK' : formData.bhkType === '4bhk' ? '4 BHK' : '';
  const unitPriceClean = formData.unitPrice ? formData.unitPrice.replace(/[₹,]/g, '') : '';
  const totalPriceClean = formData.totalPrice ? formData.totalPrice.replace(/[₹,]/g, '') : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=612, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          width: ${CONTAINER_WIDTH}px;
          max-width: ${CONTAINER_WIDTH}px;
          min-width: ${CONTAINER_WIDTH}px;
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          font-size: 13px;
          background: white;
          overflow: hidden;
        }
        .container {
          width: ${CONTAINER_WIDTH}px;
          max-width: ${CONTAINER_WIDTH}px;
          min-width: ${CONTAINER_WIDTH}px;
          overflow: hidden;
          box-sizing: border-box;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #1f2937;
          padding-left: ${PADDING}px;
          padding-right: ${PADDING}px;
        }
        .section-title {
          font-weight: bold;
          color: #111827;
          border-bottom: 2px solid #9ca3af;
          padding-bottom: 8px;
          margin-bottom: 12px;
          font-size: 14px;
          padding-left: ${PADDING}px;
          padding-right: ${PADDING}px;
        }
        .field-row {
          display: flex;
          align-items: center;
          gap: ${FIELD_GAP}px;
          margin-bottom: 10px;
        }
        .label {
          font-weight: bold;
          color: #111827;
          font-size: 11px;
          width: 120px;
          flex-shrink: 0;
        }
        .value-field {
          border-bottom: 1px solid #111827;
          flex: 1;
          min-width: 150px;
          height: 20px;
          font-size: 11px;
          padding-left: 4px;
        }
        .fields-section {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          padding-left: ${PADDING}px;
          padding-right: ${PADDING}px;
        }
        .rate-box {
          border: 2px solid #111827;
          padding: 8px;
          min-height: 200px;
          width: ${RATE_BOX_WIDTH}px;
          flex-shrink: 0;
        }
        .note-section {
          font-size: 10px;
          line-height: 1.4;
          color: #374151;
          padding-left: ${PADDING}px;
          padding-right: ${PADDING}px;
          margin-bottom: 16px;
        }
        .declaration-section {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 2px solid #9ca3af;
          padding-left: ${PADDING}px;
          padding-right: ${PADDING}px;
        }
        .declaration-title {
          font-weight: bold;
          color: #111827;
          margin-bottom: 12px;
          border-bottom: 2px solid #9ca3af;
          padding-bottom: 8px;
          font-size: 14px;
        }
        .declaration-text {
          font-size: 11px;
          line-height: 1.5;
          color: #374151;
          margin-bottom: 16px;
        }
        .declaration-footer {
          margin-top: 24px;
        }
        .date-place-row {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .date-place-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="flex: 1;"></div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="display: flex; gap: 2px; margin-right: 8px;">
              <div style="width: 2px; height: 36px; background: #111827;"></div>
              <div style="width: 2px; height: 36px; background: #111827;"></div>
              <div style="width: 2px; height: 36px; background: #111827;"></div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: bold; color: #111827; text-transform: uppercase; font-size: 10px; letter-spacing: 0.3px; line-height: 1.2;">SUNCITY'S</div>
              <div style="font-weight: bold; color: #111827; text-transform: uppercase; font-size: 10px; letter-spacing: 0.3px; line-height: 1.2;">MONARCH</div>
              <div style="font-weight: bold; color: #111827; text-transform: uppercase; font-size: 10px; letter-spacing: 0.3px; line-height: 1.2;">RESIDENCES</div>
            </div>
          </div>
        </div>

        <div class="section-title">4. DETAILS OF THE SAID APARTMENT AND ITS PRICING</div>

        <div class="fields-section">
          <div style="flex: 1; display: flex; flex-direction: column; gap: 10px;">
            <div class="field-row">
              <div class="label">Tower</div>
              <div class="value-field">${formData.tower || ''}</div>
            </div>
            <div class="field-row">
              <div class="label">Apartment No.</div>
              <div class="value-field">${formData.apartmentNumber || ''}</div>
            </div>
            <div class="field-row">
              <div class="label">Type</div>
              <div class="value-field">${bhkTypeDisplay}</div>
            </div>
            <div class="field-row">
              <div class="label">Floor</div>
              <div class="value-field">${formData.floor || ''}</div>
            </div>
            <div class="field-row">
              <div class="label">Carpet Area:</div>
              <div style="flex: 1; display: flex; align-items: center; gap: 8px;">
                <div class="value-field" style="min-width: 80px;">${formData.carpetAreaSqm || ''}</div>
                <span style="font-size: 11px;">square meter (</span>
                <div class="value-field" style="min-width: 80px;">${formData.carpetAreaSqft || ''}</div>
                <span style="font-size: 11px;">square feet)</span>
              </div>
            </div>
            <div class="field-row">
              <div class="label">Unit Price (in rupees)</div>
              <div class="value-field">${unitPriceClean}</div>
            </div>
            <div class="note-section">
              <p>
                Applicable taxes and cesses payable by the <strong>Applicant(s)</strong> which are in addition to total unit price (this includes GST payable at rates as specified from time to time, which at present is 5%)
              </p>
            </div>
            <div class="field-row">
              <div class="label">Total Price (in rupees)</div>
              <div class="value-field">${totalPriceClean}</div>
            </div>
          </div>

          <div class="rate-box">
            <div style="font-weight: bold; color: #111827; margin-bottom: 8px; font-size: 11px;">
              Rate of Said Apartment per square meter*
            </div>
            <div style="min-height: 160px;"></div>
          </div>
        </div>

        <div class="note-section">
          <div style="font-weight: bold; color: #111827; margin-bottom: 4px; font-size: 11px;">*NOTE:</div>
          <div style="padding-left: 12px;">
            <div style="margin-bottom: 4px;">
              1. The <strong>Total Price</strong> for the <strong>Said Apartment</strong> is based on the <strong>Carpet Area</strong>.
            </div>
            <div>
              2. The <strong>Promoter</strong> has taken the conversion factor of 10.764 sq.ft. per sqm. for the purpose of this <strong>Application</strong> (1 feet = 304.8 mm)
            </div>
          </div>
        </div>

        <div class="declaration-section">
          <div class="declaration-title">5. DECLARATION</div>
          <div class="declaration-text">
            The <strong>Applicant(s)</strong> hereby declares that the above particulars / information given by the <strong>Applicant(s)</strong> are true and correct and nothing has been concealed therefrom.
          </div>
          <div class="declaration-footer">
            <div style="font-weight: bold; color: #111827; font-size: 11px; margin-bottom: 8px;">Yours Faithfully</div>
            <div class="date-place-row">
              <div class="date-place-item">
                <label style="font-weight: bold; color: #111827; font-size: 11px; flex-shrink: 0;">Date:</label>
                <div class="value-field" style="min-width: 100px;">${formData.declarationDate || ''}</div>
              </div>
              <div class="date-place-item">
                <label style="font-weight: bold; color: #111827; font-size: 11px; flex-shrink: 0;">Place:</label>
                <div class="value-field" style="min-width: 150px;">${formData.declarationPlace || ''}</div>
              </div>
            </div>
          </div>

          ${renderSignatureFooterHTML(formData)}
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}
