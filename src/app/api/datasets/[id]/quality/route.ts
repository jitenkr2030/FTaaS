import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { dataQualityService, QualityAssessmentOptions } from '@/lib/data-quality'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const datasetId = params.id
    const body = await request.json()
    const options: QualityAssessmentOptions = body.options || {}

    // Get dataset from database
    const dataset = await db.dataset.findUnique({
      where: { id: datasetId }
    })

    if (!dataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      )
    }

    // Perform quality assessment
    const assessment = await dataQualityService.assessDatasetQuality(datasetId, options)

    return NextResponse.json({
      assessment,
      message: 'Quality assessment completed successfully'
    })

  } catch (error) {
    console.error('Error assessing dataset quality:', error)
    return NextResponse.json(
      { error: 'Failed to assess dataset quality' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const datasetId = params.id
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'latest'
    const period = searchParams.get('period') || 'month'
    const industry = searchParams.get('industry') || 'general'

    switch (type) {
      case 'latest':
        // Get latest quality assessment
        const latestAssessment = await db.qualityAssessment.findFirst({
          where: { datasetId },
          orderBy: { assessedAt: 'desc' }
        })

        if (!latestAssessment) {
          return NextResponse.json(
            { error: 'No quality assessment found' },
            { status: 404 }
          )
        }

        return NextResponse.json(latestAssessment)

      case 'history':
        // Get quality history/trends
        const qualityHistory = await dataQualityService.getQualityHistory(datasetId, period as any)
        return NextResponse.json(qualityHistory)

      case 'benchmark':
        // Get quality benchmark comparison
        const benchmark = await dataQualityService.getQualityBenchmark(datasetId, industry)
        return NextResponse.json(benchmark)

      case 'all':
        // Get all assessments
        const allAssessments = await db.qualityAssessment.findMany({
          where: { datasetId },
          orderBy: { assessedAt: 'desc' }
        })
        return NextResponse.json(allAssessments)

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error fetching quality data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quality data' },
      { status: 500 }
    )
  }
}