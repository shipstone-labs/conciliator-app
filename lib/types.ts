import { Timestamp } from 'firebase/firestore'
import type { IPDocJSON } from './internalTypes'

export type IPDoc = IPDocJSON & {
  updatedAt: Timestamp
  createdAt: Timestamp
}

export function castToTimestamp(date: unknown): Timestamp {
  if (date instanceof Timestamp) {
    return date
  }
  if (typeof date === 'number') {
    return new Timestamp(date, 0)
  }
  if (typeof date === 'string') {
    return new Timestamp(Date.parse(date), 0)
  }
  if (
    date &&
    typeof date === 'object' &&
    '_seconds' in date &&
    '_nanoseconds' in date
  ) {
    return new Timestamp(
      (date as { _seconds: number })._seconds,
      (date as { _nanoseconds: number })._nanoseconds
    )
  }
  return new Timestamp(0, 0)
}

export function castToUIDoc(record: IPDocJSON | IPDoc): IPDoc {
  return {
    ...record,
    updatedAt: castToTimestamp(record.updatedAt as Timestamp),
    createdAt: castToTimestamp(record.createdAt as Timestamp),
  }
}
