import {test} from 'node:test';import assert from 'node:assert/strict';import {once} from 'node:events';
import {createApp} from '../dist/app.js';
import {Problem} from '../dist/common.js';
test('HTTP domain behavior, boundaries and conflicts',async()=>{

const rooms=new Map(),reservations=new Map();const repository={ready:async()=>{},close:async()=>{},createRoom:async r=>{if(rooms.has(r.id))throw new Problem(409,'duplicate');rooms.set(r.id,r);return r;},get:async id=>{const r=rooms.get(id);if(!r)throw new Problem(404,'missing');return {...r,available:r.capacity-[...reservations.values()].filter(x=>x.room===id&&x.active).reduce((n,x)=>n+x.seats,0)};},reserve:async(room,r)=>{const current=await repository.get(room);if(reservations.has(r.id)||r.seats>current.available)throw new Problem(409,'conflict');const row={...r,room,active:true};reservations.set(r.id,row);return row;},cancel:async id=>{const r=reservations.get(id);if(!r)throw new Problem(404,'missing');if(!r.active)throw new Problem(409,'cancelled');r.active=false;return r;}};

const runtime=createApp({token:'synthetic-unit-token',repository});const server=runtime.app.listen(0,'127.0.0.1');
try{await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}`;
const request=(method,path,body,auth=true)=>fetch(base+path,{method,headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer synthetic-unit-token'}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
assert.equal((await request('GET','/health/live')).status,200);
assert.equal((await request('POST','/rooms',{id:'room',capacity:2},false)).status,401);
assert.equal((await request('POST','/rooms',{id:'room',capacity:2})).status,201);
assert.equal((await request('POST','/rooms/room/reservations',{id:'a',seats:2})).status,201);
assert.equal((await request('POST','/rooms/room/reservations',{id:'b',seats:1})).status,409);
assert.equal((await request('POST','/reservations/a/cancel',{})).status,200);
assert.equal((await (await request('GET','/rooms/room')).json()).available,2);
assert.equal((await request('POST','/reservations/a/cancel',{})).status,409);
}finally{if(server.listening){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}await runtime.close();}
});
