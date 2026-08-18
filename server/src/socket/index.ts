import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import type { PlayerTransform } from "@socialverse/shared";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { prisma } from "../database/prisma.js";
import { verifyAccessToken } from "../modules/auth/tokens.js";

interface Presence { userId:string;username:string;buildingId:string;position:PlayerTransform;connections:number;chunk:string }
const presence=new Map<string,Presence>();
const chunkFor=(x:number,z:number)=>`${Math.floor(x/128)}:${Math.floor(z/128)}`;
function validTransform(value:unknown):value is PlayerTransform{if(!value||typeof value!=="object")return false;const v=value as Record<string,unknown>;return[v.x,v.y,v.z,v.rotationY,v.sequence].every((n)=>typeof n==="number"&&Number.isFinite(n))&&typeof v.movement==="string"&&Math.abs(v.x as number)<=10000&&Math.abs(v.z as number)<=10000;}

export function createSocketServer(httpServer:HttpServer){
  const io=new Server(httpServer,{cors:{origin:env.CLIENT_ORIGIN,credentials:true},transports:["websocket","polling"],pingInterval:25_000,pingTimeout:20_000});
  io.use((socket,next)=>{try{const token:unknown=socket.handshake.auth.token;if(typeof token!=="string")throw new Error("missing");socket.data.auth=verifyAccessToken(token);next();}catch{next(new Error("AUTHENTICATION_REQUIRED"));}});
  io.on("connection",async(socket)=>{const auth=socket.data.auth as ReturnType<typeof verifyAccessToken>;let user;
    try{user=await prisma.user.findUnique({where:{id:auth.sub},include:{building:true,privacy:true}});}catch(error){logger.warn({err:error},"Presence lookup failed");socket.disconnect();return;}
    if(!user?.building||user.status!=="ACTIVE"){socket.disconnect();return;}
    const existing=presence.get(user.id);const initial:PlayerTransform=existing?.position??{x:0,y:1,z:14,rotationY:0,movement:"idle",sequence:0};const entry:Presence={userId:user.id,username:user.username,buildingId:user.building.id,position:initial,connections:(existing?.connections??0)+1,chunk:chunkFor(initial.x,initial.z)};presence.set(user.id,entry);socket.join(`user:${user.id}`);socket.join(`chunk:${entry.chunk}`);socket.emit("system:ready",{version:"0.3.0",timestamp:new Date().toISOString()});socket.emit("presence:snapshot",{users:[...presence.values()].filter((item)=>item.userId!==user.id).map(({connections:_connections,...item})=>item)});
    if(entry.connections===1){io.emit("presence:changed",{userId:user.id,username:user.username,online:user.privacy?.showOnlineStatus??false});io.emit("building:presence",{buildingId:user.building.id,illuminated:true});io.to(`chunk:${entry.chunk}`).emit("player:joined",{userId:user.id,username:user.username,...entry.position});}
    let lastMoveAt=0;socket.on("player:move",(transform:unknown)=>{const now=Date.now();if(now-lastMoveAt<50||!validTransform(transform))return;lastMoveAt=now;const current=presence.get(user.id);if(!current||transform.sequence<=current.position.sequence)return;const distance=Math.hypot(transform.x-current.position.x,transform.z-current.position.z);if(distance>12)return;const oldChunk=current.chunk;current.position=transform;current.chunk=chunkFor(transform.x,transform.z);if(current.chunk!==oldChunk){socket.leave(`chunk:${oldChunk}`);socket.join(`chunk:${current.chunk}`);}socket.to(`chunk:${current.chunk}`).emit("player:moved",{userId:user.id,username:user.username,...transform});});
    socket.on("disconnect",async()=>{const current=presence.get(user.id);if(!current)return;current.connections-=1;if(current.connections>0)return;presence.delete(user.id);io.emit("presence:changed",{userId:user.id,online:false,lastSeen:new Date().toISOString()});io.emit("building:presence",{buildingId:user.building!.id,illuminated:false});io.to(`chunk:${current.chunk}`).emit("player:left",{userId:user.id});try{await prisma.user.update({where:{id:user.id},data:{lastActiveAt:new Date()}});}catch(error){logger.warn({err:error,userId:user.id},"Could not persist last seen");}});
  });return io;
}
