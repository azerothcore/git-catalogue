import { EmojiFixupPipe } from './emoji-fixup.pipe';

describe('EmojiFixupPipe', () => {
  const pipe = new EmojiFixupPipe();

  it('should replace every known shortcode', () => {
    expect(pipe.transform(':smile: and :smile:')).toBe('😄 and 😄');
  });

  it('should ignore the case of the shortcode', () => {
    expect(pipe.transform(':SMILE:')).toBe('😄');
  });

  it('should keep unknown shortcodes and plain text', () => {
    expect(pipe.transform('12:30:45 :not-an-emoji:')).toBe('12:30:45 :not-an-emoji:');
  });
});
