import * as stream from 'stream';
import * as net from 'net';

export class SocketServer {
  private connections: Set<stream.Duplex> = new Set();
  private connectionsWithNames: Set<{
    socket: stream.Duplex;
    nick: string;
    room: string;
  }> = new Set();
  private roomsMessages = new Map<string, string[]>();

  constructor(private port: number) {
    net
      .createServer((socket: net.Socket) => {
        console.log(socket.address());
        console.log('connected');

        this.connections.add(socket);
        this.connectionsWithNames.forEach((socketWithInfo) => {
          socketWithInfo.socket.write(
            Buffer.from(
              `Подключился новый участник чата. Всего в чате ${this.connectionsWithNames.size} \n`
            )
          );
        });

        socket.on('data', (data) => {
          let msg = data.toString();
          console.log(msg);
          const [cmd, nick, room, message] = msg.split(':');

          if (cmd === 'set') {
            if (this.roomsMessages.has(room)) {
              socket.write(
                Buffer.from(this.roomsMessages.get(room)?.join('') || '')
              );
            }
            for (const entry of this.connections.entries()) {
              if (entry[0] === socket) {
                console.log('Found');
                this.connectionsWithNames.add({ socket, nick, room });
                this.connections.delete(socket);
                break;
              }
            }
          }

          if (cmd === 'msg') {
            const roomMessages = this.roomsMessages.get(room);
            if (roomMessages?.length) {
              roomMessages.push(message);
              console.log('Saved message to room');
            } else {
              this.roomsMessages.set(room, [message]);
              console.log('Created array for messages room # ', room);
            }

            this.connectionsWithNames.forEach((socketWithInfo) => {
              if (socketWithInfo.room === room) {
                socketWithInfo.socket.write(Buffer.from(`${nick}: ${message}`));
              }
            });
          }
        });
      })
      .listen(this.port);

    console.log('server start on port: ', this.port);
  }
}

new SocketServer(8080);
