const retiredPhotos = new Set(['ho_con.png', 'like.jpg', 'rau.jpg', 'thom_thom.jpg']);

/** Old public photo URLs must not be served by retained Pages/CDN assets. */
export function onRequest({ params, next }) {
  if (retiredPhotos.has(String(params.name ?? ''))) {
    return new Response(null, {
      status: 410,
      headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
    });
  }
  return next();
}
