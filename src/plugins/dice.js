const _ = require('lodash');
const cheerio = require('cheerio');
const async = require('async');

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

  static get _pSet() {
    let s = [
      ($) => {
        return new Promise((resolve, reject) => {
          let matchTest = [];
          matchTest.push($('.container .mT10 .mTB10').hasClass('mTB10'));
          matchTest.push($('.container .mT10 .mTB10').children().length === 26);

          let jobtitles = $('.container .mT10 .mTB10').children();

          matchTest.push(jobtitles.first().hasClass('row'));
          matchTest.push(jobtitles.first().children().first().hasClass('col-md-12'));
          matchTest.push(jobtitles.first().children().first().children().length === 25);
          matchTest.push(jobtitles.last().children().first().hasClass('mbottom10'));

          log.debug('mbrowse %s', matchTest);
          resolve({
            ans: !_.includes(matchTest, false),
            template: 'mbrowse'
          });
        });
      },
      ($) => {
        return new Promise((resolve, reject) => {
          let matchTest = [false];

          log.info('mtitle %s', matchTest);
          resolve({
            ans: !_.includes(matchTest, false),
            template: 'mtitle'
          });
        });
      },
      ($) => {
        return new Promise((resolve, reject) => {
          let matchTest = [false];

          log.info('mjob %s', matchTest);
          resolve({
            ans: !_.includes(matchTest, false),
            template: 'mjob'
          });
        });
      }
    ];

    return s;
  }

  static _xpSet(act) {
    let s = {
      'mbrowse':($) => {
        return new Promise((resolve, reject) => {
          let jobhrefs = [];
          const jobtitles = $('.container .mT10 .mTB10').children();

          jobtitles.splice(0,1);
          jobtitles.each((i, elm) => {
            let mbtm = $(elm).children();

            mbtm.each((j, subelm) => {
              let href = $(subelm).children().first().attr('href');
              jobhrefs.push(href);
            });
          });

          resolve(jobhrefs);
        });
      },
      'mtitle': ($) => {
        return [];
      },
      'mtitle': ($) => {
        return [];
      }
    };

    return s[act];
  }

  constructor(doc_id, page) {
    this._doc_id = doc_id;
    this._page = cheerio.load(page, {
      withDomLvl1: true,
      normalizeWhitespace: true,
      xmlMode: false,
      decodeEntities: true
    });
  }

  /**
   * Given a page p, check for unique points that qualifies p can be scrapped.
   * @returns {boolean}
   **/
  async isMatch() {
    return new Promise((resolve, reject) => {
      let m = false;
      log.debug('matching %s <-> %s', DiceParser._domain, this._doc_id);

      async.each(DiceParser._pSet, (f, cb) => {
        //let result = await f(this._page); //check for match in p set

        f(this._page).then((result) => {
          if (result.ans) {
            this.pMatch = result.template;
            log.info('matched pair skeleton %s, result %s, doc id %s',
                     result.template,
                     result.ans,
                     this._doc_id);
            cb({break: result.ans});
          } else {
            log.debug('unmatched pair skeleton %s, doc id %s', result.template, this._doc_id);
            cb();
          }
        });
      }, (err) => {
        if (err.break) {
          log.info('async foreach break');
          return resolve(err.break);
        } else if (err.e) {
          log.error('async foreach error %s', err.e);
          return reject(e);
        } else {
          log.info('async foreach complete, no match for doc id %s', this.doc_id);
          return resolve(false);
        }
      }); //end of async each
    });
  }

  /**
   * returns list of hrefs of page p
   * @returns {list}
   **/
  async extractLinks() {
    return new Promise(async (resolve, reject) => {
      log.debug('extracting %s <-> %s', DiceParser._domain, this._doc_id);
      let xdata = await DiceParser._xpSet(this.pMatch)(this._page);

      return resolve(xdata);
    });
  }
}

export default DiceParser;
