// Vercel Cron sends `Authorization: Bearer $CRON_SECRET` on triggered
// requests — this guards our cron routes against being invoked by anyone
// else who finds the path. Fails closed if CRON_SECRET isn't set.
export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
