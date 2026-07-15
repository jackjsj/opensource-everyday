// React onChange fallback for clearing inputs
// When fill @eN "" doesn't trigger React's synthetic onChange
// Replace {placeholder_text} with the input's placeholder or use a different querySelector
// For textarea: use HTMLTextAreaElement.prototype instead of HTMLInputElement.prototype
const input = document.querySelector('input[placeholder*="{placeholder_text}"]');
const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
nativeInputValueSetter.call(input, '');
input.dispatchEvent(new Event('input', { bubbles: true }));
input.dispatchEvent(new Event('change', { bubbles: true }));
