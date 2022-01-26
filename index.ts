import * as stream from 'stream';
import * as net from 'net';

export class SocketServer {
  private connections: Set<stream.Duplex> = new Set();

  constructor(private port: number) {
    net
      .createServer((socket: net.Socket) => {
        console.log(socket.address());
        console.log('connected');

        this.connections.add(socket);
        this.connections.forEach((socket) => {
          socket.write(
            Buffer.from(
              `Подключился новый участник чата. Всего в чате ${this.connections.size} \n`
            )
          );
        });

        socket.on('data', (data) => {
          const msg = data.toString();
          console.log(msg);

          if (msg) {
            this.connections.forEach((socket) => {
              socket.write(Buffer.from(msg));
            });
          }
        });
      })
      .listen(this.port);

    console.log('server start on port: ', this.port);
  }
}

new SocketServer(8080);
