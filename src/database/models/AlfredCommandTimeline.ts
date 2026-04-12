import {Model} from '@nozbe/watermelondb';
import {field, text} from '@nozbe/watermelondb/decorators';

export default class AlfredCommandTimeline extends Model {
  static table = 'command_timeline';

  @text('stage') stage!: string;
  @text('detail') detail!: string;
  @field('success') success!: boolean;
  @field('timestamp') timestamp!: number;
}
