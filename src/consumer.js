import util from 'util';
import mongoose from 'mongoose';

import logger from './helpers/applogging';
import {parserPublish as publish} from './publish';
import DocParser from './helpers/parser.js';

const log = logger(module);

export const parserConsume = async function ({rmqConn, consumeChannel, publishChannel}) {
	return new Promise((resolve, reject) => {
		consumeChannel.consume('parser.q', async (msg) => {
			let pgFromQ = JSON.parse(msg.content.toString());
      log.info('domain %s, locating page doc %s', pgFromQ.domain, pgFromQ._id);

      let HTMLMetaDB = mongoose.model('whirlpoolpage');
      let queryHTMLDoc = HTMLMetaDB.findOne({_id: pgFromQ._id});

      queryHTMLDoc.exec(async (err, page) => {
        if (err) {
          return reject(err);
        } else if (page && page.html.length !== 0) {
          log.info('domain %s, parsing doc %s', page.domain, page._id);

          // process the request, contains metadata about file to scrapp {doc_id, msg_id, }
          // makes use of cherrios, puppeteer, and axios/request modules
          const webparser = new DocParser(page.domain, page._id, page.html);
          const hrefs = webparser.parseHTML();
          log.info('%d hrefs extracted', hrefs.length);

          try {
            // publish to next exchange in the chain for further processing
			      // publish, ack method do not return a promise
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
        } else {
          log.warn('page %s not found. dropping...', pgFromQ._id);
          HTMLMetaDB.deleteOne({_id: pgFromQ._id}, function (err) {
            log.error('doc %s unable to delete %s', pgFromQ._id, util.inspect(err));
          }); // end of delete doc
        }//end of if-else
      }); //end of exec func
		});

		// handle connection closed
		rmqConn.on('close', (err) => reject(err));

		// handle errors
		rmqConn.on('error', (err) => reject(err));
	});
};
