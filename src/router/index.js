import Vue from 'vue';
import VueRouter from 'vue-router';
Vue.use(VueRouter);
export default new VueRouter({
  mode: 'hash',
  routes: [
    {
      path: '/',
      redirect: 'listEngine',
    },
    {
      path: '/test',
      component: () =>
        import('@/CommonDP/utils/commonRender/example/tableExample'),
      name: 'test',
    },
    {
      path: '/test1',
      component: () =>
        import('@/CommonDP/utils/commonRender/example/tableExample2'),
      name: 'test1',
    },
    {
      path: '/test2',
      component: () =>
        import('@/CommonDP/utils/commonRender/example/formExample'),
      name: 'test2',
    },
    {
      path: '/listEngine',
      component: () => import('@/CommonDP/lowCode/listEngine'),
      name: 'listEngine',
    },
  ],
});
