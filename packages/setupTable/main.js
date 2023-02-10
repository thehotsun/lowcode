import setupTable from './index.vue';

/* istanbul ignore next */
setupTable.install = function(Vue) {
  Vue.component(setupTable.name, setupTable);
};

export default setupTable;
