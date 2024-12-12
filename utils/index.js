import {
  getElDatePickerConfig,
  getElDatePickerRangeConfig,
  getElInputConfig,
  getElSelectConfig,
  getElCascaderConfig,
  getElInputNumberConfig
} from "../baseConfig/widgetBaseConfig";

import { searchWidget } from "../baseConfig/tableSelectConfigs";
import { requestTypeList } from "../baseConfig/btnBaseConfig";

import { pickBy, merge, isObject } from "lodash";

export function setPlaceholder(tagName, fieldName) {
  const inputs = ["el-input", "el-input-number"];
  return `请${inputs.includes(tagName) ? "输入" : "选择"}${fieldName}`;
}

export function completeFromItemOptions(data, tableItem) {
  data.formItemAttrs.prop = tableItem.fieldCode;
  data.formField = tableItem.fieldCode;
  data.formItemAttrs.label = tableItem.fieldName;
  if (data.formItemAttrs.labelOptions) data.formItemAttrs.labelOptions.contentText = tableItem.fieldName;
  data.formItemAttrs.style = "margin-right: 15px";
  data.tagAttrs.placeholder = setPlaceholder(data.tagName, tableItem.fieldName);
  // setColSpan(data, 8);
  return data;
}

export function getWidgetOptions(searchWidgetName, item) {
  switch (searchWidgetName) {
    case "el-input":
      return completeFromItemOptions(getElInputConfig(), item);
    case "el-input-number":
      return completeFromItemOptions(getElInputNumberConfig(), item);
    case "el-select":
      return completeFromItemOptions(getElSelectConfig(), item);
    case "el-date-picker":
      return completeFromItemOptions(getElDatePickerConfig(), item);
    case "el-date-picker-range":
      return completeFromItemOptions(getElDatePickerRangeConfig(), item);
    case "el-cascader":
      return completeFromItemOptions(getElCascaderConfig(), item);
    case "dictionary":
      return completeFromItemOptions(getElSelectConfig(), item);
    default:
      console.warn(`您输入的标签 ${searchWidgetName} 暂不支持！`);
      break;
  }
}

export function setColSpan(data, span) {
  if (data.elColAttrs) {
    data.elColAttrs.span = span;
  } else {
    data.elColAttrs = {
      span: span
    };
  }
}

export function getFormItemEmptyConfig() {
  return {
    className: "",
    style: "",
    formItemAttrs: {
      prop: "",
      label: "",
      required: false
    },
    tagName: "",
    behindText: "",
    frontText: "",
    tagAttrs: {
      placeholder: "",
      clearable: true
    },
    sortNumb: 0,
    formField: "",
    // relateOtherField: [],
    renderDependFn: "",
    extraOption: {
      options: [],
      props: {
        key: "id",
        label: "cnName"
      }
    },
    listeners: {}
  };
}

export function str2obj(str) {
  if (str === "") return {};
  try {
    return new Function("return" + str)();
  } catch (error) {
    console.error(error);
  }
  return {};
}

export function getter(obj = {}, field = "") {
  const arr = field.split(".");
  return arr.reduce((prev, item) => {
    return prev[item];
  }, obj);
}

export function setter(obj = {}, field = "", value) {
  const arr = field.split(".");
  const len = arr.length;
  return arr.reduce((prev, item, index) => {
    if (index === len - 1) {
      prev[item] = value;
    }
    return prev[item];
  }, obj);
}

export function getHandleInput(formData, formField, fn) {
  function handleInput(e) {
    try {
      // e可能是原生事件对象
      setter(formData, formField, e?.target?.value ?? e);
      fn && fn(e);
    } catch (error) {
      console.error(error);
    }
  }
  handleInput.isWrap = true;
  return handleInput;
}

export function getHandleBlur(row, fn) {
  return function(e) {
    try {
      // e可能是原生事件对象
      row.$edit = false;
      fn && fn(e);
    } catch (error) {
      console.error(error);
    }
  };
}

export function decorator(customfn, fn) {
  return function(e) {
    try {
      customfn && customfn(e);
      fn && fn(e);
    } catch (error) {
      console.error(error);
    }
  };
}

export function btnClick(extraOption, emit) {
  return function(e) {
    try {
      emit("btnClick", extraOption);
    } catch (error) {
      console.error(error);
    }
  };
}

export function exec(fn) {
  try {
    eval(fn);
  } catch (error) {
    console.error(error);
  }
}

export function str2Fn(strFn) {
  if (strFn === "") return () => {};
  try {
    return new Function(`return ${strFn}`)();
  } catch (error) {
    console.error(`报错的strFn: ${strFn}`, `error: ${error}`);
  }
  return () => {};
}

export function findFromOptionsIndexByfieldName(options = [], fieldName = "") {
  return options.findIndex(item => item.formItem.formField === fieldName);
}

export function filterObj(obj) {
  pickBy(obj);
}

const isObj = val => Object.prototype.toString.call(val) === "[object Object]";

const isArray = source => Array.isArray(source);

const isEmytyRefer = (source, key) => {
  const val = source[key];
  if (isArray(val)) {
    source[key] = val.filter(item => item);
    return !source[key].length;
  } else if (isObj(val)) {
    return !Object.keys(val).length;
  } else {
    return val === "" || val === undefined || val === null;
  }
};

const del = (source, key, val) => {
  if (isEmytyRefer(source, key)) {
    if (isArray(source)) {
      const index = source.indexOf(val);
      source.splice(index, 1, null);
    } else {
      delete source[key];
    }
  }
};

const dfs = (source, key) => {
  const val = source[key];
  if (isObj(val) || isArray(val)) {
    depthFirstSearchWithRecursive(val);
  }
  del(source, key, val);
};

// 用递归实现深度优先遍历
export const depthFirstSearchWithRecursive = source => {
  if (isObj(source)) {
    const keys = Object.keys(source);
    keys.map((key, index) => {
      dfs(source, key);
    });
  } else if (isArray(source)) {
    source.map((item, index) => {
      dfs(source, index);
    });
  }
  return source;
};

export function getWidgetDefaultVal(item, searchWidgetName) {
  switch (searchWidgetName) {
    case "el-select":
    case "dictionary":
      return item.tagAttrs?.multiple ? [] : "";
    case "el-cascader":
      return item.tagAttrs?.props?.multiple ? [] : "";
    case "el-date-picker-range":
      return [];
    default:
      return "";
  }
}

export function getSetupFromSingleConfig(label, placeholder, formField, customAttr = {}, tagName = "el-input") {
  const baseConfig = getFormItemEmptyConfig();
  baseConfig.formField = formField;
  baseConfig.tagName = tagName;
  baseConfig.formItemAttrs.label = label;
  baseConfig.tagAttrs.placeholder = placeholder;
  baseConfig.formItemAttrs["label-width"] = "110px";
  return merge(baseConfig, customAttr);
}

// 获取列表搜索组件弹窗的options
export function getSetupFormOptions(searchWidgetName) {
  let options = [];
  const complexOptions = () => [
    [
      "控件类型：",
      "请选择控件类型",
      "",
      {
        style: "width: 350px",
        slotName: "searchWidget"
      }
    ],
    [
      "标签名：",
      "请输入标签名",
      "formItemAttrs.label",
      {
        style: "width: 350px"
      }
    ],
    [
      "提示语：",
      "请输入提示语",
      "tagAttrs.placeholder",
      {
        style: "width: 350px",
        renderDependFn: function(formData) {
          return !formData.isFlat;
        }
      }
    ],
    [
      "配置项：",
      "请输入配置项",
      "extraOption",
      {
        style: "width: 350px",
        tagAttrs: {
          autosize: true,
          type: "textarea",
          placeholder: '请输入类似{options: [],props: {key: "id",label: "cnName"}}的结构'
        }
      }
    ],
    ["接口获取数据：", null, "request.require", null, "el-switch"],
    [
      "接口地址：",
      null,
      "request.url",
      {
        style: "width: 350px",
        renderDependFn: function(formData) {
          return formData.request.require;
        }
      }
    ],
    [
      "请求方式：",
      null,
      "request.type",
      {
        style: "width: 350px",
        renderDependFn: function(formData) {
          return formData.request.require;
        },
        extraOption: {
          options: requestTypeList
        }
      },
      "el-select"
    ],
    [
      "参数：",
      null,
      "request.params",
      {
        style: "width: 350px",
        renderDependFn: function(formData) {
          return formData.request.require;
        },
        tagAttrs: {
          autosize: true,
          type: "textarea",
          placeholder: "请输入参数"
        }
      }
    ],
    [
      "开启多选：",
      null,
      "tagAttrs.multiple",
      {
        renderDependFn: function(formData) {
          return !formData.isFlat;
        }
      },
      "el-switch"
    ],
    [
      "开启本地筛选：",
      null,
      "tagAttrs.filterable",
      {
        renderDependFn: function(formData) {
          return !formData.isFlat;
        }
      },
      "el-switch"
    ],
    [
      "开启清空：",
      null,
      "tagAttrs.clearable",
      {
        renderDependFn: function(formData) {
          return !formData.isFlat;
        }
      },
      "el-switch"
    ]
  ];
  switch (searchWidgetName) {
    case "el-input":
      options = [
        getSetupFromSingleConfig("控件类型：", "请选择控件类型", "", {
          style: "width: 350px",
          slotName: "searchWidget"
        }),
        getSetupFromSingleConfig("标签名：", "请输入标签名", "formItemAttrs.label", { style: "width: 350px" }),
        getSetupFromSingleConfig("提示语：", "请输入提示语", "tagAttrs.placeholder", { style: "width: 350px" })
        // getSetupFromSingleConfig(
        //   '关联其他字段：',
        //   '',
        //   'relateOtherField',
        //   {
        //     style: 'width: 350px',
        //     extraOption: {
        //       options: [
        //         {
        //           id: '',
        //           cnName: '',
        //         },
        //       ],
        //     },
        //     tagAttrs: {
        //       placeholder: '请选择关联其他字段：',
        //       clearable: true,
        //       multiple: true,
        //     },
        //   },
        //   'el-select'
        // ),
      ];
      break;
    case "el-input-number":
    case "el-date-picker":
    case "el-date-picker-range":
      options = [
        getSetupFromSingleConfig("控件类型：", "请选择控件类型", "", {
          style: "width: 350px",
          slotName: "searchWidget"
        }),
        getSetupFromSingleConfig("标签名：", "请输入标签名", "formItemAttrs.label", { style: "width: 350px" }),
        getSetupFromSingleConfig("提示语：", "请输入提示语", "tagAttrs.placeholder", { style: "width: 350px" })
      ];
      break;
    case "el-select":
      options = complexOptions()
        .toSpliced(1, 0, ["是否平铺：", null, "isFlat", null, "el-switch"])
        .map(item => getSetupFromSingleConfig(...item));
      break;
    case "el-cascader":
      options = complexOptions().map(item => {
        if (item[2] === "tagAttrs.multiple") {
          item[2] = "tagAttrs.props.multiple";
        }
        if (item[2] === "extraOption") {
          item[3].tagAttrs.placeholder = '请输入类似{options: [],props: {key: "id",label: "cnName", children: "children"}}的结构';
        }
        return getSetupFromSingleConfig(...item);
      });
      break;
    case "dictionary":
      options = [
        getSetupFromSingleConfig("控件类型：", "请选择控件类型", "", {
          style: "width: 350px",
          slotName: "searchWidget"
        }),
        getSetupFromSingleConfig("是否平铺：", null, "isFlat", null, "el-switch"),
        getSetupFromSingleConfig("标签名：", "请输入标签名", "formItemAttrs.label", { style: "width: 350px" }),
        getSetupFromSingleConfig("提示语：", "请输入提示语", "tagAttrs.placeholder", {
          style: "width: 350px",
          renderDependFn: function(formData) {
            return !formData.isFlat;
          }
        }),
        getSetupFromSingleConfig("字典项：", "请输入字典项", "", {
          style: "width: 350px",
          slotName: "selectDic"
        }),
        getSetupFromSingleConfig(
          "数据格式：",
          "请输入数据格式",
          "extraOption",
          {
            style: "width: 350px",
            extraOption: {
              options: [
                {
                  id: '{"labelTranslateType":0}',
                  cnName: "仅文本"
                },
                {
                  id: '{"labelTranslateType":1}',
                  cnName: "编号-文本"
                }
              ]
            },
            tagAttrs: {
              placeholder: "",
              clearable: false
            }
          },
          "el-select"
        ),
        getSetupFromSingleConfig(
          "开启多选：",
          null,
          "tagAttrs.multiple",
          {
            renderDependFn: function(formData) {
              return !formData.isFlat;
            }
          },
          "el-switch"
        ),
        getSetupFromSingleConfig(
          "开启本地筛选：",
          null,
          "tagAttrs.filterable",
          {
            renderDependFn: function(formData) {
              return !formData.isFlat;
            }
          },
          "el-switch"
        )
      ];
      break;
    default:
      console.warn(`您输入的标签 ${searchWidgetName} 暂不支持！`);
      break;
  }
  // options.push(
  //   getSetupFromSingleConfig('序号：', '请输入序号', 'sortNumb', {
  //     style: 'width: 350px',
  //   })
  // );
  return options;
}

// 获取列表搜索组件弹窗的form
export function getSetupForm(searchWidgetName) {
  let form;
  switch (searchWidgetName) {
    case "el-input":
      form = {
        // relateOtherField: [],
        formItemAttrs: {
          label: ""
        },
        tagAttrs: {
          placeholder: ""
        },
        sortNumb: 0
      };
      break;
    case "el-input-number":
    case "el-date-picker":
    case "el-date-picker-range":
      form = {
        formItemAttrs: {
          label: ""
        },
        tagAttrs: {
          placeholder: ""
        },
        sortNumb: 0
      };
      break;
    case "el-select":
      form = {
        formItemAttrs: {
          label: ""
        },
        tagAttrs: {
          placeholder: "",
          multiple: true,
          filterable: false,
          clearable: true
        },
        extraOption: "",
        request: {
          require: false,
          url: "",
          type: "get",
          params: "",
          status: "pending"
        },
        isFlat: false,
        sortNumb: 0
      };
      break;
    case "el-cascader":
      form = {
        formItemAttrs: {
          label: ""
        },
        tagAttrs: {
          placeholder: "",
          filterable: false,
          clearable: true,
          props: {
            multiple: true
          }
        },
        extraOption: "",
        request: {
          require: false,
          url: "",
          type: "get",
          params: "",
          status: "pending"
        },
        isFlat: false,
        sortNumb: 0
      };
      break;
    case "dictionary":
      form = {
        formItemAttrs: {
          label: ""
        },
        tagAttrs: {
          placeholder: "",
          filterable: false,
          clearable: true,
          multiple: true
        },
        extraOption: { labelTranslateType: 0 },
        request: {
          require: true,
          url: "",
          type: "get",
          params: "",
          status: "pending"
        },
        sortNumb: 0,
        isFlat: false
      };
      break;
    default:
      console.warn(`您输入的标签 ${searchWidgetName} 暂不支持！`);
      break;
  }

  form.searchWidgetType = searchWidget.find(item => item.tagName === searchWidgetName)?.id;
  return form;
}

export function getSummaries(param) {
  const { columns, data } = param;
  const sums = [];
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = "合计";
      return;
    }
    const values = data.map(item => Number(item[column.property]));
    if (!values.every(value => isNaN(value))) {
      sums[index] = values.reduce((prev, curr) => {
        const value = Number(curr);
        if (!isNaN(value)) {
          return prev + curr;
        } else {
          return prev;
        }
      }, 0);
    } else {
      sums[index] = "";
    }
  });

  return sums;
}

export function setTableAttrs(data) {
  const fnTranslate = ["summaryMethod", "index", "load", "spanMethod", "dataTransitionFn"];
  fnTranslate.map(field => {
    if (data[field]) {
      data[field] = str2Fn(data[field]);
    } else {
      delete data[field];
    }
  });
  const objTranslate = ["treeProps"];
  objTranslate.map(field => {
    if (data[field]) {
      data[field] = str2obj(data[field]);
    } else {
      delete data[field];
    }
  });
  return data;
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

export function BtnConfigs() {
  return {
    relateComponent: null,
    useDialog: true,
    showFooter: false,
    // 导入按钮关联的数据模型
    importFileCompRelateTableName: "",
    formId: "",
    tableId: "",
    dialogTitle: "表单",
    dialogWidth: "",
    dialogHeight: "",
    // 按钮代表的一系列事件完毕以后是否刷新列表
    isRefresh: false,
    requestBeforeConfirmHint: "",
    requestBeforeConfirmText: "",
    requestFixedParams: {},
    requestUrl: "",
    requestType: "",
    deliverySelectList: false,
    btnDisposeParamsRule: {},
    btnType: ""
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
// 格式化高度宽度
export function formatterWidthOrHeightStyle(length, isHeight) {
  if (typeof length === "string") length = length.trim();
  if (/^\d+$/.test(length)) {
    return `${length}px`;
  } else if (/^\d+px?$/.test(length)) {
    return length;
  } else if (/^\d+%?$/.test(length)) {
    if (isHeight) {
      return length.replace("%", "vh");
    } else {
      return length;
    }
  } else {
    console.warn("输入的高度或者宽度格式不正确！");
    return "";
  }
}
// 预览的时候用，创建一个全为空字符串的对象
export function setEmptyTableData(emptyData = {}, fieldCode) {
  emptyData[fieldCode] = "";
}

function convertCamelToSnake(camelCase) {
  return camelCase.replace(/([A-Z])/g, match => `-${match.toLowerCase()}`);
}

export function mergeStyle(style = "", styleForm) {
  if (typeof style !== "string") {
    style = "";
  }
  const camel = ["fontSize", "color", "cursor"];
  let str = "";
  camel.map(key => {
    str += `;${convertCamelToSnake(key)}:${key === "fontSize" ? styleForm[key] + "px" : styleForm[key]}`;
  });
  const { isBold, isItalic, isStrikethrough, isUnderline } = styleForm;
  if (isBold) {
    str += `;font-weight: 700`;
  }
  if (isItalic) {
    str += `;font-style: italic`;
  }
  if (isStrikethrough && isUnderline) {
    str += `; text-decoration: underline line-through`;
  } else if (isStrikethrough) {
    str += `; text-decoration: line-through`;
  } else if (isUnderline) {
    str += `; text-decoration: underline`;
  }
  return style + str;
}

export function arrayToTree(data, idField = "id", parentField = "pid") {
  // 创建一个哈希表，存储每个节点
  const idMapping = data.reduce((acc, el, i) => {
    acc[el[idField]] = i;
    return acc;
  }, {});

  const root = [];
  data.forEach(el => {
    // 如果是根节点（没有父节点），将其加入根节点数组
    if ([null, 0].includes(el[parentField])) {
      root.push(el);
      return;
    }

    // 使用哈希表获取父节点
    const parentEl = data[idMapping[el[parentField]]];

    // 如果父节点没有子节点数组，则创建一个
    if (!parentEl.children) {
      parentEl.children = [];
    }

    // 将当前节点加入父节点的子节点数组
    parentEl.children.push(el);
  });

  return root;
}

export function findInTree(tree, fieldName, value) {
  let count = 0;
  console.log("findInTree", tree);
  function exec(tree) {
    count++;
    if (count > 200) {
      console.warn("findInTree函数执行次数超过200！请检查数据是否有循环引用");
      return null;
    }
    if (value === undefined) return null;
    for (const node of tree) {
      if (node[fieldName] === value) {
        return node;
      }
      console.log(node, "node");
      if (node.children) {
        const result = exec(node.children);
        if (result) {
          return result;
        }
      }
    }
    return null;
  }
  try {
    return exec(tree);
  } catch (error) {
    console.error(error);
    return null;
  }
}

export function mergeAndClean(a, b) {
  const merged = merge({}, a, b);

  function clean(obj, reference) {
    for (const key in obj) {
      // eslint-disable-next-line no-prototype-builtins
      if (!reference.hasOwnProperty(key)) {
        delete obj[key];
      } else if (isObject(obj[key]) && isObject(reference[key])) {
        clean(obj[key], reference[key]);
      }
    }
  }

  clean(merged, a);
  return merged;
}

export function limitShowWord(text = '', maxlength, showEllipsis = true) {
  try {
    return `${text.slice(0, maxlength)}${showEllipsis && text.length > maxlength ? "..." : ""}`;
  } catch (error) {
    console.error("limitShowWord函数报错！报错信息：", error);
    return text;
  }
}

export default {
  setPlaceholder,
  completeFromItemOptions,
  getWidgetOptions,
  setColSpan,
  getFormItemEmptyConfig,
  str2obj,
  getter,
  setter,
  getHandleInput,
  getHandleBlur,
  exec,
  str2Fn,
  findFromOptionsIndexByfieldName,
  depthFirstSearchWithRecursive,
  getWidgetDefaultVal,
  getSetupForm,
  getSetupFormOptions,
  getSetupFromSingleConfig,
  setTableAttrs,
  getSummaries,
  decorator,
  getUrlQuery,
  addQueryString,
  BtnConfigs,
  transformParamsValue,
  formatterWidthOrHeightStyle,
  setEmptyTableData,
  mergeStyle,
  arrayToTree,
  findInTree,
  mergeAndClean,
  limitShowWord
};
