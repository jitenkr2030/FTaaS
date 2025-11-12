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

    // In a real implementation, this would read the actual file
    // For now, we'll return mock preview data based on the dataset format
    let previewData = []
    
    switch (dataset.format) {
      case 'jsonl':
        previewData = [
          { prompt: "What is the capital of France?", completion: "The capital of France is Paris." },
          { prompt: "Explain photosynthesis in simple terms.", completion: "Photosynthesis is how plants make their own food using sunlight, water, and carbon dioxide." },
          { prompt: "What is machine learning?", completion: "Machine learning is a type of artificial intelligence that allows computers to learn and improve from experience without being explicitly programmed." }
        ]
        break
      case 'csv':
        previewData = [
          { text: "This is a sample text for classification.", label: "positive" },
          { text: "Another example of training data.", label: "neutral" },
          { text: "Negative sentiment example here.", label: "negative" }
        ]
        break
      case 'txt':
        previewData = [
          "This is the first line of the text dataset.",
          "Second line containing sample training data.",
          "Third line with more example content."
        ]
        break
      default:
        previewData = ["Sample preview data for unknown format"]
    }

    return NextResponse.json({
      datasetId: dataset.id,
      format: dataset.format,
      totalRecords: dataset.recordCount,
      preview: previewData.slice(0, 10) // Show first 10 records
    })
  } catch (error) {
    console.error('Error generating dataset preview:', error)
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    )
  }
}