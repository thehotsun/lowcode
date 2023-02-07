/* eslint-disable no-unused-vars */
/* eslint-disable no-extra-boolean-cast */
import axios from 'axios';
import router from '@/router';
import { Message, Loading } from 'element-ui';
import { removeToken } from '@/CommonDP/utils';
import { interceptRequest } from '@/CommonDP/utils/common';
const option = {
  fullscreen: true,
  text: '加载中...',
  background: 'rgba(0,0,0,0)'
};
let loadingInstance = Loading.service(option);
loadingInstance.close();
loadingInstance = null;

const service = axios.create({
  // 公共接口--这里注意后面会讲
  baseURL: process.env.VUE_APP_API,
  // 超时时间 单位是ms，这里设置了30分钟的超时时间
  timeout: 30 * 60 * 1000,
  withCredentials: true
});

// 2.请求拦截器
service.interceptors.request.use(
  (config) => {
    return interceptRequest(config, loadingInstance);
  },
  (error) => {
    Promise.reject(error);
  }
);

// 3.响应拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res instanceof Blob) {
      const filename = decodeURI(response.headers['filename']);
      res.toString = () => filename;
    }
    // 后台返回无result,并且值不为5xx 4xx 错误, 一般为下载/缓存功能 直接成功
    const hasResult = Object.hasOwnProperty.call(res, 'result');
    if (!hasResult || res.result === '0') {
      return res;
    } else if (res.result === '2') {
      redirectToLocalLogin();
      return Promise.reject(res);
    } else if (res.result !== "1") {
      // 非默认的返回码，表示上层需要自己处理。因此不再弹出异常
      return Promise.reject(response);
    } else {
      Message.error(res.message || '接口异常');
      return Promise.reject(response);
    }
  },
  (error) => {
    if (error.response) {
      var status = (error.response && error.response.status) || 0;
      const url = error.response?.config?.url;
      if (status === 401) {
        removeToken();
        error.message = error.response.data.message;
        router.replace({ name: 'login' });
      } else if (status === 403) {
        error.message = '拒绝访问';
      }
    } else {
      error.message = '系统异常';
    }

    Message.error(error.message);
    return Promise.reject(error);
  }
);

async function redirectToLocalLogin() {
  router.replace('/login');
  // await loginService.getloginUrL()
}
function checkLoginUrl(url) {
  window.location.href = url;
}
export default service;
