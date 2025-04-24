import { NextResponse, type NextRequest } from 'next/server'
import { getCompletionAI, getModel } from '../utils'
// Dynamic import for the template file
import templateFile from './system.hbs'
import { getUser } from '../stytch'
import { getFirestore } from '../firebase'
import { initAPIConfig } from '@/lib/apiUtils'
import { withAPITracing } from '@/lib/apiWithTracing'
const templateText = templateFile.toString()

export const runtime = 'nodejs'

export const POST = withAPITracing(async (req: NextRequest) => {
  try {
    await initAPIConfig()

    const { messages: _messages, id } = await req.json()

    await getUser(req)

    const fs = getFirestore()

    const doc = await fs.collection('ip').doc(id).get()
    const data = doc.data()
    if (!data) {
      throw new Error('Document not found')
    }
    const { name, description } = data
    const messages: {
      role: 'assistant' | 'user' | 'system'
      content: string
    }[] = _messages

    if (
      messages.find(
        ({ role, content }) =>
          role === 'assistant' && /^(None),\d*/i.test(content)
      )
    ) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Completed' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
    const previous: {
      content: string
      role: 'assistant' | 'user' | 'system'
    }[] = []
    for (const message of messages) {
      switch (message.role) {
        case 'user':
          previous.push({ ...message, role: 'assistant' })
          break
        case 'assistant':
          previous.push({
            ...message,
            content: message.content.replace(/^(Yes|No|Stop)/i, '$1'),
            role: 'user',
          })
          if (previous.at(-1)?.content === 'Stop') {
            return new NextResponse(
              JSON.stringify({ success: false, error: 'Completed' }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              }
            )
          }
          break
      }
    }
    const _data: Record<string, string> = {
      name,
      description,
    }
    const _content = templateText.replace(
      /\{\{([^}]*)\}\}/g,
      (_match, name) => {
        return _data[name.trim()] || ''
      }
    )
    const completion = await getCompletionAI().chat.completions.create({
      model: getModel('COMPLETION'), // Use the appropriate model
      messages: [
        {
          role: 'system',
          content: _content,
        },
      ].concat(previous) as unknown as {
        role: 'user' | 'assistant' | 'system'
        content: string
      }[],
    })
    const choices = completion.choices as {
      message: { role: string; content: string }
    }[]
    const content = choices
      .flatMap(({ message: { content = '' } = { content: '' } }) =>
        content.split('\n')
      )
      .join('\n')
    console.log('seeker', content)
    messages.push({ content, role: 'user' })
    return new NextResponse(JSON.stringify({ success: true, messages }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)
    const { message, request_id, status, name, headers } = error as {
      message?: string
      request_id?: string
      status?: number
      name?: string
      headers?: Record<string, unknown>
    }
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: {
          message: message || 'Internal Server Error',
          request_id,
          status,
          name,
          headers,
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
