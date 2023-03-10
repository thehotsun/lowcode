// tableOptions中的item，可以理解为传给el-table-column中的attrs，要注意区分书写格式，例如min-width不要写成驼峰格式

import { align, searchWidget } from './tableSelectConfigs';

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

export const eidtConf = [
  {
    // 如需多选，则添加此item
    type: 'selection',
  },
  {
    // 如需展示索引，则添加此item
    label: '序号',
    type: 'index',
  },
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
    'min-width': '80',
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
    'min-width': '70',
    tagName: 'el-checkbox',
    sortable: true,
  },
  {
    label: '排序',
    prop: 'sort',
    ...baseAttr,
    'min-width': '50',
    tagName: 'el-checkbox',
  },
  {
    label: '格式化',
    prop: 'translate',
    ...baseAttr,
    'min-width': '120',
    tagAttrs: {
      type: 'areatext',
      placeholder: '请输入键为原始数据，值为展示数据的obj',
    },
  },
  {
    ...baseAttr,
    label: '查询控件',
    prop: 'searchWidget',
    tagName: 'el-select',
    tagAttrs: {
      clearable: true,
    },
    'min-width': '130',
    // 特殊组件的额外属性值例如select组件下的option组件所需的options
    extraOption: {
      options: searchWidget,
    },
  },
  {
    label: '控件属性',
    prop: '',
    'min-width': '70',
    align: 'center',
    slotName: 'setupWidget',
  },
  // 如需使用slot功能，请添加slotName属性，并在template中使用相同的slot名称
  {
    label: '操作',
    'min-width': '70',
    prop: '',
    align: 'center',
    slotName: 'operator',
  },
];

export function getSingleTableData() {
  return {
    fieldCode: '',
    fieldName: '',
    englishName: '',
    columnWidth: '',
    align: 1,
    show: true,
    sort: false,
    translate: '',
    searchWidget: '',
    searchWidgetConfig: {},
  };
}
