// tableOptions中的item，可以理解为传给el-table-column中的attrs，要注意区分书写格式，例如min-width不要写成驼峰格式

import { align, searchWidget } from '../baseConfig/tableSelectConfigs';

const baseAttr = {
  tagName: 'el-input',
  align: 'center',
  'min-width': '50px',
  tagAttrs: {
    placeholder: '请输入',
    maxlength: '',
  },
  style: {
    width: '100%',
  },
};

export default [
  {
    // 如需多选，则添加此item
    type: 'selection',
  },
  // {
  //   // 如需展示索引，则添加此item
  //   type: 'index',
  // },
  {
    label: '字段编号',
    prop: 'fieldCode',
    ...baseAttr,
  },
  {
    label: '字段名称',
    prop: 'fieldName',
    ...baseAttr,
  },
  {
    label: '英文名称',
    prop: 'englishName',
    ...baseAttr,
  },
  {
    label: '列宽',
    prop: 'columnWidth',
    ...baseAttr,
    'min-width': '50',
    tagName: 'el-input-number',
  },
  {
    label: '对齐',
    prop: 'align',
    ...baseAttr,
    'min-width': '50',
    tagName: 'el-select',
    // 特殊组件的额外属性值例如select组件下的option组件所需的options
    extraOption: {
      options: align,
    },
  },
  {
    label: '展示',
    prop: 'show',
    ...baseAttr,
    'min-width': '50',
    tagName: 'el-checkbox',
    tagAttrs: {},
  },
  {
    label: '排序',
    prop: 'sort',
    ...baseAttr,
    'min-width': '50',
    tagName: 'el-checkbox',
    tagAttrs: {},
  },
  {
    ...baseAttr,
    label: '查询控件',
    prop: 'searchWidget',
    tagName: 'el-select',
    tagAttrs: {
      clearable: true,
    },
    // 特殊组件的额外属性值例如select组件下的option组件所需的options
    extraOption: {
      options: searchWidget,
    },
  },
  // 如需使用slot功能，请添加slotName属性，并在template中使用相同的slot名称
  {
    label: '操作',
    prop: '',
    align: 'center',
    slotName: 'operator',
  },
];
