import { NextRequest, NextResponse } from 'next/server'
import { getQueueStats, addFineTuningJob, addEvaluationJob, addProcessingJob } from '@/lib/queue'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'stats') {
      const stats = await getQueueStats()
      return NextResponse.json(stats)
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })
  } catch (error) {
    console.error('Queue API error:', error)
    return NextResponse.json(
      { error: 'Failed to process queue request' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Type and data are required' },
        { status: 400 }
      )
    }

    let job
    switch (type) {
      case 'fine-tuning':
        job = await addFineTuningJob(data)
        break
      case 'evaluation':
        job = await addEvaluationJob(data)
        break
      case 'processing':
        job = await addProcessingJob(data)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid job type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      id: job.id,
      type,
      status: 'queued',
      data: job.data,
    })
  } catch (error) {
    console.error('Queue job creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create queue job' },
      { status: 500 }
    )
  }
}