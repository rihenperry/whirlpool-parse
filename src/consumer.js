import logger from './helpers/applogging';
import {parserPublish as publish} from './publish';


export const parserConsume = async function ({connection, consumeChannel, publishChannel}) {
	return new Promise((resolve, reject) => {
		consumeChannel.consume('parser.q', async (msg) => {
			const msgBody = msg.content.toString();
			let data = JSON.parse(msgBody);

			logger.log('info', 'parser consumer received request to process ', data);

			// process the request, contains metadata about file to scrapp {doc_id, msg_id, }
      // makes use of cherrios, puppeteer, and axios/request modules

			// publish to next exchange in the chain for further processing
			// publish, ack method do not return a promise
			try {
        // publish to content seen q
        data = {
          "message_id": 1,
          "filename": "something.html",
          "document_id": "qwerty123"
        };
				const csAckPublish = await publish(publishChannel, data);
				logger.log('info', 'parser_p published results of work done by parser_c to contentseen_c',
                   csAckPublish);


        // publish to urlfilter q
        data = {
          "extract_url": "/labamba.html"
        };

        const urlfilterAckPublish = await publish(publishChannel, data, 'parser_p.to.urlfilter_c',
                                                  'parser.ex.contentseen');
				logger.log('info', 'parser_p published results of work done by parser_c to urlfilter_c',
                   urlfilterAckPublish);

        // finally acknowledge and drop the current message from parser q.
				await consumeChannel.ack(msg);
				logger.log('info', 'consumer msg acknowledged of work done by parser_c');

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
