import { Loading } from 'element-ui';
import { getToken, randomStr } from '@/CommonDP/utils';

export function isDef(v) {
  return v !== undefined && v !== null;
}

export function isPromise(val) {
  return (
    isDef(val) &&
    typeof val.then === 'function' &&
    typeof val.catch === 'function'
  );
}

// 日期格式化
export function dateFormatter(time, fmt) {
  const $this = new Date(time);
  const o = {
    'M+': $this.getMonth() + 1,
    'd+': $this.getDate(),
    'h+': $this.getHours(),
    'm+': $this.getMinutes(),
    's+': $this.getSeconds(),
    'q+': Math.floor(($this.getMonth() + 3) / 3),
    S: $this.getMilliseconds()
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      ($this.getFullYear() + '').substr(4 - RegExp.$1.length)
    );
  }
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
      );
    }
  }
  return fmt;
}

export function serialize(obj) {
  const ary = [];
  for (var p in obj) {
    if (obj.hasOwnProperty(p) && typeof obj[p] !== 'object') {
      ary.push(p + '=' + obj[p].toString());
    }
  }
  return '&' + ary.join('&');
}

// 请求拦截
export function interceptRequest(config, loadingInstance) {
  if (config.url.indexOf('?') > -1) {
    config.url = config.url + '&_=' + randomStr(4);
  } else {
    config.url = config.url + '?_=' + randomStr(4);
  }
  if (config.method == 'get' && config.data) {
    console.log(config);
    console.log(config.url);
    config.url += serialize(config.data);
    console.log(config.url);
  }
  config.headers['Content-Type'] = config.headers['Content-Type']
    ? config.headers['Content-Type']
    : 'application/json';
  const NewToken = getToken() ? 'Bearer ' + getToken() : '';
  config.headers['Authorization'] = NewToken;
  if (config.title) {
    if (!loadingInstance === null) {
      loadingInstance.close();
    }
    loadingInstance = Loading.service({
      ...config,
      text: config.title
    });
  }
  return config;
}
