import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dataset = await db.dataset.findUnique({
      where: { id: params.id }
    })

    if (!dataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      )
    }

    // In a real implementation, this would serve the actual file
    // For now, we'll generate mock data based on the dataset format
    let fileContent = ''
    let contentType = 'text/plain'
    let filename = `${dataset.name}.${dataset.format}`

    switch (dataset.format) {
      case 'jsonl':
        contentType = 'application/jsonl'
        fileContent = JSON.stringify({ prompt: "Sample prompt", completion: "Sample completion" }) + '\n'
        break
      case 'csv':
        contentType = 'text/csv'
        fileContent = 'text,label\n"Sample text",positive\n"Another example",neutral\n'
        break
      case 'txt':
        contentType = 'text/plain'
        fileContent = 'Sample text content for download\n'
        break
      default:
        fileContent = 'Sample content\n'
    }

    // Create a simple text file for download
    const buffer = Buffer.from(fileContent, 'utf-8')

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading dataset:', error)
    return NextResponse.json(
      { error: 'Failed to download dataset' },
      { status: 500 }
    )
  }
}