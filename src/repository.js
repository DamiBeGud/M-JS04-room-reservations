import { Pool } from 'pg';
import { Problem } from './common.js';
export class PostgresRooms {
  constructor(url) { if(!url) throw new Error('DATABASE_URL_required'); this.pool=new Pool({connectionString:url,max:3,connectionTimeoutMillis:2000}); }
  async ready() { await this.pool.query('SELECT id FROM rooms LIMIT 1'); await this.pool.query('SELECT id FROM reservations LIMIT 1'); }
  async transaction(fn) {
    const client=await this.pool.connect();
    try { await client.query('BEGIN'); const value=await fn(client); await client.query('COMMIT'); return value; }
    catch(e) { await client.query('ROLLBACK'); if(e.code==='23505') throw new Problem(409,'duplicate_id'); throw e; }
    finally { client.release(); }
  }
  createRoom(row) { return this.transaction(async c=>{await c.query('INSERT INTO rooms(id,capacity) VALUES($1,$2)',[row.id,row.capacity]);return row;}); }
  reserve(room,row) { return this.transaction(async c=>{
    const found=await c.query('SELECT capacity FROM rooms WHERE id=$1 FOR UPDATE',[room]);
    if(!found.rowCount) throw new Problem(404,'room_not_found');
    const used=await c.query('SELECT COALESCE(SUM(seats),0)::int AS total FROM reservations WHERE room=$1 AND active',[room]);
    if(used.rows[0].total+row.seats>found.rows[0].capacity) throw new Problem(409,'capacity_exceeded');
    await c.query('INSERT INTO reservations(id,room,seats,active) VALUES($1,$2,$3,true)',[row.id,room,row.seats]);
    return {...row,room,active:true};
  }); }
  cancel(id) { return this.transaction(async c=>{
    const initial=await c.query('SELECT room FROM reservations WHERE id=$1',[id]);
    if(!initial.rowCount) throw new Problem(404,'not_found');
    await c.query('SELECT id FROM rooms WHERE id=$1 FOR UPDATE',[initial.rows[0].room]);
    const r=await c.query('SELECT * FROM reservations WHERE id=$1 FOR UPDATE',[id]);
    if(!r.rows[0].active) throw new Problem(409,'already_cancelled');
    await c.query('UPDATE reservations SET active=false WHERE id=$1',[id]); return {...r.rows[0],active:false};
  }); }
  get(room) { return this.transaction(async c=>{
    const found=await c.query('SELECT capacity FROM rooms WHERE id=$1 FOR UPDATE',[room]);
    if(!found.rowCount) throw new Problem(404,'room_not_found');
    const used=await c.query('SELECT COALESCE(SUM(seats),0)::int AS total FROM reservations WHERE room=$1 AND active',[room]);
    return {id:room,capacity:found.rows[0].capacity,available:found.rows[0].capacity-used.rows[0].total};
  }); }
  close() { return this.pool.end(); }
}
