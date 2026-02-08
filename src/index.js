export default {
  async fetch(request) {
    const url = new URL(request.url)
    const domain = url.searchParams.get('domain')

    if (!domain) {
      return new Response(JSON.stringify({ error: 'domain is required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      })
    }

    // Cloudflare DNS-over-HTTPS endpoint
    const dnsUrl = `https://cloudflare-dns.com/dns-query?name=${domain}&type=MX`

    const res = await fetch(dnsUrl, {
      headers: { accept: 'application/dns-json' }
    })

    const data = await res.json()

    if (!data.Answer) {
      return new Response(JSON.stringify({ error: 'No MX records found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' }
      })
    }

    const mxRecords = data.Answer
      .map(a => {
        const [priority, exchange] = a.data.split(' ')
        return { priority: Number(priority), exchange: exchange.replace(/\.$/, '') }
      })
      .sort((a, b) => a.priority - b.priority)

    return new Response(
      JSON.stringify({ domain, mx_records: mxRecords }),
      { headers: { 'content-type': 'application/json' } }
    )
  }
}
