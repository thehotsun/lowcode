import BaseRenderTable from './index.js';

/* istanbul ignore next */
BaseRenderTable.install = function(Vue) {
  Vue.component(BaseRenderTable.name, BaseRenderTable);
};

export default BaseRenderTable;
