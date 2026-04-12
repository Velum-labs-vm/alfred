import {Model} from '@nozbe/watermelondb';
import {field, text} from '@nozbe/watermelondb/decorators';

export default class AlfredAuditLog extends Model {
  static table = 'audit_log';

  @text('endpoint') endpoint!: string;
  @field('query_length') queryLength!: number;
  @text('context_fields_sent') contextFieldsSent!: string;
  @field('response_length') responseLength!: number;
  @field('timestamp') timestamp!: number;
}
