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
class MonsterJobsParser {
  static get _domain() {
    return "www.monster.com";
  }

  static get _otherdomain() {
    return "job-openings.monster.com";
  }

  static get _pSet() {
    let s = [
      ($) => {
        return new Promise((resolve, reject) => {
          let matchTest = [];

          matchTest.push($('#main').hasClass('content'));
          matchTest.push($('.wrap .content .main-content').hasClass('main-content'));
          matchTest.push($('.wrap .content .main-content .browse-jobs-section .row .thumbnail .caption .card-columns')
                         .hasClass('card-columns'));

          log.debug('domain %s, mbrowse1 %s', MonsterJobsParser._domain, matchTest);
          resolve({
            ans: !_.includes(matchTest, false),
            template: 'mbrowse1'
          });
        });
      },
      ($) => {
        return new Promise((resolve, reject) => {
          let matchTest = [];

          matchTest.push($('.jsrMain').hasClass('wrap'));
          matchTest.push($('.jsrMain #jsr').hasClass('content'));
          matchTest.push($('.jsrMain #jsr .main-content .container .section .row').hasClass('row'));
          matchTest.push($('.jsrMain #jsr .main-content .container .section .row .card-columns')
                         .hasClass('browse-all'));

          log.debug('domain %s, mbrowse2 %s', MonsterJobsParser._domain, matchTest);
          resolve({
            ans: !_.includes(matchTest, false),
            template: 'mbrowse2'
          });
        });
      },
      ($) => {
        return new Promise((resolve, reject) => {
          let matchTest = [];

          matchTest.push($('#mainContent').hasClass('page-content'));
          matchTest.push($('#mainContent .row #ResultsContainer #ResultsScrollable')
                         .hasClass('scrollable'));
          matchTest.push($('#mainContent .row #ResultsContainer #ResultsScrollable .mux-search-results #SearchResults').hasClass('mux-card'));

          matchTest.push($('#mainContent .row #ResultsContainer #ResultsScrollable .mux-search-results #SearchResults').children().first().hasClass('card-content'));

          log.debug('domain %s, mtitles %s', MonsterJobsParser._domain, matchTest);

          resolve({
            ans: !_.includes(matchTest, false),
            template: 'mtitles'
          });
        });
      },
      ($) => {
        return new Promise((resolve, reject) => {
          let matchTest = [];

          matchTest.push($('#Content').hasClass('page-content'));
          matchTest.push($('#Content #JobViewHeader').hasClass('mux-card'));
          matchTest.push($('#Content #JobPreview').hasClass('row'));
          matchTest.push($('#Content #JobPreview #JobBody').hasClass('mux-job-details'));

          log.debug('domain %s, mjob %s', MonsterJobsParser._domain, matchTest);

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
      'mbrowse1': ($) => {
        return new Promise((resolve, reject) => {
          let browsehrefs = {};

          for (let i=2; i <=5 ; i++) {
            browsehrefs[i] = [];
          }

          const browse = $('.wrap .content .main-content .browse-jobs-section .row')
                .children()
                .first()
                .children().last().children().last()
                .find($('.thumbnail .caption .card-columns'))
                .children();

          browse.each((i, e) => {
            let url_rank = Math.ceil(Math.random() * 4) + 1;
            browsehrefs[url_rank].push({'url': $(e).children().first().attr('href'), 'type': 'nc'});
          });

          resolve(browsehrefs);
        });
      },
      'mbrowse2': ($) => {
        return new Promise((resolve, reject) => {
          let browseCatsHrefs = {};

          for (let i=2; i <=4; i++) {
            browseCatsHrefs[i] = [];
          }

          const browseCats = $('.jsrMain #jsr .main-content .container .section .row .card-columns')
                .children();

          browseCats.each((i, e) => {
            let url_rank = Math.ceil(Math.random() * 3) + 1;
            browseCatsHrefs[url_rank].push({
              'url': $(e).children().last().attr('href'),
              'type': 'c'
            });

          });

          resolve(browseCatsHrefs);
        });
      },
      'mtitles': ($) => {
        return new Promise((resolve, reject) => {
          let jobTitlesHrefs = {};

          for (let i=1; i<=3; i++) {
            jobTitlesHrefs[i] = [];
          }

          jobTitlesHrefs[3].push({
            'url': $('#mainContent .row #ResultsContainer #ResultsScrollable .mux-search-results')
              .children()
              .last()
              .attr('href'),
            'type': 'c'
          });

          const jobTitles = $('#mainContent .row #ResultsContainer #ResultsScrollable .mux-search-results #SearchResults').children();

          jobTitles.each((i, e) => {
            let url_rank = Math.ceil(Math.random() * 2);
            jobTitlesHrefs[url_rank].push({
              'url': $(e).find($('.flex-row .summary .card-header .title'))
                .children()
                .first()
                .attr('href'),
              'type': 'nc'
            });
          });

          resolve(jobTitlesHrefs);
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

      log.debug('matching %s <-> %s', MonsterJobsParser._domain, this._doc_id);

      async.each(MonsterJobsParser._pSet, (f, cb) => {

        f(this._page).then((result) => {
          if (result.ans) {
            this.pMatch = result.template;
            log.info('domain %s, matched pair skeleton %s, result %s, doc id %s',
                     MonsterJobsParser._domain,
                     result.template,
                     result.ans,
                     this._doc_id);
            breakop.break = result.ans;
            cb(breakop);
          } else {
            log.debug('domain %s, unmatched pair skeleton %s, doc id %s',
                      MonsterJobsParser._domain,
                      result.template,
                      this._doc_id);
            cb();
          }
        });
      }, (err) => {
        if (err && err.break !== null) {
          log.info('domain %s async foreach break', MonsterJobsParser._domain);
          return resolve(err.break);
        } else if (err && err.e !== null) {
          log.error('domain %s, async foreach error %s', MonsterJobsParser._domain, err.e);
          return reject(e);
        } else {
          log.info('domain %s, async foreach complete, no match for doc id %s',
                   MonsterJobsParser._domain,
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
      log.debug('extracting %s <-> %s', MonsterJobsParser._domain, this._doc_id);
      let xdata = await MonsterJobsParser._xpSet(this.pMatch)(this._page);

      return resolve(xdata);
    });
  }
}

export default MonsterJobsParser;
