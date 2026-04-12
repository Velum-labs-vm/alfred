import {Model} from '@nozbe/watermelondb';
import {field, text} from '@nozbe/watermelondb/decorators';

export default class AlfredConversation extends Model {
  static table = 'conversations';

  @text('transcript') transcript!: string;
  @text('response') response!: string;
  @text('mode') mode!: string;
  @field('timestamp') timestamp!: number;
}
