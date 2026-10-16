import { useEffect } from 'react';

export function useBuilderPromptFormatSettings(settings, promptFormatTouched, setPromptFormat) {
  const savedFormat = settings?.builder_prompt_format;
  useEffect(() => {
    if (!promptFormatTouched.current && ['detailed', 'compact', 'scene', 'ollama'].includes(savedFormat)) {
      setPromptFormat(savedFormat);
      localStorage.setItem('ultra-prompt-format', savedFormat);
    }
  }, [savedFormat, promptFormatTouched, setPromptFormat]);
}
