# Chat

## Description

You can use `--help` command in sli to get more info or just read it in cli/cliHardcode.json

### Run locally

`npm install`

`npm start` - server
`npm start-cli` - cli

`npm build` - build ts to js code

`npm start:build` and `npm start-cli` - for server and cli respectively

### Docker

`docker build -t test-chat .`

`docker run -it --rm -p 8080:8080 test-chat:latest`
