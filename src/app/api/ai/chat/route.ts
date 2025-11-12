import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { messages, model = 'gpt-3.5-turbo', temperature = 0.7, maxTokens = 1000 } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages must be an array of message objects' },
        { status: 400 }
      )
    }

    // Validate message format
    for (const message of messages) {
      if (!message.role || !message.content) {
        return NextResponse.json(
          { error: 'Each message must have a role and content' },
          { status: 400 }
        )
      }
    }

    try {
      const zai = await ZAI.create()

      const completion = await zai.chat.completions.create({
        messages,
        temperature,
        max_tokens: maxTokens,
        // Note: The z-ai-web-dev-sdk might have different parameter names
        // Adjust based on the actual SDK documentation
      })

      const messageContent = completion.choices[0]?.message?.content

      if (!messageContent) {
        return NextResponse.json(
          { error: 'No response generated' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        id: completion.id,
        object: 'chat.completion',
        created: Date.now(),
        model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: messageContent
          },
          finish_reason: completion.choices[0]?.finish_reason || 'stop'
        }],
        usage: completion.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      })

    } catch (error) {
      console.error('ZAI API Error:', error)
      return NextResponse.json(
        { error: 'Failed to generate AI response', details: error.message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Chat completion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}