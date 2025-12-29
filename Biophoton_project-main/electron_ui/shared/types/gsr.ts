export type GsrParsed = {
  kind: 'GSR'
  t: number
  vRaw: number // 0..4095
  vNorm: number // 0..1
  vPercent: number // 0..100
}

export type WorkerOutData = { type: 'data'; raw: string; parsed?: GsrParsed }

export type WorkerOut =
  | { type: 'open'; path: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: 'ports'; ports: any[] }
  | { type: 'write'; line: string }
  | WorkerOutData
  | { type: 'closed'; reason?: string }
  | { type: 'error'; error: string }

export type WorkerIn = { type: 'write'; line: string } | { type: 'close' }
