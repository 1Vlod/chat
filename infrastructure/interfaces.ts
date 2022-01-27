import * as stream from 'stream';

export interface IConnection {
  socket: stream.Duplex;
  nick: string;
  room: string;
}