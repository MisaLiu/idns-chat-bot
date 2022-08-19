import _Webcosket from 'websocket';
import * as sa from 'superagent';

const WebSocket = _Webcosket.client;

export default class iDNSBot {
	constructor(name, password, group, country, language, userAgent) {
		this.name      = name || 'Bot_' + (Math.floor(Math.random() * 900000) + 100000);
		this.password  = password;
		this.group     = group || 'idns_en';
		this.country   = country || 'US';
		this.language  = language || 'en';
		this.userAgent = userAgent || 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36';

		this._ws                    = new WebSocket();
		this._wsConnect             = null;
		this._wsPingClock           = null;
		this._isInit                = false;
		this._isLogin               = false;
		this._lastMessageId         = -1;
		this._currentOnlineCount    = -1;
		this._lastClearUserInfoTime = Date.now();

		this.isWebsocket = true;
		this.users       = {};
		this.events      = {
			init    : [],
			message : [],
			join    : [],
			leave   : []
		};

		// 告诉用户开始连接到服务器了
		this._printLog({
			created: Date.now(),
			name: 'System',
			text: 'Trying connect to the server...'
		});

		this._ws.on('connect', (connection) => {
			// 输出 connection 对象以方便发送消息
			this._wsConnect = connection;
			this._printLog({
				created: Date.now(),
				name: 'System',
				text: 'Server connected, inititalizing...'
			});

			// 连接成功后发送用户信息
			connection.send(JSON.stringify({
				name: this.name,
				type: 'init',
				group: this.group,
				country: this.language,
				lastMessageId: this._lastMessageId,
				userAgent: this.userAgent
			}));

			// 创建 Ping Clock 保活
			if (this._wsPingClock) clearInterval(this._wsPingClock);
			this._wsPingClock = setInterval(() => {
				connection.send(JSON.stringify({
					type: 'ping',
					group: this.group
				}));
			}, 120000); // 两分钟发一个包

			// 处理接收到的信息
			connection.on('message', (data) => {
				if (this.password && !this._isLogin) {
					this.sendMessage('/login ' + this.name.toLowerCase() + ' ' + this.password);
					this._isLogin = true;
				};
				this._processMessage(JSON.parse(data[data.type + 'Data']));
			});

			// 处理服务器关闭连接事件
			connection.on('close', () => {
				if (this._wsPingClock) clearInterval(this._wsPingClock);
				this._ws.connect('ws://ws.idnsportal.com:444');
				this._printLog({
					created: Date.now(),
					name: 'System',
					text: 'Server close the connection, trying connect again...'
				});
			})

			// 处理错误事件
			connection.on('error', (e) => {
				console.error(e);
			});
		});

		// 连接失败就使用轮询
		this._ws.on('connectFailed', () => {
			if (this._wsPingClock) clearInterval(this._wsPingClock);
			this.isWebsocket = false;
			this._getMsgPull();
			this._printLog({
				created: Date.now(),
				name: 'System',
				text: 'Connect via websocket failed, using pull...'
			});
		});

		// 连接到 Websocket
		this._ws.connect('ws://ws.idnsportal.com:444');
	}

	
	on (eventName, callback) {
		if (!this.events[eventName]) this.events[eventName] = [];
		this.events[eventName].push(callback);
	}

	sendMessage (message) {
		if (this.isWebsocket && this._wsConnect) {
			this._wsConnect.send(JSON.stringify({
				name: this.name,
				type: 'message',
				group: this.group,
				country: this.language,
				lastMessageId: this._lastMessageId,
				text: message,
				date: Date.now(),
				userAgent: this.userAgent
			}))
		} else {
			sa
				.post('http://chat.idnsportal.com/updates')
				.type('json')
				.set('User-Agent', settings.userAgent)
				.timeout(1000)
				.send({
					name: settings.name,
					type: 'init',
					group: settings.group,
					country: settings.language,
					lastMessageId: stat.lastMessageId,
					text: msg,
					date: Date.now(),
					userAgent: settings.userAgent
				})
				.end((err, response) => {
					/**
					if (err) {
						console.error(err);
						return;
					}
					**/
				}
			);
		}
	}

	getUserHash (username) {
		if (!username) return null;

		let result = [];
		for (let id in this.users) {
			if (this.users[id] == username) {
				result.push(id);
			}
		}

		if (result.length > 0 && result.length == 1) return /(.+)\s\(([a-zA-Z0-9]+)\)\s\[[I|V],[P|W]\]/.exec(result[0])[2];
		else if (result.length > 0) return result;
		else return null;
	}

	async _getMsgPull() {
		while (true) {
			try {
				let response = await sa
					.post('http://chat.idnsportal.com/updates')
					.type('json')
					.set('User-Agent', this.userAgent)
					.timeout(30000)
					.accept('json')
					.send({
						name: this.name,
						type: 'init',
						group: this.group,
						country: this.language,
						lastMessageId: this._lastMessageId,
						userAgent: this.userAgent
					}
				);
	
				this._processMessage(response.body);
				this._isInit = true;
				
			} catch (e) {
				if (e.code == 'ETIMEDOUT' || e.code == 'ECONNABORTED' || e.code == 'ECONNRESET') {
					this._printLog({
						created: Date.now(),
						name: 'System',
						text: 'Request time out, creating new request...'
					});
				} else if (e.status == 520) {
					this._printLog({
						created: Date.now(),
						name: 'System',
						text: 'Request empty, creating new request...'
					});
				} else {
					console.error(e);
				}
			}
		}
	}

	_processMessage (msgArray) { // 内置处理消息函数
		if (msgArray instanceof Array) {
			for (let msg of msgArray) this._realProcessMessage(msg);
		} else if (msgArray instanceof Object) {
			this._realProcessMessage(msgArray);
		}
	}
	_realProcessMessage(msg) {
		const userIdPattern = /(.+)\s\(([a-zA-Z0-9]+)\)\s\[[I|V],[P|W]\]/;
		
		if (Date.now() - this._lastClearUserInfoTime >= 1800000) {
			for (let name in this.users) {
				this.users[name] = undefined;
			}
			this._printLog({
				created: Date.now(),
				name: 'System',
				text: 'User cache cleared'
			});
			this._lastClearUserInfoTime = Date.now();
		}

		if (msg.type == 'message') { // 处理消息，初始化时不处理历史消息
			msg.message.text = msg.message.text.replace(/\<br\>/gi, '\n'); // 处理换行
			
			if (userIdPattern.test(msg.message.label)) msg.message.userId = userIdPattern.exec(msg.message.label)[2]; // 如果作为管理员登录，则提取用户 ID
			if (/^\/images\/((?!telegram\.png).)+$/.test(msg.message.avatar)) msg.message.isAdmin = true; // 通过头像判断是否为管理员
			this._lastMessageId = msg.message.messageId; // 这是必须要记的，用于拉取及时消息
			if (msg.message.type != 'sent' && this._isInit) this._eventHandler('message', msg.message); // 不处理机器人自己发送的消息
			if (msg.message.userId) this.users[msg.message.label] = msg.message.name.replace('﻿', ''); // 如果机器人是管理，则将昵称和对应的哈希值存入变量中
			if (this._isInit) this._printLog(msg.message, (msg.message.type == 'sent')); // 输出日志
			
		} else if (msg.type == 'command') { // 处理服务器发送的指令
			if (msg.name == 'initFinished') {
				this._isInit = true;
				this._eventHandler('init');

			} else if (msg.name == 'online') { 
				if (this._currentOnlineCount < 0) { // 如果是初始化机器人，则直接将当前在线人数存入变量中
					this._printLog({
						created: Date.now(),
						name: 'System',
						text: 'Welcome to iDNS chatroom! current users: ' + msg.data
					});
				} else { // 否则监听人数变化，并提交给处理函数
					if (Number(msg.data) > this._currentOnlineCount) {
						this._printLog({
							created: Date.now(),
							name: 'System',
							text: 'Someone joined the chatroom, current users: ' + msg.data
						});
						this._eventHandler('join', Number(msg.data));

					} else if (Number(msg.data) < this._currentOnlineCount) {
						this._printLog({
							created: Date.now(),
							name: 'System',
							text: 'Someone left the chatroom, current users: ' + msg.data
						});
						this._eventHandler('leave', Number(msg.data));
					}
				}
				
				this._currentOnlineCount = Number(msg.data);
			}
		}
	}

	_eventHandler(eventType, data) {
		if (!this.events[eventType]) return;
		for (let callback of this.events[eventType]) {
			if (callback instanceof Function) callback(data);
		}
	}

	_printLog(msg, type = false) {
		let date = new Date(msg.created);
		let output = '[' + (type ? '<-' : '->') + ']';
		output += `[${date.getFullYear()}-${fillZero(date.getMonth() + 1)}-${fillZero(date.getDate())}`;
		output += ` ${fillZero(date.getHours())}:${fillZero(date.getMinutes())}:${fillZero(date.getSeconds())}]`;
		output += (msg.userId ? '[' + msg.userId + ']' : '') + '[' + msg.name + '] ' + msg.text;
		
		console.log(output);
		
		function fillZero(num) {
			if (num < 10) return '0' + num;
			else return num;
		}
	}
};




