export function disposeParams(requestUrl, requestType, requestFixedParams, externalParams = {}) {
  const { params = [], data = [], headers = [] } = requestFixedParams;
  console.log(requestFixedParams, "requestFixedParams");

  let finalUrl = requestUrl;
  if (params?.length) {
    const finalParams = {};
    params.map(item => {
      finalParams[item.name] = transformParamsValue(item.value);
    });
    finalUrl = addQueryString(finalParams, requestUrl);
  }

  let finalData = {
    ...externalParams
  };
  if (data?.length && Array.isArray(data)) {
    data.map(item => {
      finalData[item.name] = transformParamsValue(item.value);
    });
  } else if (data?.length && typeof data === "string") {
    try {
      finalData = JSON.parse(data);
    } catch (error) {
      console.error("请求参数data格式错误！");
    }
  }
  const requestHeaders = {};
  if (headers?.length) {
    headers.map(item => {
      const headerFieldNameRegex = /^[\w-]+$/;
      if (headerFieldNameRegex.test(item.name)) requestHeaders[item.name] = item.value;
    });
  }
  const finalType = typeof requestType === "string" ? requestType : requestType === 0 ? "post" : "get";
  return {
    finalUrl,
    finalData,
    finalType,
    requestHeaders
  };
}

export function transformParamsValue(value) {
  if ([null, undefined, ""].includes(value)) return "";
  if (typeof value === "string") {
    value = value.trim();
    return value.replace(/^\{(\w*)\}$/g, (value, $1) => {
      if ($1) return this[$1];
      else return value;
    });
  } else {
    console.warn("参数值不是字符串！");
    return "";
  }
}

export function addQueryString(param, url) {
  if (!url) return "";
  if (!param || !Object.keys(param).length) return url;
  let _url = url;
  // 有问号提出url并添加至obj，没问号用原url
  if (url.indexOf("?") > -1) {
    param = Object.assign(
      {},
      {
        ...param,
        ...getUrlQuery(url)
      }
    );
    _url = url.split("?")[0];
  }
  let result = "?";
  for (const key in param) {
    if (param[key] !== undefined && param[key] !== null) {
      result += `${key}=${param[key]}&`;
    }
  }
  // 去除最后一个& 并返回
  return `${_url}${result.slice(0, -1)}`;
}

export function getUrlQuery(_url) {
  const url = _url || "";
  const result = {};
  if (url === "") return result;
  const pairs = url.indexOf("?") > -1 ? url.split("?")[1].split("&") : [];
  pairs.map(item => {
    // 只查找到第一个"＝"符号，这样就不会把token中等号也裁剪掉
    const index = item.indexOf("=");
    const name = item.substr(0, index);
    let value = item.substr(index + 1);
    value = decodeURIComponent(value);
    result[name] = value;
  });
  return result;
}

function processValue(value, context = {}, that) {
  // 判断是否是基本数据类型
  if (value === null || (typeof value !== "object" && typeof value !== "function")) {
    // 如果是字符串并且符合{xxx}格式
    if (typeof value === "string" && value.startsWith("${") && value.endsWith("}")) {
      const keyPath = value.slice(2, -1); // 提取 xxx 部分
      return resolveKeyPath(keyPath, context, that); // 递归查找
    }
    return value;
  }

  // 处理对象或数组
  if (Array.isArray(value)) {
    return value.map(item => processValue(item, context, that)); // 递归处理数组元素
  }

  if (typeof value === "object") {
    const result = {};
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        result[key] = processValue(value[key], context, that); // 递归处理对象的每个值
      }
    }
    return result;
  }

  return value;
}

function resolveKeyPath(keyPath, context, that) {
  // 判断 keyPath 是否以 'this' 开头
  if (keyPath.startsWith("this.")) {
    // 去掉 'this.' 部分，直接用 that 进行查找
    const subKeyPath = keyPath.slice(5); // 去掉 "this."
    return resolveKeyPath(subKeyPath, that, that); // 递归调用，并传入 that
  }

  // 如果 keyPath 为 xx.xx.xx 格式，分割为数组
  const keys = keyPath.split(".");

  // 遍历 context 或 that，按路径查找值
  let result = context;
  for (const key of keys) {
    if (result && key in result) {
      result = result[key];
    } else {
      return undefined; // 如果路径中某个键不存在，返回 undefined
    }
  }
  return result;
}

function convertStringToObject(str) {
  try {
    return JSON.parse(str); // 尝试将字符串转为对象
  } catch (error) {
    return str; // 如果无法转为对象，返回原始字符串
  }
}

export function convertDynaticData(input, context = {}, that) {
  // 如果输入是字符串，尝试转换为对象
  if (typeof input === "string") {
    input = convertStringToObject(input);
  }

  // 递归处理对象
  return processValue(input, context, that);
}

export default {
  disposeParams,
  convertDynaticData
};
