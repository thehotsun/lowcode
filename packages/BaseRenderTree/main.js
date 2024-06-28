import BaseRenderTree from "./index.js";

/* istanbul ignore next */
BaseRenderTree.install = function(Vue) {
  Vue.component(BaseRenderTree.name, BaseRenderTree);
};

export default BaseRenderTree;
