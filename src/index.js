import baseRenderForm from '../packages/BaseRenderForm/main.js';
import baseRenderTable from '../packages/BaseRenderTable/main.js';
import BaseRenderRegular from '../packages/BaseRenderRegular/main.js';
import completeTable from '../packages/completeTable/main.js';
import setupTable from '../packages/setupTable/main.js';
import setupBtnConfig from '../packages/setupBtnConfig/main.js';

import './iconfont/iconfont.css';

const components = [
  baseRenderForm,
  baseRenderTable,
  BaseRenderRegular,
  completeTable,
  setupTable,
  setupBtnConfig,
];

const install = function(Vue) {
  components.forEach((component) => {
    Vue.component(component.name, component);
  });
};

/* istanbul ignore if */
if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue);
}

export default {
  install,
  baseRenderForm,
  baseRenderTable,
  BaseRenderRegular,
  completeTable,
  setupTable,
  setupBtnConfig,
};
