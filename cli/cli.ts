import readline from 'readline';
import net from 'net';
import { stdin as input, stdout as output } from 'process';

import cliHardcode from './cliHardcode.json';

class CliClient {
  private rl;
  private connectionInfo = {
    port: 8080,
    name: 'user1',
    room: 'default',
  };
  private socket?: net.Socket;

  constructor() {
    this.rl = readline.createInterface({ input, output });
    this.rl.write(cliHardcode.welcomeMessage);
    this.rl.question(cliHardcode.PORT, (port) => {
      this.connectionInfo.port ||= +port;

      this.rl.question('Name: ', (name) => {
        if (!name) {
          throw new Error('Name is required');
        }
        this.connectionInfo.name = name;

        this.rl.question('Room: ', (room) => {
          if (!room) {
            throw new Error('Room is required');
          }
          this.connectionInfo.room = room;

          console.log(this.connectionInfo);
          this.init();
        });
      });
    });
  }

  private init() {
    this.socket = new net.Socket();
    this.socket.connect(this.connectionInfo.port);

    this.socket.on('data', function (d) {
      console.log(d.toString());
    });

    this.sendMessage(
      `set:${this.connectionInfo.name}:${this.connectionInfo.room}`
    );

    this.rl.addListener('line', (answer) => {
      const [cmd, message] = answer.split(':');

      if (cmd === 'end') {
        this.socket!.end();
        this.rl.close();
      }

      if (cmd === 'msg') {
        this.sendMessage(
          `${cmd}:${this.connectionInfo.name}:${this.connectionInfo.room}:${message}`
        );
      }
    });
  }

  private sendMessage(msg: string) {
    this.socket!.write(Buffer.from(msg));
  }
}

new CliClient();
