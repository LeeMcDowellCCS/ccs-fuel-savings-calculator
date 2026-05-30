export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { to, subject, text } = req.body ?? {}
  if (!to || !subject || !text) return res.status(400).json({ error: 'Missing required fields' })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Email service not configured' })

  const html = `<pre style="font-family:monospace;white-space:pre-wrap;font-size:14px;line-height:1.6;color:#222;">${
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }</pre>`

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Car Charger Specialists <installations@carchargerspecialists.com>',
      to:  [to],
      bcc: ['installations@carchargerspecialists.com'],
      subject,
      text,
      html,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return res.status(500).json({ error: err.message || 'Failed to send email' })
  }

  return res.status(200).json({ success: true })
}
