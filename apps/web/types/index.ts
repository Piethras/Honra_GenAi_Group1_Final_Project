export type Plan = 'FREE' | 'PRO' | 'TEAM' | 'ENTERPRISE';
export type OrgRole = 'ADMIN' | 'ANALYST' | 'VIEWER';
export type DataStatus = 'PROCESSING' | 'READY' | 'ERROR';
export type QueryStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'ERROR';

export interface ColumnSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'unknown';
  nullCount: number;
  uniqueCount: number;
  sampleValues: (string | number | boolean | null)[];
}

export interface QueryResult {
  answer: string;
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'table';
  chartConfig: {
    type: string;
    columns: string[];
    xKey?: string;
    yKey?: string;
  };
  data: Record<string, unknown>[];
  generatedCode: string;
  durationMs?: number;
}

export interface InsightCard {
  id?: string;
  title: string;
  description: string;
  type: 'trend' | 'outlier' | 'summary' | 'correlation';
  confidence: 'high' | 'medium' | 'low';
  chartConfig?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function apiSuccess<T>(data: T): ApiSuccess<T> {
  return {
    success: true,
    data,
    meta: { timestamp: new Date().toISOString() },
  };
}

export function apiError(code: string, message: string): ApiError {
  return { success: false, error: { code, message } };
}
