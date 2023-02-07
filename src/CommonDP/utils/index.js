import { random } from "lodash";
import custom from "@/CommonDP/utils/custom.js";

// 是否忽略菜单权限
const ignorePermissionCheck = false;

export const storage = {
  get(value) {
    if (process.env.VUE_APP_STORAGE == "session") {
      return sessionStorage.getItem(value);
    } else {
      return localStorage.getItem(value);
    }
  },
  set(key, value) {
    if (process.env.VUE_APP_STORAGE == "session") {
      if (key === 'token') console.log(value, '///');
      sessionStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, value);
    }
  },
  remove(value) {
    if (process.env.VUE_APP_STORAGE == "session") {
      sessionStorage.removeItem(value);
    } else {
      localStorage.removeItem(value);
    }
  },
  clear() {
    if (process.env.VUE_APP_STORAGE == "session") {
      sessionStorage.clear();
    } else {
      localStorage.clear();
    }
  }
};

// 后台的接口的 url 地址, 格式为 http://xxx/yyy, 或者 /yyy
export function baseUrl() {
  return process.env.VUE_APP_HOST + process.env.VUE_APP_API;
}

export function getContextPath() {
  const contentPath = custom.checkSource();
  if (!!contentPath && contentPath !== 'QHY' && contentPath !== 'qg') {
    return '/' + contentPath;
  } else {
    return process.env.VUE_APP_API;
  }
}

export function downloadSysReviewPoint() {
  return location.origin + getContextPath() + `/sysReviewPoint/download?token=${getToken()}`;
}

export const STATIC = (process.env.STATIC_CONTEXT_PATH || "") + "/static";

export function baseUrlWeb() {
  let siteHost = "";
  if (process.env.VUE_APP_HOST) {
    siteHost = location.origin;
  } else {
    siteHost = location.origin + process.env.VUE_APP_SIT_CONTEXT;
  }
  if (process.env.VUE_APP_MODE === "hash") {
    siteHost += "/#";
  }
  return siteHost;
}

export function Permi() {
  return ignorePermissionCheck;
}

export function getToken() {
  return storage.get("token");
}

export function setToken(token) {
  return storage.set("token", token);
}
export function removeToken() {
  return storage.set("token", "");
}

export function questionImgUrl(prjId, fileMD5) {
  return (
    location.origin +
    `/bim/doc/v1/wopi/download/drawing?prjId=${prjId}&fileMd5=${fileMD5}&token=${getToken()}`
  );
}

export function getReadImgFile(filePath) {
  return (
    location.origin + `/bim/doc/v1/upload/` + filePath + "?token=" + getToken()
  );
}

export function downsubway() {
  return location.origin + `/bim/doc/v1/subway/download?token=${getToken()}`;
}
// 文件预览
export function scanUrl(fileId, version) {
  return (
    process.env.VUE_APP_API +
    `/wopi/download/file/content?fileId=${fileId}&version=${version}&token=${getToken()}`
  );
}

export function scanModelUrl(filePath) {
  return location.origin + `/bim/doc/v1/view/${filePath}?token=${token()}`;
}

export function prjImgUploadUrl(filePath) {
  return location.origin + `/bim/doc/v1/upload/${filePath}?token=${getToken()}`;
}

export function scanUrlgml(fileId, docVersionId = "") {
  return (
    location.origin +
    `/bim/doc/v1/wopi/download/file/content-gml?fileId=${fileId}&docVersionId=${docVersionId}&token=${getToken()}`
  );
}

export function viewOfficeUrl(fileId) {
  return (
    baseUrl() +
    `/wopi/getWopiClientUri?fileId=${fileId}&isEdit=false&token=${getToken()}`
  );
}

export function randomStr(length) {
  // 获取随机字符串
  var list = Array.from({ length }, () => {
    return String.fromCharCode(
      Math.random() > 0.5 ? random(65, 90) : random(65, 90)
    );
  }).join("");
  return list;
}

export function showPrjName() {
  return new Set(["design"]);
}
// 判断访问来源
export function isMobile() {
  var mobile = navigator.userAgent.match(
    /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
  );
  return mobile != null;
}

// 格式化时间
export function getQueryObject(url) {
  url = url == null ? window.location.href : url;
  const search = url.substring(url.lastIndexOf("?") + 1);
  const obj = {};
  const reg = /([^?&=]+)=([^?&=]*)/g;
  search.replace(reg, (rs, $1, $2) => {
    const name = decodeURIComponent($1);
    let val = decodeURIComponent($2);
    val = String(val);
    obj[name] = val;
    return rs;
  });
  return obj;
}

/**
 * @description 加载一个script,返回一个Promise对象
 * @param {string} src   url
 * @returns {Promise}
 */
export const importScript = async (href = "") => {
  return href
    ? new Promise((resolve, reject) => {
      let el;
      const src = new URL(href, window.location).href;
      // 是否已经加载此js
      const oldScript = document.querySelector(`script[src="${src}"]`);
      if (oldScript) {
        el = oldScript;
      } else {
        el = document.createElement("script");
        el.src = src;
        el.type = "text/javascript";
        document.head.appendChild(el);
      }
      // js加载已完成
      const isloadend = el.dataset.load === "end";
      if (isloadend) {
        resolve();
      } else {
        el.addEventListener("load", () => {
          el.dataset.load = "end";
          resolve();
        });
        el.addEventListener("error", () => {
          document.head.removeChild(el);
          reject();
        });
      }
    })
    : Promise.reject();
};

export function baseApi() {
  return process.env.VUE_APP_API;
}

export function gentlyUrl(versionId, rvtId, prjId) {
  return (
    baseApi() +
    `/halo/api/app-doc-center/v1/upload-zip?versionId=${versionId}&rvtId=${rvtId}&prjId=${prjId}&token=${token}`
  );
}

export const isFirefox = function () {
  return !!window.navigator.userAgent.match(/firefox/i);
};

export const uploadFileFolder = baseApi() + "/doc/chunk";
// 上传附件地址
export function uploadDataUrl() {
  return baseApi() + `/common/upload`;
}
export function questionImgUrl1(fileMD5) {
  return (
    process.env.VUE_APP_API + `/pic/preview/${fileMD5}?token=${getToken()}`
  );
}
export function downloadTemplate() {
  return (
    process.env.VUE_APP_API +
    `/enterprise/invite/downloadTemplate?token=${getToken()}`
  );
}
// 文件预览
export function viewFile(filePath, token) {
  return process.env.VUE_APP_API + `/view/${filePath}?token=${token}`;
}
export function prjplantaskexportexcel(prjId) {
  // 导出
  return (
    process.env.VUE_APP_API +
    `/prj-plan-task/export-excel?prjId=${prjId}&token=${getToken()}`
  );
}
// 获取头像
export function gettouxAvatar(data) {
  return process.env.VUE_APP_API + `/pic/avatar/${data}?token=${getToken()}`;
}
export function templateDownload() {
  return location.origin + getContextPath() + `/prjDrawingSetPlanEdit/template/download?token=${getToken()}`;
}
// 获取流程图
export function getFlowImage(data) {
  return process.env.VUE_APP_API + `${data}?token=${getToken()}`;
}
// 获取表单截图
export function getFormImage(data) {
  return process.env.VUE_APP_API + `${data}?token=${getToken()}`;
}
export function downloadUrlone(fileId) {
  return process.env.VUE_APP_API + `/download/${fileId}?token=${getToken()}`;
}
export function downloadUrltoken(prjId, fileId, version) {
  if (version) {
    return (
      process.env.VUE_APP_API +
    `/doc/download/${prjId}/${fileId}?version=${version}&token=${getToken()}`
    );
  } else {
    return (
      process.env.VUE_APP_API +
    `/doc/download/${prjId}/${fileId}?token=${getToken()}`
    );
  }
}
export function downloadUrltokenOne(fileId) {
  return (
    process.env.VUE_APP_API + `/flow/download/${fileId}?token=${getToken()}`
  );
}
export function shareDownloadUrl(fileId, version, shareToken) {
  return process.env.VUE_APP_API + `/doc/shareNew/file/download?fileId=${fileId}&version=${version}&shareToken=${shareToken}`;
}
// app文件预览
export function scanUrlapp(fileId) {
  return (
    process.env.VUE_APP_API + `/app/download/file/content?fileId=${fileId}`
  );
}
export function getapptoux(data) {
  return process.env.VUE_APP_API + `/app/avatar?userId=${data}`;
}
// 反馈统计附件预览
export function feedBackPreviewAccessory(questionID) {
  return (
    process.env.VUE_APP_API +
    `/feedback/browse?questionID=${questionID}&token=${getToken()}`
  );
}
export function downloadUrl(prjId, fileId) {
  return (
    process.env.VUE_APP_API +
    `/doc/download/${prjId}/${fileId}?token=${getToken()}`
  );
}
// 模型缩略图
export function modelThumbnail(fileId, fileVersion) {
  return (
    process.env.VUE_APP_API +
    `/light/preview/thumbnail?fileId=${fileId}&fileVersion=${fileVersion}&token=${getToken()}`
  );
}

// 预览营业执照
export function scanzhizhao(fileId) {
  return process.env.VUE_APP_API + `/download/${fileId}?token=${getToken()}`;
}

export function downloadUrl2() {
  return (
    process.env.VUE_APP_API + `/chk-point/downloadTemplate?token=${getToken()}`
  );
}

export function downloadFile(fileUrl) {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.style.height = 0;
  iframe.src = fileUrl;
  document.body.appendChild(iframe);
  setTimeout(() => {
    iframe.remove();
  }, 5 * 60 * 1000);
}

export function uniqueSortedArray(array) {
  if (!array || !array.length) {
    return [];
  }
  let head = 0;
  let tail = 0;
  while (head < array.length) {
    while (++head < array.length && array[head] === array[tail]) {
      continue;
    }
    if (head >= array.length) {
      break;
    }
    array[++tail] = array[head];
  }
  return array.slice(0, tail + 1);
}

export function cleanArray(actual) {
  const newArray = [];
  for (let i = 0; i < actual.length; i++) {
    if (actual[i]) {
      newArray.push(actual[i]);
    }
  }
  return newArray;
}

export function toQueryString(json) {
  if (!json) return '';
  return cleanArray(
    Object.keys(json).map(key => {
      if (json[key] === undefined) return '';
      return encodeURIComponent(key) + '=' + encodeURIComponent(json[key]);
    })
  ).join('&');
}

export function param2Obj(url) {
  const search = url.split('?')[1];
  if (!search) {
    return {};
  }
  return JSON.parse(
    '{"' +
    decodeURIComponent(search)
      .replace(/"/g, '\\"')
      .replace(/&/g, '","')
      .replace(/=/g, '":"') +
    '"}'
  );
}

export function addParamToUrl(url, paramName, paramValue) {
  url = url || "";
  if (url.includes("?")) {
    return url + "&" + paramName + "=" + paramValue;
  } else {
    return url + "?" + paramName + "=" + paramValue;
  }
}
