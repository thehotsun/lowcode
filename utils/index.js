import {
  getElDatePickerConfig,
  getElDatePickerRangeConfig,
  getElInputConfig,
  getElSelectConfig,
  getElCascaderConfig,
  getElInputNumberConfig,
  getElBtnConfig,
} from '../baseConfig/widgetBaseConfig';

import { searchWidget } from '../baseConfig/tableSelectConfigs';

import { pickBy, merge } from 'lodash';

export function setPlaceholder(tagName, fieldName) {
  const inputs = ['el-input', 'el-input-number'];
  return `请${inputs.includes(tagName) ? '输入' : '选择'}${fieldName}`;
}

export function setFilterAndResetBtnConfig(handleFilter, handleReset) {
  const inputs = ['el-input', 'el-input-number'];
  return `请${inputs.includes(tagName) ? '输入' : '选择'}${fieldName}`;
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
    case 'dictionary':
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
    sortNumb: '0',
    formField: '',
    relateOtherField: [],
    renderDependFn: '',
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
  if (str === '') return {};
  try {
    return new Function('return' + str)();
  } catch (error) {
    console.error(error);
  }
  return {};
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
      emit('btnClick', extraOption);
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
  if (strFn === '') return () => {};
  try {
    return new Function(`return ${strFn}`)();
  } catch (error) {
    console.error(error);
  }
  return () => {};
}

export function findFromOptionsIndexByfieldName(options = [], fieldName = '') {
  return options.findIndex((item) => item.formItem.formField === fieldName);
}

export function filterObj(obj) {
  pickBy(obj);
}

const isObj = (val) =>
  Object.prototype.toString.call(val) === '[object Object]';

const isArray = (source) => Array.isArray(source);

const isEmytyRefer = (source, key) => {
  const val = source[key];
  if (isArray(val)) {
    source[key] = val.filter((item) => item);
    return !source[key].length;
  } else if (isObj(val)) {
    return !Object.keys(val).length;
  } else {
    return val === '' || val === undefined || val === null;
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
export const depthFirstSearchWithRecursive = (source) => {
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
    case 'el-select':
      return item.tagAttrs?.multiple ? [] : '';
    case 'el-cascader':
      return item.tagAttrs?.props?.multiple ? [] : '';
    default:
      return '';
  }
}

export function getSetupFromSingleConfig(
  label,
  placeholder,
  formField,
  customAttr = {},
  tagName = 'el-input'
) {
  const baseConfig = getFormItemEmptyConfig();
  baseConfig.formField = formField;
  baseConfig.tagName = tagName;
  baseConfig.formItemAttrs.label = label;
  baseConfig.tagAttrs.placeholder = placeholder;
  baseConfig.formItemAttrs['label-width'] = '110px';
  return merge(baseConfig, customAttr);
}

export function getSetupFormOptions(searchWidgetName) {
  let options = [];
  const complexOptions = () => [
    [
      '控件类型：',
      '请选择控件类型',
      '',
      {
        style: 'width: 350px',
        slotName: 'searchWidget',
      },
    ],
    [
      '标签名：',
      '请输入标签名',
      'formItemAttrs.label',
      { style: 'width: 350px' },
    ],
    [
      '提示语：',
      '请输入提示语',
      'tagAttrs.placeholder',
      { style: 'width: 350px' },
    ],
    [
      '配置项：',
      '请输入配置项',
      'extraOption',
      {
        style: 'width: 350px',
        tagAttrs: {
          autosize: true,
          type: 'textarea',
          placeholder:
            '请输入类似{options: [],props: {key: "id",label: "cnName"}}的结构',
        },
      },
    ],
    ['接口获取数据：', null, 'request.require', null, 'el-switch'],
    [
      '接口地址：',
      null,
      'request.url',
      {
        style: 'width: 350px',
        renderDependFn: function(formData) {
          return formData.request.require;
        },
      },
    ],
    [
      '请求方式：',
      null,
      'request.type',
      {
        style: 'width: 350px',
        renderDependFn: function(formData) {
          return formData.request.require;
        },
        extraOption: {
          options: [
            {
              id: 'get',
              label: 'get',
            },
            {
              id: 'post',
              label: 'post',
            },
          ],
        },
      },
      'el-select',
    ],
    [
      '参数：',
      null,
      'request.params',
      {
        style: 'width: 350px',
        renderDependFn: function(formData) {
          return formData.request.require;
        },
        tagAttrs: {
          autosize: true,
          type: 'textarea',
          placeholder: '请输入参数',
        },
      },
    ],
    ['开启多选：', null, 'tagAttrs.multiple', null, 'el-switch'],
    ['开启本地筛选：', null, 'tagAttrs.filterable', null, 'el-switch'],
    ['开启清空：', null, 'tagAttrs.clearable', null, 'el-switch'],
  ];
  switch (searchWidgetName) {
    case 'el-input':
      options = [
        getSetupFromSingleConfig('控件类型：', '请选择控件类型', '', {
          style: 'width: 350px',
          slotName: 'searchWidget',
        }),
        getSetupFromSingleConfig(
          '标签名：',
          '请输入标签名',
          'formItemAttrs.label',
          { style: 'width: 350px' }
        ),
        getSetupFromSingleConfig(
          '提示语：',
          '请输入提示语',
          'tagAttrs.placeholder',
          { style: 'width: 350px' }
        ),
        getSetupFromSingleConfig(
          '关联其他字段：',
          '',
          'relateOtherField',
          {
            style: 'width: 350px',
            extraOption: {
              options: [
                {
                  id: '',
                  cnName: '',
                },
              ],
            },
            tagAttrs: {
              placeholder: '请选择关联其他字段：',
              clearable: true,
              multiple: true,
            },
          },
          'el-select'
        ),
      ];
      break;
    case 'el-input-number':
    case 'el-date-picker':
    case 'el-date-picker-range':
      options = [
        getSetupFromSingleConfig('控件类型：', '请选择控件类型', '', {
          style: 'width: 350px',
          slotName: 'searchWidget',
        }),
        getSetupFromSingleConfig(
          '标签名：',
          '请输入标签名',
          'formItemAttrs.label',
          { style: 'width: 350px' }
        ),
        getSetupFromSingleConfig(
          '提示语：',
          '请输入提示语',
          'tagAttrs.placeholder',
          { style: 'width: 350px' }
        ),
      ];
      break;
    case 'el-select':
      options = complexOptions().map((item) =>
        getSetupFromSingleConfig(...item)
      );
      break;
    case 'el-cascader':
      options = complexOptions().map((item) => {
        if (item[2] === 'tagAttrs.multiple') {
          item[2] = 'tagAttrs.props.multiple';
        }
        if (item[2] === 'extraOption') {
          item[3].tagAttrs.placeholder =
            '请输入类似{options: [],props: {key: "id",label: "cnName", children: "children"}}的结构';
        }
        return getSetupFromSingleConfig(...item);
      });
      break;
    case 'dictionary':
      options = [
        getSetupFromSingleConfig('控件类型：', '请选择控件类型', '', {
          style: 'width: 350px',
          slotName: 'searchWidget',
        }),
        getSetupFromSingleConfig(
          '标签名：',
          '请输入标签名',
          'formItemAttrs.label',
          { style: 'width: 350px' }
        ),
        getSetupFromSingleConfig(
          '提示语：',
          '请输入提示语',
          'tagAttrs.placeholder',
          { style: 'width: 350px' }
        ),
        getSetupFromSingleConfig('字典项：', '请输入字典项', '', {
          style: 'width: 350px',
          slotName: 'selectDic',
        }),
        getSetupFromSingleConfig(
          '数据格式：',
          '请输入数据格式',
          'extraOption',
          {
            style: 'width: 350px',
            extraOption: {
              options: [
                {
                  id: '{"labelTranslateType":0}',
                  cnName: '仅文本',
                },
                {
                  id: '{"labelTranslateType":1}',
                  cnName: '编号-文本',
                },
              ],
            },
            tagAttrs: {
              placeholder: '',
              clearable: false,
            },
          },
          'el-select'
        ),
      ];
      break;
    default:
      console.warn(`您输入的标签 ${searchWidgetName} 暂不支持！`);
      break;
  }
  options.push(
    getSetupFromSingleConfig('序号：', '请输入序号', 'sortNumb', {
      style: 'width: 350px',
    })
  );
  return options;
}

export function getSetupForm(searchWidgetName) {
  let form;
  switch (searchWidgetName) {
    case 'el-input':
      form = {
        relateOtherField: [],
        formItemAttrs: {
          label: '',
        },
        tagAttrs: {
          placeholder: '',
        },
        sortNumb: '0',
      };
      break;
    case 'el-input-number':
    case 'el-date-picker':
    case 'el-date-picker-range':
      form = {
        searchWidgetType: 0,
        formItemAttrs: {
          label: '',
        },
        tagAttrs: {
          placeholder: '',
        },
        sortNumb: '0',
      };
      break;
    case 'el-select':
      form = {
        searchWidgetType: 0,
        formItemAttrs: {
          label: '',
        },
        tagAttrs: {
          placeholder: '',
          multiple: false,
          filterable: false,
          clearable: true,
        },
        extraOption: '',
        request: {
          require: false,
          url: '',
          type: 'get',
          params: '',
          status: 'pending',
        },
        sortNumb: '0',
      };
      break;
    case 'el-cascader':
      form = {
        formItemAttrs: {
          label: '',
        },
        tagAttrs: {
          placeholder: '',
          filterable: false,
          clearable: true,
          props: {
            multiple: false,
          },
        },
        extraOption: '',
        request: {
          require: false,
          url: '',
          type: 'get',
          params: '',
          status: 'pending',
        },
        sortNumb: '0',
      };
      break;
    case 'dictionary':
      form = {
        formItemAttrs: {
          label: '',
        },
        tagAttrs: {
          placeholder: '',
          filterable: false,
          clearable: true,
          props: {
            multiple: false,
          },
        },
        extraOption: { labelTranslateType: 0 },
        request: {
          require: true,
          url: '',
          type: 'get',
          params: '',
          status: 'pending',
        },
        sortNumb: '0',
      };
      break;
    default:
      console.warn(`您输入的标签 ${searchWidgetName} 暂不支持！`);
      break;
  }

  form.searchWidgetType = searchWidget.find(
    (item) => item.tagName === searchWidgetName
  )?.id;
  return form;
}

function getSummaries(param) {
  const { columns, data } = param;
  const sums = [];
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计';
      return;
    }
    const values = data.map((item) => Number(item[column.property]));
    if (!values.every((value) => isNaN(value))) {
      sums[index] = values.reduce((prev, curr) => {
        const value = Number(curr);
        if (!isNaN(value)) {
          return prev + curr;
        } else {
          return prev;
        }
      }, 0);
    } else {
      sums[index] = '';
    }
  });

  return sums;
}

export function setTableAttrs(data) {
  const fnTranslate = ['summaryMethod', 'index', 'load', 'spanMethod'];
  fnTranslate.map((field) => {
    if (data[field]) {
      data[field] = str2Fn(data[field]);
    } else {
      delete data[field];
    }
  });
  const objTranslate = ['treeProps'];
  objTranslate.map((field) => {
    if (data[field]) {
      data[field] = str2obj(data[field]);
    } else {
      delete data[field];
    }
  });
  return data;
}

export default {
  setPlaceholder,
  setFilterAndResetBtnConfig,
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
};
