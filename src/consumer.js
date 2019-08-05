import logger from './helpers/applogging';
import {parserPublish as publish} from './publish';

const log = logger(module);

export const parserConsume = async function ({connection, consumeChannel, publishChannel}) {
	return new Promise((resolve, reject) => {
		consumeChannel.consume('parser.q', async (msg) => {
			const msgBody = msg.content.toString();
			let data = JSON.parse(msgBody);

			log.info('parser consumer received request to process ', data);

			// process the request, contains metadata about file to scrapp {doc_id, msg_id, }
      // makes use of cherrios, puppeteer, and axios/request modules

			// publish to next exchange in the chain for further processing
			// publish, ack method do not return a promise
			try {
        // publish to content seen q. stick to the format below
        data = {
          "url": "http://indeed.com/something",
          "doc_id": "qwerty123",
          "domain": "http://indeed.com",
          "type": "c_or_nc"
        };
				const csAckPublish = await publish(publishChannel, data);
				log.info('parser_p published results of work done by parser_c to contentseen_c',
                   csAckPublish);


        // publish to urlfilter q. stick to the format below
        data = {
          "domain": "http://ex1.com",
          "1": [{"url": "abc?max=", "type": "nc"}, {"type": "c", "url": "/hola"}],
          "2": [{"url": "http://ex4.com/new", "type": "nc"}, {"type": "c", "url": "http://ex10.com"}],
          "3": [{"url": "http://ex3.com/xyz/def", "type": "nc"}, {"type": "c", "url": "http://ex7.com"}]
        };

        const urlfilterAckPublish = await publish(publishChannel, data, 'parser_p.to.urlfilter_c',
                                                  'parser.ex.contentseen');
				log.info('parser_p published results of work done by parser_c to urlfilter_c',
                   urlfilterAckPublish);

        // finally acknowledge and drop the current message from parser q.
				await consumeChannel.ack(msg);
				log.info('consumer msg acknowledged of work done by parser_c');

				resolve('processed single message with durable confirmation');
			}
			catch (e) {
				return reject(e);
			}
		});

		// handle connection closed
		connection.on('close', (err) => reject(err));

		// handle errors
		connection.on('error', (err) => reject(err));
	});
};
