// tableOptions中的item，可以理解为传给el-table-column中的attrs，要注意区分书写格式，例如min-width不要写成驼峰格式

import { align, searchWidget, fixed } from './tableSelectConfigs';
const getTextareaAttrs = (placeholder) => {
  return {
    autosize: true,
    type: 'textarea',
    placeholder: placeholder || '请输入类似function (a, b) { // todo}的结构',
  };
};

const getInputAttrs = (placeholder) => {
  return {
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

const originEditConf = [
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
    tagName: 'i',
    label: '拖拽排序',
    align: 'center',
    className: 'iconfont icon-drag drag-option my-handle',
    width: '50',
  },
  {
    ...baseAttr,
    label: '字段名称',
    prop: 'fieldCode',
    disabled: true,
    'min-width': '150',
  },
  {
    ...baseAttr,
    label: '标题',
    prop: 'fieldName',
    'min-width': '150',
  },
  {
    ...baseAttr,
    label: '显示',
    prop: 'show',
    'min-width': '70',
    tagName: 'el-switch',
    sortable: true,
  },
  // {
  //   ...baseAttr,
  //   label: '英文名称',
  //   prop: 'englishName',
  //   'min-width': '150',
  // },
  {
    ...baseAttr,
    label: '列宽',
    prop: 'columnWidth',
    'min-width': '100',
    // tagName: 'el-input-number',
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
    'min-width': '150',
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
    tagAttrs: getInputAttrs(),
    showCodeEditor: true,
  },
  {
    ...baseAttr,
    label: '筛选数组',
    prop: 'filters',
    'min-width': '200',
    tagAttrs: getInputAttrs('请输入[{ text, value }]格式"'),
    showCodeEditor: true,
  },
  {
    ...baseAttr,
    label: '筛选函数',
    prop: 'filter-method',
    'min-width': '200',
    tagAttrs: getInputAttrs('请输入function(value, row, column){}格式'),
    showCodeEditor: true,
  },
  {
    ...baseAttr,
    label: '是否单行显示',
    prop: 'show-overflow-tooltip',
    'min-width': '120',
    tagName: 'el-switch',
  },
  {
    ...baseAttr,
    label: '列表渲染函数',
    prop: 'formatter',
    'min-width': '200',
    tagAttrs: getInputAttrs(
      '请输入Function(row, column, cellValue, index)格式'
    ),
    showCodeEditor: true,
  },
  {
    ...baseAttr,
    label: '表头渲染函数',
    prop: 'renderHeader',
    'min-width': '200',
    tagAttrs: getInputAttrs('请输入Function(h, { column, $index })格式'),
    showCodeEditor: true,
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

const addTipsProps = {
  formatter: '列内容区域渲染使用的Function',
  renderHeader: '列标题Label区域渲染使用的Function',
  'show-overflow-tooltip': '当内容过长被隐藏时显示 tooltip',
  'filter-method':
    '数据过滤使用的方法，如果是多选的筛选项，对每一条数据会执行多次，任意一次返回 true 就会显示',
  filters: '数据过滤的选项，数组格式，数组中的元素需要有 text 和 value 属性。',
  sort: '对应列是否可以排序',
  'sort-method':
    '对数据进行排序的时候使用的方法，仅当 sortable 设置为 true 的时候有效，需返回一个数字，和 Array.sort 表现一致',
  searchWidget: '设置列表上方的搜索区域',
  fixed: '列是否固定在左侧或者右侧，',
};
function getEditConf() {
  return originEditConf.map((item) => {
    const content = addTipsProps[item.prop];
    if (content) {
      item.renderHeader = function() {
        return `<div style="display: inline-block;"><span>{{column.label}}</span><el-tooltip content="${content}"><i style="width: 20px" class="el-icon-question"/></el-tooltip></div>`;
      };
    }
    return item;
  });
}
getEditConf();
// export const editConf = getEditConf();
export const editConf = originEditConf;

export function getSingleTableData() {
  return {
    fieldCode: '',
    fieldName: '',
    // englishName: '',
    show: true,
    columnWidth: 110,
    align: 1,
    fixed: '',
    searchWidget: '',
    searchWidgetConfig: {},
    sort: false,
    'sort-method': '',
    filters: '',
    'filter-method': '',
    'show-overflow-tooltip': false,
    formatter: '',
    renderHeader: '',
  };
}
