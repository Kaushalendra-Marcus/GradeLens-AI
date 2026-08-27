import { describe, it, expect } from 'vitest';
import { runMapping } from './matcher';
import type { Question, AnswerBlock } from '@/types/domain';

function q(overrides: Partial<Question> & { displayNumber: string; id: string }): Question {
  return {
    text: `Question ${overrides.displayNumber}`,
    page: 1,
    bbox: { x: 0, y: 0, width: 1, height: 1 },
    orderIndex: 0,
    ...overrides,
  } as Question;
}
function ab(overrides: Partial<AnswerBlock> & { id: string }): AnswerBlock {
  return {
    rawLabel: null,
    normalizedKey: null,
    transcribedText: 'answer',
    page: 1,
    bbox: { x: 0, y: 0, width: 1, height: 1 },
    confidence: 0.9,
    ...overrides,
  } as AnswerBlock;
}

describe('runMapping', () => {
  it('exact match', () => {
    const questions = [q({ id: 'q1', displayNumber: '1' }), q({ id: 'q2', displayNumber: '2' })];
    const blocks = [
      ab({ id: 'a1', rawLabel: '1', normalizedKey: '1' }),
      ab({ id: 'a2', rawLabel: '2', normalizedKey: '2' }),
    ];
    const { mappings, unmatched } = runMapping(questions, blocks);
    expect(unmatched).toHaveLength(0);
    expect(mappings.find((m) => m.questionId === 'q1')!.answerBlockIds).toEqual(['a1']);
    expect(mappings.find((m) => m.questionId === 'q2')!.answerBlockIds).toEqual(['a2']);
  });

  it('confusable substitution: "l1a" -> "11a"', () => {
    const questions = [q({ id: 'q11a', displayNumber: '11 (a)' })];
    const blocks = [ab({ id: 'a1', rawLabel: 'l1a', normalizedKey: 'l1a' })];
    const { mappings, unmatched } = runMapping(questions, blocks);
    expect(unmatched).toHaveLength(0);
    expect(mappings[0].answerBlockIds).toEqual(['a1']);
  });

  it('Levenshtein-1 match', () => {
    const questions = [q({ id: 'q1', displayNumber: '11a' }), q({ id: 'q2', displayNumber: '12a' })];
    // "11b" is distance 1 from "11a" but distance 2 from "12a" (?) Actually 11b vs 11a =1, 11b vs 12a=2 => unique
    const blocks = [ab({ id: 'a1', rawLabel: '11b', normalizedKey: '11b' })];
    // With questions 11a and 12a, 11b should map to 11a via distance 1 unique
    const { mappings, unmatched } = runMapping(questions, blocks);
    // distance to 11a =1, to 12a =2 => unique => matched
    expect(unmatched).toHaveLength(0);
    expect(mappings.find((m) => m.questionId === 'q1')!.answerBlockIds).toEqual(['a1']);
  });

  it('ambiguous case lands in unmatched (tie distance)', () => {
    const questions = [q({ id: 'q1', displayNumber: '11a' }), q({ id: 'q2', displayNumber: '11b' })];
    // "11c" distance 1 to both -> tie -> should be unmatched
    const blocks = [ab({ id: 'a1', rawLabel: '11c', normalizedKey: '11c' })];
    const { unmatched } = runMapping(questions, blocks);
    expect(unmatched).toHaveLength(1);
    expect(unmatched[0].answerBlockId).toBe('a1');
  });

  it('out-of-order answer blocks still mapping correctly by label rather than position', () => {
    const questions = [
      q({ id: 'q1', displayNumber: '1' }),
      q({ id: 'q2', displayNumber: '2' }),
      q({ id: 'q3', displayNumber: '3' }),
    ];
    const blocks = [
      ab({ id: 'a3', rawLabel: '3', normalizedKey: '3' }),
      ab({ id: 'a1', rawLabel: '1', normalizedKey: '1' }),
      ab({ id: 'a2', rawLabel: '2', normalizedKey: '2' }),
    ];
    const { mappings } = runMapping(questions, blocks);
    expect(mappings.find((m) => m.questionId === 'q1')!.answerBlockIds).toEqual(['a1']);
    expect(mappings.find((m) => m.questionId === 'q2')!.answerBlockIds).toEqual(['a2']);
    expect(mappings.find((m) => m.questionId === 'q3')!.answerBlockIds).toEqual(['a3']);
  });

  it('multi-page answer blocks grouping into one ordered Mapping.answerBlockIds', () => {
    const questions = [q({ id: 'q1', displayNumber: '1' })];
    const blocks = [
      ab({ id: 'a1', rawLabel: '1', normalizedKey: '1', page: 2, bbox: { x: 0, y: 0.5, width: 1, height: 1 } }),
      ab({ id: 'a2', rawLabel: '1', normalizedKey: '1', page: 1, bbox: { x: 0, y: 0.8, width: 1, height: 1 } }),
      ab({ id: 'a3', rawLabel: '1', normalizedKey: '1', page: 1, bbox: { x: 0, y: 0.2, width: 1, height: 1 } }),
    ];
    const { mappings } = runMapping(questions, blocks);
    // Should be ordered by page then y: a3 (1,0.2), a2 (1,0.8), a1 (2,0.5)
    expect(mappings[0].answerBlockIds).toEqual(['a3', 'a2', 'a1']);
  });

  it('unmatched reason low_confidence when confidence <0.4 and no match', () => {
    const questions = [q({ id: 'q1', displayNumber: '1' })];
    const blocks = [ab({ id: 'a1', rawLabel: '99', normalizedKey: '99', confidence: 0.2 })];
    const { unmatched } = runMapping(questions, blocks);
    expect(unmatched[0].reason).toBe('low_confidence');
  });

  it('no_label_detected when normalizedKey null', () => {
    const questions = [q({ id: 'q1', displayNumber: '1' })];
    const blocks = [ab({ id: 'a1', rawLabel: null, normalizedKey: null })];
    const { unmatched } = runMapping(questions, blocks);
    expect(unmatched[0].reason).toBe('no_label_detected');
  });
});
