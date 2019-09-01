import logger from '../helpers/applogging.js';
import injector from './injector.js';

const log = logger(module);

class DocParser {
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
  parseHTML() {
    if (this.parser.isMatch()) {
      log.info('doc %s matched parser %s ', this.parser._doc_id, this._domain);
      return this.parser.extractLinks();
    } else {
      log.warn('doc %s doest not match parser %s ', this.parser._doc_id, this._domain);
      this.dropHTML();
      return [];
    }
  }

  /**
   * @returns {void}
   **/
  dropHTML() {
    log.warn('dropping doc %s, domain %s', this.parser._doc_id, this._domain);
  }
}

export default DocParser;
