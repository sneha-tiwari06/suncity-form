# Suncity Monarch Application Form

A web-based PDF application system for legal document processing with pixel-perfect PDF generation.

## Features

- Multi-page PDF display with fillable fields on pages 5-8
- Single signature upload applies to all signature fields
- Multi-applicant support (add second/third applicant dynamically)
- Dynamic image loading on page 21 based on BHK selection (3/4 BHK)
- Pixel-perfect PDF generation using pdf-lib
- Admin dashboard for viewing and managing submitted applications
- Print-ready output with zero visual deviation

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- react-pdf for PDF rendering
- pdf-lib for PDF manipulation
- MongoDB with Mongoose for database
- Tailwind CSS for styling

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up MongoDB:
   - Install MongoDB locally or use MongoDB Atlas
   - Create a `.env.local` file with your MongoDB connection string:
   ```env
   MONGODB_URI=mongodb://localhost:27017/form-suncity
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. Copy the PDF file to `public/form.pdf`:
```bash
cp "Suncity_Monarch_Application Form FINAL 6 JAN 2025.pdf" public/form.pdf
```

4. Create image folders:
```bash
mkdir -p public/images/3bhk
mkdir -p public/images/4bhk
# Add your images to these folders
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

- `/app` - Next.js App Router pages
- `/components` - React components
- `/lib` - Utility functions and PDF processing
- `/prisma` - Database schema
- `/public/images` - Images for BHK plans (3bhk, 4bhk folders)
- `/public/form.pdf` - Original PDF form

## Field Mapping & Coordinates

Field coordinates are defined in `/lib/pdf-coordinates.ts`. These coordinates are measured from the PDF's coordinate system and must be precise for pixel-perfect alignment.

## Print Validation

The application ensures:
- A4 size output
- No scaling
- No layout shift
- No font substitution
- Identical output to original PDF
