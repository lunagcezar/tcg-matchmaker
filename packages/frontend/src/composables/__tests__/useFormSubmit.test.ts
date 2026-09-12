import { describe, it, expect, vi } from 'vitest';

import { useFormSubmit } from '../useFormSubmit';

describe('useFormSubmit', () => {
  it('skips submit when validate returns false', async () => {
    const submit = vi.fn();
    const validate = vi.fn().mockResolvedValue(false);
    const { save, saving, error } = useFormSubmit({ validate, submit });

    await save();

    expect(submit).not.toHaveBeenCalled();
    expect(saving.value).toBe(false);
    expect(error.value).toBe('');
  });

  it('calls submit and onSuccess when valid', async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    const { save, saving, error } = useFormSubmit({ submit, onSuccess });

    await save();

    expect(submit).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(saving.value).toBe(false);
    expect(error.value).toBe('');
  });

  it('captures the thrown error message and resets saving', async () => {
    const submit = vi.fn().mockRejectedValue(new Error('Forbidden'));
    const { save, saving, error } = useFormSubmit({ submit });

    await save();

    expect(error.value).toBe('Forbidden');
    expect(saving.value).toBe(false);
  });

  it('falls back to a generic message for non-Error throws', async () => {
    const submit = vi.fn().mockRejectedValue('boom');
    const { save, error } = useFormSubmit({ submit });

    await save();

    expect(error.value).toBe('Something went wrong');
  });

  it('uses a custom errorMessage extractor when provided', async () => {
    const submit = vi.fn().mockRejectedValue(new Error('raw'));
    const { save, error } = useFormSubmit({
      submit,
      errorMessage: (e) => `mapped:${(e as Error).message}`,
    });

    await save();

    expect(error.value).toBe('mapped:raw');
  });

  it('toggles saving during the submit', async () => {
    let resolveSubmit: () => void = () => undefined;
    const submit = vi.fn().mockImplementation(() => new Promise<void>((r) => (resolveSubmit = r)));
    const { save, saving } = useFormSubmit({ submit });

    const pending = save();
    expect(saving.value).toBe(true);
    resolveSubmit();
    await pending;
    expect(saving.value).toBe(false);
  });
});
