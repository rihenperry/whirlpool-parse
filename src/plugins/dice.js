import logger from '../helpers/applogging.js';

const log = logger(module);

/**
 * in DI terminology and static type paradigm, this class is injectable
 * DI basically means -> dont call us, we will call you.
 * @injectable
 **/

class DiceParser {
  static get _domain() {
    return "www.dice.com";
  }

  constructor(doc_id, page) {
    this._doc_id = doc_id;
    this._page = page;
  }

  /**
   * Given a page p, check for unique points that qualifies p can be scrapped.
   * @returns {boolean}
   **/
  isMatch() {
    log.debug('matching %s <-> %s', DiceParser._domain, this._doc_id);
    return true;
  }

  /**
   * returns list of hrefs of page p
   * @returns {list}
   **/
  extractLinks() {
    log.debug('extracting %s <-> %s', DiceParser._domain, this._doc_id);
    return [1,2,3,4];
  }
}

export default DiceParser;
