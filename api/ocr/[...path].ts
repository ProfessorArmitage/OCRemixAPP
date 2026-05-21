export const config = { runtime: 'edge' }

export default async function handler(request: Request): Promise<Response> {
  const url       = new URL(request.url)
  const targetPath = url.pathname.replace(/^\/api\/ocr/, '') || '/'
  const targetUrl  = `https://ocremix.org${targetPath}${url.search}`

  try {
    const res = await fetch(targetUrl, {
      method:   request.method,
      redirect: 'follow',   // resolve redirects server-side — browser never sees them
      headers: {
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept':          'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control':   'no-cache',
      },
    })

    if (!res.ok) {
      return new Response(null, { status: res.status })
    }

    const body = request.method === 'HEAD' ? null : await res.text()
    return new Response(body, {
      status:  res.status,
      headers: {
        'Content-Type':                res.headers.get('content-type') || 'text/html',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return new Response(null, { status: 502 })
  }
}
