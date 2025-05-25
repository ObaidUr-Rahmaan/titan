import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    const result = cn('base-class', 'additional-class');
    expect(result).toBe('base-class additional-class');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const result = cn('base', isActive && 'active');
    expect(result).toBe('base active');
  });

  it('handles falsy values', () => {
    const result = cn('base', false, null, undefined, 'end');
    expect(result).toBe('base end');
  });

  it('merges tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toBe('py-1 px-4');
  });

  it('handles arrays of classes', () => {
    const result = cn(['base', 'middle'], 'end');
    expect(result).toBe('base middle end');
  });

  it('handles empty inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('handles complex tailwind merging', () => {
    const result = cn(
      'bg-red-500 hover:bg-red-600',
      'bg-blue-500',
      'hover:bg-blue-600'
    );
    expect(result).toBe('bg-blue-500 hover:bg-blue-600');
  });
}); 