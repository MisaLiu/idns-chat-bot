# idns-chat-bot

This is a bot library for [iDNS Chatroom](https://x.idnsportal.com/menu?page=508).

## Usage

0. You *MUST* have a [Node.js](https://nodejs.org/) environment.
1. Clone this repo. You can just use `git clone https://github.com/MisaLiu/idns-chat-bot`.
2. `cd idns-chat-bot`, then `npm install`.
3. Run `node example.mjs` for a simple example bot.

## Example

```mjs
import iDNSBot from './iDNSBot.class.mjs';

const bot = new iDNSBot(null, null, 'idns_cn');
/**
 * Args: 
 * name: The name of your bot.
 * password: Bot will try to login if it's set.
 * group_id: Witch group bot can get/send messages. Currently you can only set one group for a bot. Default is `idns_en`.
 * country: Country of your bot. Default is `US`.
 * language: Language of your bot. Default is `en`.
 * userAgent: You can customize your bot's user agent if you don't wanna use default user agent.
 * 
 * Once you create a bot, it will try to connect to the server immediately.
 */


// Currently there's only four types of event: init/message/join/leave
// You can add new listener by `bot.on` at any time.
bot.on('message', (msg) => {
	/***
	{
		avatar: '/avatars/ib85bfcbeecc4',
		created: 1650355293202,
		label: '🇨🇳 (asdf123456) [I,P]',
		messageId: '1650355293202457',
		name: 'Misa Liu',
		text: '测试啊啊啊啊',
		type: 'received',
		isAdmin: true, // Bot must log in as mod.
		userId: 'asdf123456' // Bot must log in as mod. Messages from Telegram or other mods won't get this value.
		}
	**/
	
	if (msg.text == '!ping') {
		bot.sendMessage('Ping: ' + (Date.now() - msg.created) + 'ms');
	}
});
```

## APIs

Currently there's only two APIs.

|        Name       |             Description             |
|        ---        |                ---                  |
|      `bot.on`     | Create a listener for bot           |
| `bot.sendMessage` | Send message to gourp which bot are |

About the detail of these two APIs, see [example.mjs](https://github.com/MisaLiu/idns-chat-bot/blob/master/example.mjs).

## Thanks to

* [Websocket](https://www.npmjs.com/package/websocket)
* [SuperAgent](https://www.npmjs.com/package/superagent)

## LICENSE

See [LICENSE](https://github.com/MisaLiu/idns-chat-bot/blob/master/LICENSE).