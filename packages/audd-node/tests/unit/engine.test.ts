/**
 * Tests unitarios para AuddEngine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AuddEngine, createError, ErrorCode } from '../../src';

describe('AuddEngine', () => {
  let engine: AuddEngine;

  beforeEach(() => {
    engine = new AuddEngine();
  });

  describe('Static methods', () => {
    it('should return version', () => {
      const version = AuddEngine.getVersion();
      expect(version).toBeDefined();
      expect(typeof version).toBe('string');
    });

    it('should ping/pong', () => {
      const result = AuddEngine.ping();
      expect(result).toBe('pong');
    });
  });

  describe('buildIR validation', () => {
    it('should throw on missing source', async () => {
      await expect(
        // @ts-expect-error - Testing invalid input
        engine.buildIR({})
      ).rejects.toThrow('Missing source configuration');
    });

    it('should throw on missing source type', async () => {
      await expect(
        engine.buildIR({
          // @ts-expect-error - Testing invalid input
          source: { format: 'json' },
        })
      ).rejects.toThrow('Missing source type');
    });

    it('should throw on missing source format', async () => {
      await expect(
        engine.buildIR({
          // @ts-expect-error - Testing invalid input
          source: { type: 'file' },
        })
      ).rejects.toThrow('Missing source format');
    });

    it('should throw on file source without path', async () => {
      await expect(
        engine.buildIR({
          source: {
            type: 'file',
            format: 'json',
            // @ts-expect-error - Testing invalid input
            path: undefined,
          },
        })
      ).rejects.toThrow('File source requires path');
    });

    it('should throw on db source without table', async () => {
      await expect(
        engine.buildIR({
          source: {
            type: 'db',
            format: 'sqlite',
            path: '/some/path',
            // @ts-expect-error - Testing invalid input
            table: undefined,
          },
        })
      ).rejects.toThrow('Database source requires table');
    });
  });

  describe('compare validation', () => {
    it('should throw on invalid IR A', async () => {
      await expect(
        // @ts-expect-error - Testing invalid input
        engine.compare(123, '{}')
      ).rejects.toThrow('irA must be a JSON string');
    });

    it('should throw on invalid IR B', async () => {
      await expect(
        // @ts-expect-error - Testing invalid input
        engine.compare('{}', null)
      ).rejects.toThrow('irB must be a JSON string');
    });

    it('should throw on non-JSON IR A', async () => {
      await expect(engine.compare('not json', '{}')).rejects.toThrow(
        'irA is not a valid JSON string'
      );
    });

    it('should throw on non-JSON IR B', async () => {
      await expect(engine.compare('{}', 'not json')).rejects.toThrow(
        'irB is not a valid JSON string'
      );
    });
  });

  describe('proposeResolution validation', () => {
    it('should throw on invalid diff', async () => {
      await expect(
        // @ts-expect-error - Testing invalid input
        engine.proposeResolution(123)
      ).rejects.toThrow('diff must be a JSON string');
    });

    it('should throw on non-JSON diff', async () => {
      await expect(engine.proposeResolution('not json')).rejects.toThrow(
        'diff is not a valid JSON string'
      );
    });
  });

  describe('applyResolution validation', () => {
    it('should throw on invalid plan', async () => {
      await expect(
        // @ts-expect-error - Testing invalid input
        engine.applyResolution(null)
      ).rejects.toThrow('plan must be a JSON string');
    });

    it('should throw on non-JSON plan', async () => {
      await expect(engine.applyResolution('not json')).rejects.toThrow(
        'plan is not a valid JSON string'
      );
    });
  });
});

describe('Error handling', () => {
  it('should create error with correct code', () => {
    const error = createError.invalidInput('test message');
    expect(error.code).toBe(ErrorCode.INVALID_INPUT);
    expect(error.message).toBe('test message');
  });

  it('should create error with details', () => {
    const error = createError.invalidInput('test', { field: 'value' });
    expect(error.details).toEqual({ field: 'value' });
  });

  it('should serialize to JSON', () => {
    const error = createError.timeout('test operation');
    const json = error.toJSON();

    expect(json.name).toBe('AuddError');
    expect(json.code).toBe(ErrorCode.TIMEOUT);
    expect(json.message).toContain('test operation');
  });
});
