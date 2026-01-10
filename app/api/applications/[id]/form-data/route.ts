import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const application = await Application.findById(params.id)
      .select('formData applicantCount bhkType')
      .lean();

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      formData: JSON.parse(application.formData),
      applicantCount: application.applicantCount,
      bhkType: application.bhkType,
    });
  } catch (error) {
    console.error('Error fetching form data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form data' },
      { status: 500 }
    );
  }
}