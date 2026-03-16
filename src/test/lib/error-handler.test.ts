import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AppError,
  handleError,
  validationError,
  notFoundError,
  databaseError,
  apiError,
  pipelineError,
  inventoryError,
  importError,
} from '@/lib/error-handler';
import type { ErrorCode, ErrorSeverity } from '@/lib/error-handler';

describe('AppError', () => {
  it('should create error with all fields', () => {
    const err = new AppError('test message', 'DATABASE_ERROR', 'high', {
      service: 'inventory',
      operation: 'update',
    });

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.name).toBe('AppError');
    expect(err.message).toBe('test message');
    expect(err.code).toBe('DATABASE_ERROR');
    expect(err.severity).toBe('high');
    expect(err.context.service).toBe('inventory');
    expect(err.context.operation).toBe('update');
    expect(err.timestamp).toBeDefined();
  });

  it('should use default values', () => {
    const err = new AppError('simple error');

    expect(err.code).toBe('UNKNOWN_ERROR');
    expect(err.severity).toBe('medium');
    expect(err.context).toEqual({});
  });

  it('should have ISO timestamp', () => {
    const err = new AppError('test');
    expect(() => new Date(err.timestamp)).not.toThrow();
    expect(new Date(err.timestamp).toISOString()).toBe(err.timestamp);
  });
});

describe('handleError', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should handle AppError and return structured result', () => {
    const err = new AppError('db connection lost', 'DATABASE_ERROR', 'high', {
      service: 'pipeline',
    });

    const result = handleError(err);

    expect(result.code).toBe('DATABASE_ERROR');
    expect(result.severity).toBe('high');
    expect(result.userMessage).toContain('banco de dados');
    expect(result.context.service).toBe('pipeline');
    expect(result.timestamp).toBe(err.timestamp);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle generic Error', () => {
    const err = new Error('something broke');

    const result = handleError(err);

    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.severity).toBe('medium');
    expect(result.userMessage).toContain('inesperado');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle string errors', () => {
    const result = handleError('string error');

    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.userMessage).toContain('inesperado');
  });

  it('should use fallback context for generic errors', () => {
    const result = handleError(new Error('fail'), {
      service: 'test',
      operation: 'read',
    });

    expect(result.context.service).toBe('test');
    expect(result.context.operation).toBe('read');
  });

  it('should return correct user messages for each code', () => {
    const codes: ErrorCode[] = [
      'VALIDATION_ERROR',
      'NOT_FOUND',
      'DATABASE_ERROR',
      'API_ERROR',
      'PERMISSION_ERROR',
      'PIPELINE_ERROR',
      'INVENTORY_ERROR',
      'IMPORT_ERROR',
      'UNKNOWN_ERROR',
    ];

    for (const code of codes) {
      const err = new AppError('test', code);
      const result = handleError(err);
      expect(result.userMessage).toBeDefined();
      expect(result.userMessage.length).toBeGreaterThan(10);
    }
  });
});

describe('helper factories', () => {
  it('validationError should create VALIDATION_ERROR with low severity', () => {
    const err = validationError('invalid input', { service: 'form' });
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.severity).toBe('low');
    expect(err.context.service).toBe('form');
  });

  it('notFoundError should create NOT_FOUND with low severity', () => {
    const err = notFoundError('item not found');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.severity).toBe('low');
  });

  it('databaseError should create DATABASE_ERROR with high severity', () => {
    const err = databaseError('connection timeout');
    expect(err.code).toBe('DATABASE_ERROR');
    expect(err.severity).toBe('high');
  });

  it('apiError should create API_ERROR with high severity', () => {
    const err = apiError('timeout');
    expect(err.code).toBe('API_ERROR');
    expect(err.severity).toBe('high');
  });

  it('pipelineError should create PIPELINE_ERROR with critical severity', () => {
    const err = pipelineError('stage failed', { operation: 'cutting' });
    expect(err.code).toBe('PIPELINE_ERROR');
    expect(err.severity).toBe('critical');
  });

  it('inventoryError should create INVENTORY_ERROR with medium severity', () => {
    const err = inventoryError('insufficient stock');
    expect(err.code).toBe('INVENTORY_ERROR');
    expect(err.severity).toBe('medium');
  });

  it('importError should create IMPORT_ERROR with medium severity', () => {
    const err = importError('parse failed');
    expect(err.code).toBe('IMPORT_ERROR');
    expect(err.severity).toBe('medium');
  });

  it('all helpers should return AppError instances', () => {
    const helpers = [
      validationError,
      notFoundError,
      databaseError,
      apiError,
      pipelineError,
      inventoryError,
      importError,
    ];

    for (const factory of helpers) {
      const err = factory('test');
      expect(err).toBeInstanceOf(AppError);
      expect(err).toBeInstanceOf(Error);
    }
  });
});
