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
class SimplyHiredParser {
  static get _domain() {
    return "www.simplyhired.com";
  }

  static get _pSet() {
    let s = [
      ($) => {
        return new Promise((resolve, reject) => {
          let matchTest = [];
          matchTest.push($('#content').hasClass('content'));
          matchTest.push($('#content .container .categories').children().first().hasClass('letter-line'));
          matchTest.push($('#content .container .categories').children().first().children().length === 28);

          matchTest.push($('#content .container').children().last().hasClass('item-list'));
          matchTest.push($('#content .container')
                         .children()
                         .last()
                         .children()
                         .first()
                         .hasClass('simple-item'));

          log.debug('domain %s, mbrowse %s', SimplyHiredParser._domain, matchTest);
          resolve({
            ans: !_.includes(matchTest, false),
            template: 'mbrowse'
          });
        });
      },
      ($) => {
        return new Promise((resolve, reject) => {
          let matchTest = [];
          matchTest.push($('#content .wrap div.TwoPane').hasClass('TwoPane'));
          matchTest.push($('#content .wrap .TwoPane .TwoPane-paneHolder .LeftPane .jobs').hasClass('jobs'));
          matchTest.push($('#content .wrap .TwoPane .TwoPane-paneHolder .LeftPane .LeftPane-bottom')
                         .hasClass('LeftPane-bottom'));
          matchTest.push($('#content .wrap .TwoPane .TwoPane-paneHolder .LeftPane .LeftPane-bottom')
                         .children().first().next().hasClass('Pagination'));

          log.debug('domain %s, mtitle %s', SimplyHiredParser._domain, matchTest);
          resolve({
            ans: !_.includes(matchTest, false),
            template: 'mtitle'
          });
        });
      },
      ($) => {
        return new Promise((resolve, reject) => {
          let matchTest = [];

          matchTest.push($('.hybrid-container .row .col-md-8 .viewjob-paper').hasClass('viewjob-paper'));

          log.debug('domain %s, mjob %s', SimplyHiredParser._domain, matchTest);
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
      'mbrowse': ($) => {
        return new Promise((resolve, reject) => {
          let letterAndJobTitleHrefs = {};

          for (let i=2; i <=4 ; i ++) {
            letterAndJobTitleHrefs[i] = [];
          }

          const letterTitles = $('#content .container .categories').children().first().children();
          letterTitles.splice(0,2);

          letterTitles.each((i, e) => {
            let url_rank = Math.ceil(Math.random() * 3) + 1;
            letterAndJobTitleHrefs[url_rank].push({'url': $(e).attr('href'), 'type': 'nc'});
          });

          let jobtitles = $('#content .container').children().last().children();

          jobtitles.each((i, e) => {
            let url_rank = Math.ceil(Math.random() * 3) + 1;
            letterAndJobTitleHrefs[url_rank].push({
              'url': $(e).children().first().attr('href'),
              'type': 'c'
            });
          });

          resolve(letterAndJobTitleHrefs);
        });
      },
      'mtitle': ($) => {
        return new Promise((resolve, reject) => {
          let jobHrefs = {};

          for (let i=1; i <=4 ; i ++) {
            jobHrefs[i] = [];
          }

          const jobTitles = $('#content .wrap .TwoPane .TwoPane-paneHolder .LeftPane .jobs').children();

          jobTitles.each((i, e) => {
            let url_rank = Math.ceil(Math.random() * 2);
            jobHrefs[url_rank].push({
              'url': $(e).children().first().children().first().children().first().attr('href'),
              'type': 'nc'
            });
          });

          const pagination = $('#content .wrap .TwoPane .TwoPane-paneHolder .LeftPane .LeftPane-bottom')
                .children().first().next().children().first().children();

          pagination.each((i, e) => {
            let url_rank = Math.ceil(Math.random() * 3) + 1;

            if ($(e).children().first().attr('href') !== undefined) {
              jobHrefs[url_rank].push({
                'url': $(e).children().first().attr('href'),
                'type': 'c'
              });
            }
          });

          resolve(jobHrefs);
        });
      },
      'mjob': ($) => {
        return new Promise((resolve, reject) => {
          resolve({});
        });
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
  isMatch() {
    return new Promise((resolve, reject) => {
      let m = false;
      let breakop = {break: null, e: null};

      log.debug('matching %s <-> %s', SimplyHiredParser._domain, this._doc_id);

      async.each(SimplyHiredParser._pSet, (f, cb) => {

        f(this._page).then((result) => {
          if (result.ans) {
            this.pMatch = result.template;
            log.info('domain %s, matched pair skeleton %s, result %s, doc id %s',
                     SimplyHiredParser._domain,
                     result.template,
                     result.ans,
                     this._doc_id);
            breakop.break = result.ans;
            cb(breakop);
          } else {
            log.debug('domain %s, unmatched pair skeleton %s, doc id %s',
                      SimplyHiredParser._domain,
                      result.template,
                      this._doc_id);
            cb();
          }
        });
      }, (err) => {
        if (err && err.break !== null) {
          log.info('domain %s async foreach break', SimplyHiredParser._domain);
          return resolve(err.break);
        } else if (err && err.e !== null) {
          log.error('domain %s, async foreach error %s', SimplyHiredParser._domain, err.e);
          return reject(e);
        } else {
          log.info('domain %s, async foreach complete, no match for doc id %s',
                   SimplyHiredParser._domain,
                   this._doc_id);
          return resolve(false);
        }
      }); //end of async each
    });
  }

  /**
   * returns list of hrefs of page p
   * @returns {list}
   **/
  extractLinks() {
    return new Promise(async (resolve, reject) => {
      log.debug('extracting %s <-> %s', SimplyHiredParser._domain, this._doc_id);
      let xdata = await SimplyHiredParser._xpSet(this.pMatch)(this._page);

      return resolve(xdata);
    });
  }
}

export default SimplyHiredParser;
