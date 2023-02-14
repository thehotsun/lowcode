import BaseRenderRegular from './index.js';

/* istanbul ignore next */
BaseRenderRegular.install = function(Vue) {
  Vue.component(BaseRenderRegular.name, BaseRenderRegular);
};

export default BaseRenderRegular;
