import mobileTable from './index.js';

/* istanbul ignore next */
mobileTable.install = function(Vue) {
  Vue.component(mobileTable.name, mobileTable);
};

export default mobileTable;
