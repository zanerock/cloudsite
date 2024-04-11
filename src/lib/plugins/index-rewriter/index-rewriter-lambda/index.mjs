export const handler = async (event) => {
  const { request } = event.Records[0].cf
  const { uri } = request

  if (!uri.match(/(?:^|^\/|[^/]+\.[a-zA-Z0-9]+)$/)) {
    if (!uri.endsWith('/')) {
      request.uri += '/'
    }
    request.uri += 'index.html'
  }

  return request
}
