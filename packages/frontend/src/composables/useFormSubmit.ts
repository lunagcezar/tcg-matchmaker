import { ref, type Ref } from 'vue';

export interface UseFormSubmitOptions {
  validate?: () => Promise<boolean> | boolean;
  submit: () => Promise<void> | void;
  onSuccess?: () => Promise<void> | void;
  errorMessage?: (e: unknown) => string;
}

export interface FormSubmit {
  saving: Ref<boolean>;
  error: Ref<string>;
  save: () => Promise<void>;
}

export function useFormSubmit(options: UseFormSubmitOptions): FormSubmit {
  const saving = ref(false);
  const error = ref('');

  async function save() {
    if (options.validate) {
      const valid = await options.validate();
      if (!valid) return;
    }
    saving.value = true;
    error.value = '';
    try {
      await options.submit();
      await options.onSuccess?.();
    } catch (e) {
      error.value = options.errorMessage
        ? options.errorMessage(e)
        : e instanceof Error
          ? e.message
          : 'Something went wrong';
    } finally {
      saving.value = false;
    }
  }

  return { saving, error, save };
}
