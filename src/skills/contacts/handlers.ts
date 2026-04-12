import {AlfredNative} from '../../services/alfred';

export async function searchContactsByName(name: string) {
  const rows = await AlfredNative.searchContacts(name);
  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
  }));
}
