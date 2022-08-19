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
		label: '🇨🇳 (asdf12345) [I,P]',
		messageId: '1650355293202457',
		name: 'Misa Liu',
		text: '测试啊啊啊啊',
		type: 'received',
		isAdmin: true, // Bot must log in as mod.
		userId: '3a1437d874' // Bot must log in as mod. Messages from Telegram or other mods won't get this value.
		}
	**/
	
	if (msg.text == '!ping') {
		bot.sendMessage('Ping: ' + (Date.now() - msg.created) + 'ms');
	}
});