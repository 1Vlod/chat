import * as http from 'http';
import * as stream from 'stream';
import * as crypto from 'crypto';

export class SocketServer {
  private HANDSHAKE_CONSTANT = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
  constructor(private port: number) {
    http
      .createServer()
      .on('upgrade', (request: http.IncomingMessage, socket: stream.Duplex) => {
        const clientKey = request.headers['sec-websocket-key'];
        const handshakeKey = crypto
          .createHash('sha1')
          .update(clientKey + this.HANDSHAKE_CONSTANT)
          .digest('base64');
        const responseHeaders = [
          'HTTP/1.1 101',
          'upgrade: websocket',
          'connection: upgrade',
          `sec-webSocket-accept: ${handshakeKey}`,
          '\r\n',
        ];
        socket.write(responseHeaders.join('\r\n'));
      })
      .listen(this.port);
    console.log('server start on port: ', this.port);
  }
}

new SocketServer(8080);
