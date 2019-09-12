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
          let matchTest = [];
          matchTest.push($('#search-results-control').hasClass('row'));
          matchTest.push($('#serp').children().first().attr('type') === 'text/javascript');
          //matchTest.push($('#serp').children().filter($('.complete-serp-result-div')).length === 20);
          matchTest.push($('#resultSec .jobs-page-header .row div.hidden-xs.hidden-sm.col-md-6.col-lg-6.mT10')
                         .children().first().hasClass('pagination'));
          matchTest.push($('#serp').children().filter($('.complete-serp-result-div'))
                         .first().hasClass('complete-serp-result-div'));
          matchTest.push($('#serp').children().filter($('.complete-serp-result-div'))
                         .last().hasClass('complete-serp-result-div'));

          log.info('mtitle %s', matchTest);
          resolve({
            ans: !_.includes(matchTest, false),
            template: 'mtitle'
          });
        });
      },
      ($) => {
        return new Promise((resolve, reject) => {
          let matchTest = [];

          matchTest.push($('#jt').hasClass('jobTitle'));
          matchTest.push($('#jt').next().hasClass('list-inline'));
          matchTest.push($('#jt').next().children().first().children().first().hasClass('dice-btn-link'));
          matchTest.push($('#bd').hasClass('job-details'));
          matchTest.push($('#jobdescSec').hasClass('highlight-black'));

          //content-seen extract need to handle data-cleansing of this page.

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
          let jobhrefs = {};

          for (let i=1; i <= parseInt(process.env.CRAWL_ORDER_MAX_LIM); i ++) {
            jobhrefs[i] = [];
          }
          const jobtitles = $('.container .mT10 .mTB10').children();

          jobtitles.splice(0,1);
          jobtitles.each((i, elm) => {
            let mbtm = $(elm).children();

            mbtm.each((j, subelm) => {
              //randomly assign rank function
              let url_rank = Math.ceil(Math.random() * parseInt(process.env.CRAWL_ORDER_MAX_LIM));
              let href = $(subelm).children().first().attr('href');
              jobhrefs[url_rank].push({'href': href, 'type': 'c'});
            });
          });

          resolve(jobhrefs);
        });
      },
      'mtitle': ($) => {
        return new Promise((resolve, reject) => {
          let jobOpeningHrefs = {};

          for (let i=1; i <= 2; i ++) {
            jobOpeningHrefs[i] = [];
          }

          const jobopenings = $('#serp').children().filter($('.complete-serp-result-div')).length;
          const pagination = $('#resultSec .jobs-page-header .row div.hidden-xs.hidden-sm.col-md-6.col-lg-6.mT10')
                .children().first().children().last().children();

          pagination.each((i, e) => {
            jobOpeningHrefs[2].push({'href': $(e).children().attr('href'), 'type': 'c'});
          });

          for (let i=0; i<jobopenings; i++) {
            let id = '#position'.concat(i);
            let url_rank = Math.ceil(Math.random() * 2);
            let href = $(id).attr('href');
            jobOpeningHrefs[url_rank].push({'href': href, 'type': 'nc'});
          }

          resolve(jobOpeningHrefs);
        });
      },
      'mjob': ($) => {
        return new Promise((resolve, reject) => {
          let comHrefs = {'5': []};

          let obj = {'href': $('#jt').next().children().first().children().first().attr('href'),
                     type: 'nc'};
          comHrefs['5'].push(obj);

          resolve(comHrefs);
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
  async isMatch() {
    return new Promise((resolve, reject) => {
      let m = false;
      let breakop = {break: null, e: null};

      log.debug('matching %s <-> %s', DiceParser._domain, this._doc_id);

      async.each(DiceParser._pSet, (f, cb) => {

        f(this._page).then((result) => {
          if (result.ans) {
            this.pMatch = result.template;
            log.info('domain %s, matched pair skeleton %s, result %s, doc id %s',
                     DiceParser._domain,
                     result.template,
                     result.ans,
                     this._doc_id);
            breakop.break = result.ans;
            cb(breakop);
          } else {
            log.debug('domain %s, unmatched pair skeleton %s, doc id %s',
                      DiceParser._domain,
                      result.template,
                      this._doc_id);
            cb();
          }
        });
      }, (err) => {
        if (err && err.break !== null) {
          log.info('domain %s, async foreach break', DiceParser._domain);
          return resolve(err.break);
        } else if (err && err.e !== null) {
          log.error('domain %s, async foreach error %s',
                    DiceParser._domain,
                    err.e);
          return reject(e);
        } else {
          log.info('domain %s, async foreach complete, no match for doc id %s',
                   DiceParser._domain,
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
  async extractLinks() {
    return new Promise(async (resolve, reject) => {
      log.debug('extracting %s <-> %s', DiceParser._domain, this._doc_id);
      let xdata = await DiceParser._xpSet(this.pMatch)(this._page);

      return resolve(xdata);
    });
  }
}

export default DiceParser;
