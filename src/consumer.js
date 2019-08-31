import util from 'util';
import mongoose from 'mongoose';

import logger from './helpers/applogging';
import {parserPublish as publish} from './publish';

const log = logger(module);

export const parserConsume = async function ({rmqConn, consumeChannel, publishChannel}) {
	return new Promise((resolve, reject) => {
		consumeChannel.consume('parser.q', async (msg) => {
			let pgFromQ = JSON.parse(msg.content.toString());
      log.info('domain %s, locating page doc %s', pgFromQ.domain, pgFromQ._id);

      let HTMLMetaDB = mongoose.model('whirlpoolpage');
      let queryHTMLDoc = HTMLMetaDB.findOne({_id: pgFromQ._id});
			// process the request, contains metadata about file to scrapp {doc_id, msg_id, }
      // makes use of cherrios, puppeteer, and axios/request modules

			// publish to next exchange in the chain for further processing
			// publish, ack method do not return a promise
      queryHTMLDoc.exec(async (err, page) => {
        if (err) {
          return reject(err);
        } else {
          log.info('domain %s, parsing doc %s', page.domain, page._id);

          try {
            // publish to content seen q. stick to the format below
            const csAckPublish = await publish(publishChannel,
                                               pgFromQ);
				    log.info('parser_p published results of work done by parser_c to contentseen_c',
                     csAckPublish);


            // publish to urlfilter q. stick to the format below
            const urlfilterAckPublish = await publish(publishChannel,
                                                      pgFromQ,
                                                      'parser_p.to.urlfilter_c',
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
			    } //end of try/catch
        } //end of if-else
      }); //end of exec func
		});

		// handle connection closed
		rmqConn.on('close', (err) => reject(err));

		// handle errors
		rmqConn.on('error', (err) => reject(err));
	});
};
