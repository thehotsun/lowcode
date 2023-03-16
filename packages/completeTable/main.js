import completeTable from './index.js';

/* istanbul ignore next */
completeTable.install = function(Vue) {
  Vue.component(completeTable.name, completeTable);
};

export default completeTable;
