import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shouldEscalate, getClosestCandidates, escalateBlock, MIN_TRANSCRIBED_LENGTH } from './llmEscalation';
import type { Question, AnswerBlock } from '@/types/domain';

// Mock groq client boundary
vi.mock('@/lib/groq/client', () => ({
  configuredModel: () => 'qwen/qwen3.6-27b',
  groqChatCompletion: vi.fn(),
}));

import { groqChatCompletion } from '@/lib/groq/client';

function q(id: string, displayNumber: string, text = `Question ${displayNumber}`): Question {
  return { id, displayNumber, text, page: 1, bbox: { x: 0, y: 0, width: 1, height: 1 }, orderIndex: 0 } as Question;
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

describe('llmEscalation', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('shouldEscalate', () => {
    it('escalates when label ambiguous (2 close candidates within threshold)', () => {
      const questions = [q('q1', '11a'), q('q2', '11b'), q('q3', '12a')];
      // rawLabel "11c" distance 1 to both 11a/11b
      const block = ab({ id: 'a1', rawLabel: '11c', normalizedKey: '11c', transcribedText: 'some answer text that is long enough' });
      expect(shouldEscalate(block, '11c', questions)).toBe(true);
    });
    it('does not escalate when label clearly not in paper (distance > threshold)', () => {
      const questions = [q('q1', '1'), q('q2', '2')];
      const block = ab({ id: 'a1', rawLabel: '99', normalizedKey: '99' });
      expect(shouldEscalate(block, '99', questions)).toBe(false);
    });
    it('escalates when no label but non-trivial transcribed content', () => {
      const questions = [q('q1', '1'), q('q2', '2')];
      const block = ab({ id: 'a1', rawLabel: null, normalizedKey: null, transcribedText: 'This is a substantial answer with more than twenty chars.' });
      expect(shouldEscalate(block, null, questions)).toBe(true);
    });
    it('does not escalate when no label and trivial content', () => {
      const questions = [q('q1', '1')];
      const block = ab({ id: 'a1', rawLabel: null, normalizedKey: null, transcribedText: 'hi' });
      expect(shouldEscalate(block, null, questions)).toBe(false);
    });
    it('does not escalate borderline distance 2 single candidate (needs >=2 close)', () => {
      const questions = [q('q1', '11a'), q('q2', '20a')];
      const block2 = ab({ id: 'a2', rawLabel: '12b', normalizedKey: '12b' });
      // 12b vs 11a distance 2 (threshold 1 => not close), vs 20a farther => no 2 close
      expect(shouldEscalate(block2, '12b', questions)).toBe(false);
    });
  });

  describe('getClosestCandidates', () => {
    it('returns up to 3 closest by label distance', () => {
      const questions = [q('q1', '1'), q('q2', '2'), q('q3', '3'), q('q4', '4')];
      const cands = getClosestCandidates('2', questions, 3);
      expect(cands).toHaveLength(3);
      expect(cands[0].question.id).toBe('q2'); // exact match first
    });
    it('for null label returns first N questions', () => {
      const questions = [q('q1', '1'), q('q2', '2'), q('q3', '3')];
      const cands = getClosestCandidates(null, questions, 3);
      expect(cands.map((c) => c.question.id)).toEqual(['q1', 'q2', 'q3']);
    });
  });

  describe('escalateBlock', () => {
    it('returns matchedQuestionId when Groq returns valid id', async () => {
      vi.mocked(groqChatCompletion).mockResolvedValue(JSON.stringify({ matchedQuestionId: 'q2', confidence: 0.9 }));
      const block = ab({ id: 'a1', rawLabel: '11c', normalizedKey: '11c', transcribedText: 'The answer explains photosynthesis' });
      const candidates = [q('q1', '11a', 'Explain photosynthesis'), q('q2', '11b', 'Describe respiration'), q('q3', '12a', 'Other')];
      const result = await escalateBlock(block, candidates);
      expect(result).toBe('q2');
      expect(groqChatCompletion).toHaveBeenCalledOnce();
      const callArg: any = vi.mocked(groqChatCompletion).mock.calls[0][0];
      expect(callArg.systemPrompt).toBeTruthy();
      expect(callArg.userContent[0].text).toContain('photosynthesis');
    });

    it('returns null when Groq says none fit', async () => {
      vi.mocked(groqChatCompletion).mockResolvedValue(JSON.stringify({ matchedQuestionId: null, confidence: 0.9 }));
      const block = ab({ id: 'a1', transcribedText: 'unrelated doodle' });
      const candidates = [q('q1', '1'), q('q2', '2')];
      const result = await escalateBlock(block, candidates);
      expect(result).toBeNull();
    });

    it('returns null on Groq failure (fallthrough to unmatched)', async () => {
      vi.mocked(groqChatCompletion).mockRejectedValue(new Error('network'));
      const block = ab({ id: 'a1', transcribedText: 'some text long enough but groq fails' });
      const candidates = [q('q1', '1')];
      const result = await escalateBlock(block, candidates);
      expect(result).toBeNull();
    });

    it('returns null when confidence <0.5', async () => {
      vi.mocked(groqChatCompletion).mockResolvedValue(JSON.stringify({ matchedQuestionId: 'q1', confidence: 0.3 }));
      const block = ab({ id: 'a1', transcribedText: 'text' });
      const candidates = [q('q1', '1')];
      const result = await escalateBlock(block, candidates);
      expect(result).toBeNull();
    });

    it('returns null when matched id not in candidates', async () => {
      vi.mocked(groqChatCompletion).mockResolvedValue(JSON.stringify({ matchedQuestionId: 'q999', confidence: 0.9 }));
      const block = ab({ id: 'a1', transcribedText: 'text' });
      const candidates = [q('q1', '1')];
      const result = await escalateBlock(block, candidates);
      expect(result).toBeNull();
    });
  });
});
