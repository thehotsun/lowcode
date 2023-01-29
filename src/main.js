import Vue from "vue";
import "./styles/reset.css";
import "./styles/elementstyles.css";
import elementUI from "element-ui"; // 推荐使用版本2.13.0*
import "./styles/element-variables.scss";
import App from "./App.vue";;

Vue.use(elementUI);

import less from "less";
Vue.use(less);


// 文件上传
import uploader from "vue-simple-uploader";
Vue.use(uploader);

import formCreate from "@form-create/element-ui";
import FcDesigner from "@form-create/designer";
Vue.use(formCreate);
Vue.use(FcDesigner);

import router from "./router";



new Vue({
  router,
  render: h => h(App)
}).$mount("#app");
