import logger from './helpers/applogging';

const log = logger(module);

export function parserPublish(channel, data = {}, routingKey = 'parser_p.to.contentseen_c',
	exchangeName = 'parser.ex.contentseen') {
	return new Promise((resolve, reject) => {
		const senderData = (Object.entries(data).length === 0 &&
                        data.constructor == Object) ?
          JSON.stringify({
			      advice: 'argument defaults sent by whirlpool parser publisher to contentseen consumer'
		      }) : JSON.stringify(data);

		channel.publish(exchangeName, routingKey, Buffer.from(senderData, 'utf-8'),
			{persistent: true},
			(err, ok) => {
				if (err) {
					log.error('parser publish malformed ', err);
					return reject(err);
				}

				log.info('parser publish messaged acknowledged', ok);
				return resolve(true);
			});
	});
}

