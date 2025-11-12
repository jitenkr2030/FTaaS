import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getInvoiceById } from '@/lib/invoice'
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

    const invoice = await getInvoiceById(params.id, user.id)

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Generate PDF content (simplified for demo)
    const pdfContent = generatePDFContent(invoice)
    
    // In a real implementation, you would use a PDF library like Puppeteer or jsPDF
    // For now, return the content as text
    return new NextResponse(pdfContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.txt"`
      }
    })
  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generatePDFContent(invoice: any): string {
  const items = invoice.items || []
  
  let content = `
INVOICE
========

Invoice Number: ${invoice.invoiceNumber}
Date: ${new Date(invoice.createdAt).toLocaleDateString()}
Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
Status: ${invoice.status}

BILL TO:
--------
${invoice.user.name}
${invoice.user.email}

DESCRIPTION:
------------
${invoice.description || 'N/A'}

ITEMS:
-----
`

  items.forEach((item: any, index: number) => {
    content += `
${index + 1}. ${item.description}
   Quantity: ${item.quantity}
   Unit Price: $${item.unitPrice.toFixed(2)}
   Amount: $${item.amount.toFixed(2)}
`
  })

  content += `
TOTAL:
-----
Amount Due: $${invoice.amount.toFixed(2)}
Currency: ${invoice.currency.toUpperCase()}

PAYMENT STATUS:
---------------
${invoice.status === 'PAID' ? `Paid on: ${new Date(invoice.paidAt).toLocaleDateString()}` : 'Unpaid'}

NOTES:
-----
Thank you for your business!
Please contact support if you have any questions about this invoice.
`

  return content
}