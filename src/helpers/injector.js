import DiceParser from '../plugins/dice';
import SimplyHiredParser from '../plugins/simplyhired.js';
import MonsterJobsParser from '../plugins/monster.js';

const injector = {
  deps: {},
  register: function(k, v) {
    this.deps[k] = v;
  },
  resolve: function(k) {
    return this.deps[k];
  }
};

injector.register(DiceParser._domain, DiceParser);
injector.register(SimplyHiredParser._domain, SimplyHiredParser);
injector.register(SimplyHiredParser._domain, SimplyHiredParser);
injector.register(MonsterJobsParser._domain, MonsterJobsParser);
injector.register(MonsterJobsParser._otherdomain, MonsterJobsParser);

export default injector;
