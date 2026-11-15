import express from 'express';
import { Reservations } from './domain.js';
import { authorized,wrap,errors } from './common.js';
import { PostgresRooms } from './repository.js';

export function createApp(options: any={}) {
 const app=express();app.use(express.json({limit:'16kb'}));
 const repository=options.repository ?? new PostgresRooms(process.env.DATABASE_URL);const service=new Reservations(repository);
 app.get('/health/live',(_req,res)=>res.json({status:'ok'}));
 app.get('/health/ready',wrap(async(_req,res)=>{await repository.ready();res.json({status:'ready'});}));
 app.use((req,_res,next)=>{try{authorized(req.headers.authorization,options.token);next();}catch(e){next(e);}});
app.post('/rooms',wrap(async(req,res)=>res.status(201).json(await service.createRoom(req.body))));
app.get('/rooms/:id',wrap(async(req,res)=>res.json(await service.get(req.params.id))));
app.post('/rooms/:id/reservations',wrap(async(req,res)=>res.status(201).json(await service.reserve(req.params.id,req.body))));
app.post('/reservations/:id/cancel',wrap(async(req,res)=>res.json(await service.cancel(req.params.id))));
 app.use(errors);return {app,close:()=>repository?.close()??Promise.resolve()};
}
