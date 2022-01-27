import readline from 'readline';
import net from 'net';
import { stdin as input, stdout as output } from 'process';

import cliHardcode from './cliHardcode.json';
import { COMMANDS } from '../infrastructure/constants';

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
      `${COMMANDS.INIT}:${this.connectionInfo.room}:${this.connectionInfo.name}`
    );
    setTimeout(() => {
      this.sendMessage(
        `${COMMANDS.HST}:${this.connectionInfo.room}:${this.connectionInfo.name}`
      );
    }, 1000);

    this.rl.addListener('line', (answer) => {
      const elem = answer.split(':');
      switch (elem[0]) {
        case COMMANDS.END: {
          this.socket!.end();
          this.rl.close();
          break;
        }
        case COMMANDS.CHR: {
          this.sendMessage(
            `${COMMANDS.CHR}:${this.connectionInfo.room}:${this.connectionInfo.name}:${elem[1]}`
          );
          this.connectionInfo.room = elem[1];
          break;
        }
        case COMMANDS.LSU: {
          this.sendMessage(
            `${COMMANDS.LSU}:${this.connectionInfo.room}:${this.connectionInfo.name}`
          );
          break;
        }
        default: {
          this.sendMessage(
            `${COMMANDS.MSG}:${this.connectionInfo.room}:${this.connectionInfo.name}:${elem[0]}`
          );
        }
      }
    });
  }

  private sendMessage(msg: string) {
    this.socket!.write(Buffer.from(msg));
  }
}

new CliClient();
