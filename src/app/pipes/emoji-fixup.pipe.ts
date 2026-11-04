import { Pipe, PipeTransform } from '@angular/core';

import emojis from '../../assets/emoji_map.json';

const EMOJIS = new Map(Object.entries(emojis).map(([shortcode, emoji]) => [shortcode.toLowerCase(), emoji]));
const SHORTCODE = /:[a-z0-9\-_]+:/gi;

@Pipe({ name: 'emojiFixup' })
export class EmojiFixupPipe implements PipeTransform {
  transform(value: string): string {
    return value.replace(SHORTCODE, (shortcode) => EMOJIS.get(shortcode.toLowerCase()) ?? shortcode);
  }
}
