import {Model} from '@nozbe/watermelondb';
import {field, text} from '@nozbe/watermelondb/decorators';

export default class AlfredPreference extends Model {
  static table = 'preferences';

  @text('key') key!: string;
  @text('value') value!: string;
  @field('updated_at') updatedAt!: number;
}
