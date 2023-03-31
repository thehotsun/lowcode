// tableOptions中的item，可以理解为传给el-table-column中的attrs，要注意区分书写格式，例如min-width不要写成驼峰格式

import { align, searchWidget, fixed } from './tableSelectConfigs';
const textarea = (placeholder) => {
  return {
    autosize: true,
    type: 'textarea',
    placeholder: placeholder || '请输入类似function (a, b) { // todo}的结构',
  };
};

const baseAttr = {
  tagName: 'el-input',
  align: 'center',
  'min-width': '80px',
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
  // {
  //   // 如需展示索引，则添加此item
  //   label: '序号',
  //   type: 'index',
  // },
  // {
  //   label: '',
  //   prop: '',
  //   tagName: 'i',
  //   'min-width': '30',
  //   className: 'iconfont icon-drag drag-option',
  // },
  {
    ...baseAttr,
    label: '字段编号',
    prop: 'fieldCode',
    disable: true,
    'min-width': '170',
  },
  {
    ...baseAttr,
    label: '字段名称',
    prop: 'fieldName',
    'min-width': '170',
  },
  {
    ...baseAttr,
    label: '展示',
    prop: 'show',
    'min-width': '70',
    tagName: 'el-switch',
    sortable: true,
  },
  // {
  //   ...baseAttr,
  //   label: '英文名称',
  //   prop: 'englishName',
  //   'min-width': '170',
  // },
  {
    ...baseAttr,
    label: '列宽',
    prop: 'columnWidth',
    'min-width': '170',
    tagName: 'el-input-number',
  },
  {
    ...baseAttr,
    label: '对齐',
    prop: 'align',
    'min-width': '110',
    tagName: 'el-select',
    // 特殊组件的额外属性值例如select组件下的option组件所需的options
    extraOption: {
      options: align,
    },
  },
  {
    ...baseAttr,
    label: '是否固定',
    prop: 'fixed',
    tagName: 'el-select',
    tagAttrs: {
      clearable: true,
    },
    'min-width': '110',
    // 特殊组件的额外属性值例如select组件下的option组件所需的options
    extraOption: {
      options: fixed,
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
    'min-width': '170',
    // 特殊组件的额外属性值例如select组件下的option组件所需的options
    extraOption: {
      options: searchWidget,
    },
  },
  {
    label: '控件属性',
    prop: '',
    'min-width': '110',
    align: 'center',
    slotName: 'setupWidget',
  },
  {
    ...baseAttr,
    label: '排序',
    prop: 'sort',
    'min-width': '70',
    tagName: 'el-switch',
  },

  {
    ...baseAttr,
    label: '排序函数',
    prop: 'sort-method',
    'min-width': '200',
    tagAttrs: textarea(),
  },
  {
    ...baseAttr,
    label: '筛选数组',
    prop: 'filters',
    'min-width': '200',
    tagAttrs: textarea('请输入[{ text, value }]格式"'),
  },
  {
    ...baseAttr,
    label: '筛选函数',
    prop: 'filter-method',
    'min-width': '200',
    tagAttrs: textarea('请输入function(value, row, column){}格式'),
  },
  {
    ...baseAttr,
    label: '是否单行显示',
    prop: 'show-overflow-tooltip',
    'min-width': '100',
    tagName: 'el-switch',
  },
  {
    ...baseAttr,
    label: '格式化',
    prop: 'translate',
    'min-width': '200',
    tagAttrs: textarea('请输入键为原始数据，值为展示数据的obj'),
  },

  // 如需使用slot功能，请添加slotName属性，并在template中使用相同的slot名称
  // {
  //   label: '操作',
  //   'min-width': '110',
  //   prop: '',
  //   align: 'center',
  //   slotName: 'operator',
  // },
];

export function getSingleTableData() {
  return {
    fieldCode: '',
    fieldName: '',
    // englishName: '',
    columnWidth: 70,
    align: 1,
    show: true,
    sort: true,
    translate: '',
    searchWidget: '',
    searchWidgetConfig: {},
  };
}
