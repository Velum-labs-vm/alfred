import {AlfredNative} from '../../services/alfred';

export async function readRecentSms(limit = 20, filter?: string) {
  return AlfredNative.readSms(limit, filter);
}

export async function sendSms(number: string, message: string) {
  return AlfredNative.sendSms(number, message);
}
