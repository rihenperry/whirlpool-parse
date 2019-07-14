import logger from './helpers/applogging';


export function parserPublish(channel, data = null, routingKey = 'parser_p.to.contentseen_c',
	exchangeName = 'parser.ex.contentseen') {
	return new Promise((resolve, reject) => {
		const senderData = data === null ? JSON.stringify({
			advice: 'argument defaults sent by whirlpool parser publisher to contentseen consumer'
		}) : JSON.stringify(data);

		channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(senderData), 'utf-8'),
			{persistent: true},
			(err, ok) => {
				if (err) {
					logger.log('error', 'parser publish malformed ', err);
					return reject(err);
				}

				logger.log('info', 'parser publish messaged acknowledged', ok);
				return resolve(true);
			});
	});
}

