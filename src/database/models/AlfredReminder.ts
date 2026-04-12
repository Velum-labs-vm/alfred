import {Model} from '@nozbe/watermelondb';
import {field, text} from '@nozbe/watermelondb/decorators';

export default class AlfredReminder extends Model {
  static table = 'reminders';

  @text('title') title!: string;
  @field('remind_at') remindAt!: number;
  @text('status') status!: string;
  @field('created_at') createdAt!: number;
}
