import mongoose from 'mongoose';
import util from 'util';

import logger from '../helpers/applogging.js';
import injector from './injector.js';

const log = logger(module);

class DocParser {

  static get db() {
    return mongoose.model('whirlpoolpage');
  }

  constructor(domain, doc_id, page) {
    /**
     * demand an instance of parser to do actually parsing
     * something like this -> this.parser = new DiceParser(doc_id, page);
     **/
    const ParserType = injector.resolve(domain);
    this.parser = new ParserType(doc_id, page);
    this._domain = ParserType._domain;
  }

  /**
   * if page p found. forward extracted links. forward page p for data extraction. return []
   * else drop html return empty []
   * @returns {list}
   **/
  async parseHTML() {
    try {
      if (await this.parser.isMatch()) {
        log.info('doc %s matched parser %s ', this.parser._doc_id, this._domain);
        return await this.parser.extractLinks();
      } else {
        log.warn('doc %s doest not match parser %s ', this.parser._doc_id, this._domain);
        this.dropHTML();
        return null;
      }
    } catch (e) {
      log.error(e);
    }
  };

  /**
   * @returns {void}
   **/
  dropHTML() {
    let self = this;
    log.warn('dropping doc %s, domain %s', this.parser._doc_id, this._domain);
    DocParser.db.deleteOne({_id: mongoose.Types.ObjectId(self.parser._doc_id)}, function (err) {
      if (err) log.error('doc %s unable to delete %s', self.parser._doc_id, util.inspect(err));
      log.info('doc %s deleted', self.parser._doc_id);
    });
  }
}

export default DocParser;
