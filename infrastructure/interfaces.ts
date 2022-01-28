import * as net from 'net';
import { COMMANDS } from './constants';

export interface IConnection {
  socket: net.Socket;
  nick: string;
  room: string;
}

export interface IPayload {
  cmd: COMMANDS;
  room: string;
  nick: string;
  text?: string;
  targetRoom?: string;
}

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;