import DiceParser from '../plugins/dice';
import SimplyHiredParser from '../plugins/simplyhired.js';

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

export default injector;
