import setupBtnConfig from './index.vue';

/* istanbul ignore next */
setupBtnConfig.install = function(Vue) {
  Vue.component(setupBtnConfig.name, setupBtnConfig);
};

export default setupBtnConfig;
