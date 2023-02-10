import completeTable from './index.vue';

/* istanbul ignore next */
completeTable.install = function(Vue) {
  Vue.component(completeTable.name, completeTable);
};

export default completeTable;
