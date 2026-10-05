export class ApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`API error ${status}`)
    this.status = status
  }
}

// GET si no hay body; POST con JSON si lo hay. La cookie de sesión viaja sola (mismo origen).
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(
    `/api${path}`,
    body === undefined
      ? undefined
      : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  )
  if (!res.ok) throw new ApiError(res.status)
  return res.json()
}
