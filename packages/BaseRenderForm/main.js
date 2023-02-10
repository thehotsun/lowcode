import BaseRenderForm from './index.js';

/* istanbul ignore next */
BaseRenderForm.install = function(Vue) {
  Vue.component(BaseRenderForm.name, BaseRenderForm);
};

export default BaseRenderForm;
