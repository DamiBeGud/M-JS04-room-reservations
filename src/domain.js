import { identifier, integer } from './common.js';
export class Reservations {
  constructor(repository) { this.repository=repository; }
  createRoom(input) { return this.repository.createRoom({ id:identifier(input?.id), capacity:integer(input?.capacity,1,100) }); }
  reserve(room,input) { return this.repository.reserve(identifier(room), { id:identifier(input?.id), seats:integer(input?.seats,1,100) }); }
  cancel(id) { return this.repository.cancel(identifier(id)); }
  get(room) { return this.repository.get(identifier(room)); }
}
