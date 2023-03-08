import {
  getElDatePickerConfig,
  getElDatePickerRangeConfig,
  getElInputConfig,
  getElSelectConfig,
  getElCascaderConfig,
  getElInputNumberConfig,
  getElBtnConfig,
} from '../baseConfig/widgetBaseConfig';

import { pickBy } from 'lodash';

export function setPlaceholder(tagName, fieldName) {
  const inputs = ['el-input', 'el-input-number'];
  return `请${inputs.includes(tagName) ? '输入' : '选择'}${fieldName}`;
}

export function setFilterAndResetBtnConfig(handleFilter, handleReset) {
  const inputs = ['el-input', 'el-input-number'];
  return `请${inputs.includes(tagName) ? '输入' : '选择'}${fieldName}`;
}

// 设置searchFrom和装配fromOptions
export function composeFromOptions(searchFrom, rawSearchFrom) {
  const formOptions = [];
  const source = {};
  tableData.map((item) => {
    const searchWidgetName = searchWidget.find(
      (widgetitem) => widgetitem.id === item.searchWidget
    )?.tagName;
    // 只有搜索控件有值，才会添加到options中
    if (searchWidgetName) {
      setFromField(source, item.fieldCode);
      formOptions.push(getWidgetOptions(searchWidgetName, item));
    }
  });
  rawSearchFrom = _.cloneDeep((searchFrom = source));
  return [
    {
      elRowAttrs: {
        gutter: 10,
      },
      formItem: formOptions,
    },
  ];
}

export function setFromField(source, field) {
  source[field] = '';
}

export function completeFromItemOptions(data, tableItem) {
  data.formItemAttrs.prop = tableItem.fieldCode;
  data.formField = tableItem.fieldCode;
  data.formItemAttrs.label = tableItem.fieldName;
  data.tagAttrs.placeholder = setPlaceholder(data.tagName, tableItem.fieldName);
  // setColSpan(data, 8);
  return data;
}

export function getWidgetOptions(searchWidgetName, item) {
  switch (searchWidgetName) {
    case 'el-input':
      return completeFromItemOptions(getElInputConfig(), item);
    case 'el-input-number':
      return completeFromItemOptions(getElInputNumberConfig(), item);
    case 'el-select':
      return completeFromItemOptions(getElSelectConfig(), item);
    case 'el-date-picker':
      return completeFromItemOptions(getElDatePickerConfig(), item);
    case 'el-date-picker-range':
      return completeFromItemOptions(getElDatePickerRangeConfig(), item);
    case 'el-cascader':
      return completeFromItemOptions(getElCascaderConfig(), item);
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
      span: span,
    };
  }
}

export function getFormItemEmptyConfig() {
  return {
    className: '',
    style: '',
    formItemAttrs: {
      prop: '',
      label: '',
      required: false,
    },
    tagName: '',
    behindText: '',
    frontText: '',
    tagAttrs: {
      placeholder: '',
      clearable: true,
    },
    formField: '',
    extraOption: {
      options: [],
      props: {
        key: 'id',
        label: 'cnName',
      },
    },
    listeners: {},
  };
}

export function str2obj(str) {
  return new Function('return' + str)();
}

export function getter(obj = {}, field = '') {
  const arr = field.split('.');
  return arr.reduce((prev, item) => {
    return prev[item];
  }, obj);
}

export function setter(obj = {}, field = '', value) {
  const arr = field.split('.');
  let len = arr.length;
  return arr.reduce((prev, item, index) => {
    if (index === len - 1) {
      prev[item] = value;
    }
    return prev[item];
  }, obj);
}

export function getHandleInput(formData, formField, fn) {
  return function(e) {
    try {
      // e可能是原生事件对象
      setter(formData, formField, e?.target?.value ?? e);
      fn && fn(e);
    } catch (error) {
      console.error(error);
    }
  };
}

export function btnClick(extraOption, emit) {
  return function(e) {
    try {
      emit('btnClick', extraOption);
    } catch (error) {
      console.error(error);
    }
  };
}

export function exec(fn) {
  eval(fn);
}

export function findFromOptionsIndexByfieldName(options = [], fieldName = '') {
  return options.findIndex((item) => item.formItem.formField === fieldName);
}

export function filterObj(obj) {
  pickBy(obj);
}

// 用递归实现深度优先遍历
export const depthFirstSearchWithRecursive = (source) => {
  // function del(source, key) {
  //   if (Array.isArray(source)) {
  //     source.splice(key, 1);
  //   } else {
  //     delete source[key];
  //   }
  // }
  // 递归方法

  const dfs = (source, key) => {
    const val = source[key];
    if (Object.prototype.toString.call(val) === '[object Object]') {
      // const keys = Object.keys(obj);
      // keys.map((key) => {});
      depthFirstSearchWithRecursive(val);
    } else if (Array.isArray(val)) {
      // if (val.length === 0) del(source, key);
      // else {
      //   source[key] = val.filter((item, index) => dfs(val, index));
      // }
    } else {
      if (val === '' || val === undefined || val === null) delete source[key];
    }
  };
  const keys = Object.keys(source);
  keys.map((key, index) => {
    dfs(source, key);
  });
  // 开始搜索
  // dfs(source);
  return source;
};

export default {
  setPlaceholder,
  setFilterAndResetBtnConfig,
  composeFromOptions,
  setFromField,
  completeFromItemOptions,
  getWidgetOptions,
  setColSpan,
  getFormItemEmptyConfig,
  str2obj,
  getter,
  setter,
  getHandleInput,
  exec,
  findFromOptionsIndexByfieldName,
  depthFirstSearchWithRecursive,
};
