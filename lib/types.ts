import { Timestamp } from 'firebase/firestore'
import type {
  IPAuditDetailsJSON,
  IPAuditJSON,
  IPDocJSON,
} from './internalTypes'

export type IPDoc = IPDocJSON & {
  updatedAt: Timestamp
  createdAt: Timestamp
  canView?: boolean
}

export type IPAudit = IPAuditJSON & {
  updatedAt: Timestamp
  createdAt: Timestamp
  details?: IPAuditDetails[]
}

export type IPAuditDetails = IPAuditDetailsJSON & {
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

export function castAuditDetailsToUIDoc(
  record: IPAuditDetailsJSON & { id: string }
): IPAuditDetails {
  return {
    ...record,
    updatedAt: castToTimestamp(record.updatedAt),
    createdAt: castToTimestamp(record.createdAt),
  }
}

export function castAuditToUIDoc(
  record: IPAuditJSON,
  details?: IPAuditDetails[]
): IPAudit {
  return {
    ...record,
    details,
    updatedAt: castToTimestamp(record.updatedAt),
    createdAt: castToTimestamp(record.createdAt),
  }
}

export function castToUIDoc(record: IPDocJSON | IPDoc): IPDoc {
  return {
    ...record,
    updatedAt: castToTimestamp(record.updatedAt as Timestamp),
    createdAt: castToTimestamp(record.createdAt as Timestamp),
  }
}

export function formatDate(_date: Timestamp | Date | string | number): string {
  if (!_date) {
    return '- no date -'
  }
  let date = _date
  if (_date instanceof Timestamp) {
    date = _date.toDate()
  } else if (typeof _date === 'string' || typeof _date === 'number') {
    date = new Date(_date)
  } else if (_date instanceof Date) {
    // do nothing
  } else if (
    typeof _date === 'object' &&
    ('_seconds' in _date || 'seconds' in _date)
  ) {
    const { seconds, nanoseconds, _seconds, _nanoseconds } = _date as {
      seconds?: number
      nanoseconds?: number
      _seconds?: number
      _nanoseconds?: number
    }
    // Handle Firestore Timestamp object
    date = new Timestamp(
      seconds || _seconds || 0,
      nanoseconds || _nanoseconds || 0
    ).toDate()
  } else {
    return '- no date -'
  }
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }
  if (typeof date === 'string' || typeof date === 'number') {
    date = new Date(date)
  } else if (date instanceof Timestamp) {
    date = date.toDate()
  } else if (date instanceof Date) {
    // do nothing
  }
  return date.toLocaleString('en-US', options)
}

export function formatNumber(
  _number: number | string,
  style: 'currency' | 'decimal' = 'currency',
  currency = 'USD'
): string {
  const number =
    typeof _number === 'string' ? Number.parseFloat(_number) : _number
  return new Intl.NumberFormat('en-US', {
    style,
    ...(style === 'currency' ? { currency } : {}),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number)
}

// Add ImportToolReady interface to the global Window interface
declare global {
  interface Window {
    importToolReady?: {
      formLoaded: boolean
      titleInputReady: boolean
      [key: string]: any
    }
  }
}
