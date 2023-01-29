import Vue from 'vue';
import VueRouter from 'vue-router';
Vue.use(VueRouter)
export default  new VueRouter({
    mode: 'hash',
    routes:   [
         // 没有权限的页面
         {
           path: '/test',
           component: () =>
             import('@/utils/commonRender/example/tableExample'),
           name: 'test',
         },
         {
           path: '/test1',
           component: () =>
             import('@/utils/commonRender/example/tableExample2'),
           name: 'test1',
         },
         {
           path: '/test2',
           component: () =>
             import('@/utils/commonRender/example/formExample'),
           name: 'test2',
         },
       ]
  })





