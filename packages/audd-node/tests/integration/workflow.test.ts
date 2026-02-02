/**
 * Tests de integración end-to-end
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AuddEngine } from '../../src';

describe('Integration: End-to-end workflow', () => {
  let engine: AuddEngine;

  beforeEach(() => {
    engine = new AuddEngine();
  });

  it('should execute complete IR -> Compare -> Resolve -> Apply flow', async () => {
    // 1. Build IR A (mock desde memoria)
    const irA = await engine.buildIR({
      source: {
        type: 'file',
        format: 'json',
        path: './fixtures/dataset-a.json',
      },
    });

    expect(irA).toBeDefined();
    expect(typeof irA).toBe('string');

    const irAParsed = JSON.parse(irA);
    expect(irAParsed.version).toBeDefined();
    expect(irAParsed.source).toBeDefined();

    // 2. Build IR B
    const irB = await engine.buildIR({
      source: {
        type: 'file',
        format: 'json',
        path: './fixtures/dataset-b.json',
      },
    });

    expect(irB).toBeDefined();
    expect(typeof irB).toBe('string');

    // 3. Compare
    const diff = await engine.compare(irA, irB, {
      threshold: 0.8,
      strategy: 'structural',
    });

    expect(diff).toBeDefined();
    const diffParsed = JSON.parse(diff);
    expect(diffParsed.version).toBeDefined();
    expect(diffParsed.changes).toBeDefined();

    // 4. Propose resolution
    const plan = await engine.proposeResolution(diff, {
      strategy: 'balanced',
      preferSource: 'merge',
    });

    expect(plan).toBeDefined();
    const planParsed = JSON.parse(plan);
    expect(planParsed.version).toBeDefined();
    expect(planParsed.actions).toBeDefined();

    // 5. Apply resolution (dry run)
    const result = await engine.applyResolution(plan, {
      dryRun: true,
      backup: true,
    });

    expect(result).toBeDefined();
    const resultParsed = JSON.parse(result);
    expect(resultParsed.applied).toBeDefined();
    expect(resultParsed.results).toBeDefined();
  });

  it('should validate IR structure', async () => {
    const ir = await engine.buildIR({
      source: {
        type: 'file',
        format: 'json',
        path: './test.json',
      },
    });

    const validation = await engine.validateIR(ir);
    expect(validation.ok).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should detect invalid IR', async () => {
    const validation = await engine.validateIR('{}');
    expect(validation.ok).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('should be repeatable (same input = same output)', async () => {
    const source = {
      type: 'file' as const,
      format: 'json' as const,
      path: './test.json',
    };

    const ir1 = await engine.buildIR({ source });
    const ir2 = await engine.buildIR({ source });

    // Los IRs deberían ser idénticos (excepto timestamps si los hay)
    const parsed1 = JSON.parse(ir1);
    const parsed2 = JSON.parse(ir2);

    expect(parsed1.version).toBe(parsed2.version);
    expect(parsed1.source).toEqual(parsed2.source);
  });
});
