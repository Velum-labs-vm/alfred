import {Model} from '@nozbe/watermelondb';
import {field, text} from '@nozbe/watermelondb/decorators';

export default class AlfredTask extends Model {
  static table = 'tasks';

  @text('title') title!: string;
  @text('status') status!: string;
  @field('created_at') createdAt!: number;
  @field('due_at') dueAt?: number;
}
