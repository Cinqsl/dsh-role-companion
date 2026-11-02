import type {DeliveryRecord,SendAttemptRecord,DeliveryObservation,QQBinding} from '../home/index.ts';
/** A one-use Runtime-issued dispatch capability, carrying only an already durable immutable attempt. */
export interface PreparedDelivery{readonly delivery:DeliveryRecord;readonly attempt:SendAttemptRecord;invoke<T>(effect:()=>Promise<T>):Promise<T>;}
export interface DeliveryPort{canSend(target:QQBinding):boolean;send(prepared:PreparedDelivery):Promise<DeliveryObservation>;onAvailability?(listener:()=>void):()=>void;}
