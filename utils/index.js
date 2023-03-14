import {
  getElDatePickerConfig,
  getElDatePickerRangeConfig,
  getElInputConfig,
  getElSelectConfig,
  getElCascaderConfig,
  getElInputNumberConfig,
  getElBtnConfig,
} from '../baseConfig/widgetBaseConfig';

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

export function execByFn(strFn) {
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
  return merge(baseConfig, customAttr);
}

export function getSetupFormOptions(searchWidgetName) {
  const complexOptions = () => [
    [
      '标签名：',
      '请输入标签名',
      'formItemAttrs.label',
      { style: 'width: 650px' },
    ],
    [
      '提示语：',
      '请输入提示语',
      'tagAttrs.placeholder',
      { style: 'width: 650px' },
    ],
    [
      '配置项',
      '请输入配置项',
      'extraOption',
      {
        style: 'width: 650px',
        tagAttrs: {
          autosize: true,
          type: 'textarea',
          placeholder:
            '请输入类似{options: [],props: {key: "id",label: "cnName"}}的结构',
        },
      },
    ],
    ['接口获取数据', null, 'request.require', null, 'el-switch'],
    [
      '接口地址',
      null,
      'request.url',
      {
        style: 'width: 650px',
        renderDepend: 'request.require',
      },
    ],
    [
      '请求方式',
      null,
      'request.type',
      {
        style: 'width: 650px',
        renderDepend: 'request.require',
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
      '参数',
      null,
      'request.params',
      {
        style: 'width: 650px',
        renderDepend: 'request.require',
        tagAttrs: {
          autosize: true,
          type: 'textarea',
          placeholder: '请输入参数',
        },
      },
    ],
    ['开启多选', null, 'tagAttrs.multiple', null, 'el-switch'],
    ['开启本地筛选', null, 'tagAttrs.filterable', null, 'el-switch'],
    ['开启清空', null, 'tagAttrs.clearable', null, 'el-switch'],
  ];
  switch (searchWidgetName) {
    case 'el-input':
    case 'el-input-number':
    case 'el-date-picker':
    case 'el-date-picker-range':
      return [
        getSetupFromSingleConfig(
          '标签名：',
          '请输入标签名',
          'formItemAttrs.label',
          { style: 'width: 650px' }
        ),
        getSetupFromSingleConfig(
          '提示语：',
          '请输入提示语',
          'tagAttrs.placeholder',
          { style: 'width: 650px' }
        ),
      ];

    case 'el-select':
      return complexOptions().map((item) => getSetupFromSingleConfig(...item));
    case 'el-cascader':
      return complexOptions().map((item) => {
        if (item[2] === 'tagAttrs.multiple') {
          item[2] = 'tagAttrs.props.multiple';
        }
        if (item[2] === 'extraOption') {
          item[3].tagAttrs.placeholder =
            '请输入类似{options: [],props: {key: "id",label: "cnName", children: "children"}}的结构';
        }
        return getSetupFromSingleConfig(...item);
      });
    default:
      console.warn(`您输入的标签 ${searchWidgetName} 暂不支持！`);
      break;
  }
}

export function getSetupForm(searchWidgetName) {
  switch (searchWidgetName) {
    case 'el-input':
    case 'el-input-number':
    case 'el-date-picker':
    case 'el-date-picker-range':
      return {
        formItemAttrs: {
          label: '',
        },
        tagAttrs: {
          placeholder: '',
        },
      };
    case 'el-select':
      return {
        formItemAttrs: {
          label: '',
        },
        tagAttrs: {
          placeholder: '',
          multiple: false,
          filterable: false,
          clearable: false,
        },
        extraOption: '',
        request: {
          require: false,
          url: '',
          type: 'get',
          params: '',
          status: 'pending',
        },
      };
    case 'el-cascader':
      return {
        formItemAttrs: {
          label: '',
        },
        tagAttrs: {
          placeholder: '',
          filterable: false,
          clearable: false,
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
      };
    default:
      console.warn(`您输入的标签 ${searchWidgetName} 暂不支持！`);
      break;
  }
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
  exec,
  execByFn,
  findFromOptionsIndexByfieldName,
  depthFirstSearchWithRecursive,
  getWidgetDefaultVal,
  getSetupForm,
  getSetupFormOptions,
  getSetupFromSingleConfig,
};
