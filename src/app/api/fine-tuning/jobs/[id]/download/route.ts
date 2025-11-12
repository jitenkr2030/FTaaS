import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fineTuningService } from '@/lib/fine-tuning'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get fine-tuning job and check if it's completed
    const job = await fineTuningService.getFineTuningJob(params.id, user.id)

    if (job.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Model is not ready for download' },
        { status: 400 }
      )
    }

    // In a real implementation, this would serve the actual model file
    // For now, we'll create a mock model file
    const modelData = {
      jobId: params.id,
      modelName: job.name,
      baseModel: job.baseModel.modelId,
      createdAt: job.completedAt,
      downloadUrl: `/models/${params.id}/model.bin`,
      fileSize: '2.5GB',
      checksum: 'sha256:mock-checksum-hash',
      format: 'pytorch_model.bin'
    }

    // Create a simple JSON file with model metadata
    const buffer = Buffer.from(JSON.stringify(modelData, null, 2), 'utf-8')

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="model-${params.id}.json"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading model:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ 
        error: error.message 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}