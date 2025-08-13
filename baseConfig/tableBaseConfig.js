// tableOptions中的item，可以理解为传给el-table-column中的attrs，要注意区分书写格式，例如min-width不要写成驼峰格式

import { align, searchWidget, fixed } from "./tableSelectConfigs";

export function getTableAttrs() {
  return {
    // 初始化是否显示分页
    showPagination: true,
    paginationSize: 20,
    isShowIndex: true,
    isShowCheckbox: true,
    index: "",
    stripe: true,
    border: true,
    showSummary: false,
    summaryMethod: "",
    size: "",
    isTree: false,
    treeProps: "",
    rowKey: "",
    lazy: false,
    isMerge: false,
    spanMethod: "",
    // 已废弃
    clickRowShowDetialDialog: false,
    style: "",
    elTableStyle: "",
    dataTransitionFn: "",
    dataTransitionParentField: "",
    dataTransitionCurField: "",
    deliveryLoadFnField: "",
    setPaginationSize: "",
    // 隐藏默认搜索刷新等功能区
    hiddenDefaultArea: false,
    // 双击关联的按钮ID
    dbClickRelateBtnId: "",
    // 重置按钮的事件
    resetBtnEvent: ""
  };
}

const getTextareaAttrs = placeholder => {
  return {
    autosize: true,
    type: "textarea",
    placeholder: placeholder || "请输入类似function (a, b) { // todo}的结构"
  };
};

const getInputAttrs = placeholder => {
  return {
    placeholder: placeholder || "请输入类似function (a, b) { // todo}的结构"
  };
};

const baseAttr = {
  tagName: "el-input",
  align: "center",
  "min-width": "80px",
  tagAttrs: {
    placeholder: "请输入",
    maxlength: ""
  },
  style: {
    width: "100%"
  }
};

const originEditConf = [
  {
    // 如需多选，则添加此item
    type: "selection",
    align: "center"
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
    tagName: "i",
    label: "",
    align: "center",
    className: "iconfont icon-drag drag-option my-handle",
    style: "cursor: pointer",
    width: "50"
  },
  {
    ...baseAttr,
    label: "字段名称",
    prop: "fieldCode",
    disabled: true,
    "min-width": "120"
  },
  {
    ...baseAttr,
    label: "标题",
    prop: "fieldName",
    "min-width": "150"
  },
  {
    ...baseAttr,
    label: "显示",
    prop: "show",
    "min-width": "70",
    tagName: "el-switch",
    sortable: true
  },
  // {
  //   ...baseAttr,
  //   label: '英文名称',
  //   prop: 'englishName',
  //   'min-width': '150',
  // },
  {
    ...baseAttr,
    label: "列宽",
    prop: "columnWidth",
    "min-width": "100"
    // tagName: 'el-input-number',
  },
  {
    ...baseAttr,
    label: "对齐",
    prop: "align",
    "min-width": "110",
    tagName: "el-select",
    // 特殊组件的额外属性值例如select组件下的option组件所需的options
    extraOption: {
      options: align
    }
  },
  {
    ...baseAttr,
    label: "是否固定",
    prop: "fixed",
    tagName: "el-select",
    tagAttrs: {
      clearable: true
    },
    "min-width": "110",
    // 特殊组件的额外属性值例如select组件下的option组件所需的options
    extraOption: {
      options: fixed
    }
  },
  // {
  //   ...baseAttr,
  //   label: '查询控件',
  //   prop: 'searchWidget',
  //   tagName: 'el-select',
  //   tagAttrs: {
  //     clearable: true,
  //   },
  //   'min-width': '150',
  //   // 特殊组件的额外属性值例如select组件下的option组件所需的options
  //   extraOption: {
  //     options: searchWidget,
  //   },
  // },
  {
    ...baseAttr,
    label: "启用查询",
    prop: "isSearchWidget",
    tagName: "el-switch",
    tagAttrs: {
      clearable: true
    },
    "min-width": "100",
    // 特殊组件的额外属性值例如select组件下的option组件所需的options
    extraOption: {
      options: searchWidget
    }
  },
  {
    label: "查询设置",
    prop: "",
    "min-width": "100",
    align: "center",
    slotName: "setupWidget"
  },
  {
    ...baseAttr,
    label: "排序",
    prop: "sort",
    "min-width": "70",
    tagName: "el-switch"
  },

  {
    ...baseAttr,
    label: "排序函数",
    prop: "sort-method",
    "min-width": "200",
    tagAttrs: getInputAttrs(),
    showCodeEditor: true
  },
  {
    ...baseAttr,
    label: "筛选数组",
    prop: "filters",
    "min-width": "120",
    slotName: "setupFilterArr"
  },
  {
    ...baseAttr,
    label: "筛选函数",
    prop: "filter-method",
    "min-width": "200",
    tagAttrs: getInputAttrs("请输入function(value, row, column){}格式"),
    showCodeEditor: true
  },
  {
    ...baseAttr,
    label: "是否单行显示",
    prop: "show-overflow-tooltip",
    "min-width": "120",
    tagName: "el-switch"
  },
  {
    label: "点击行为",
    prop: "singleFormatter",
    "min-width": "120",
    align: "center",
    slotName: "setupContentText"
  },
  {
    ...baseAttr,
    label: "列表渲染函数",
    prop: "formatter",
    "min-width": "200",
    tagAttrs: getInputAttrs("请输入Function(row, column, cellValue, index)格式"),
    showCodeEditor: true
  },
  {
    ...baseAttr,
    label: "表头渲染函数",
    prop: "renderHeader",
    "min-width": "200",
    tagAttrs: getInputAttrs("请输入Function(h, { column, $index })格式"),
    showCodeEditor: true
  }

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
  formatter: "列内容区域渲染使用的Function（优先级最高）",
  singleFormatter: "简单设置展示内容的样式和点击事件（优先级比列表渲染函数低）",
  renderHeader: "列标题Label区域渲染使用的Function",
  "show-overflow-tooltip": "当内容过长被隐藏时显示 tooltip",
  "filter-method": "表头过滤配置，需配合filters一起使用",
  filters: "表头过滤配置，需配合filter-method一起使用",
  sort: "对应列是否可以排序",
  "sort-method": "对数据进行排序的时候使用的方法，仅当 sortable 设置为 true 的时候有效，需返回一个数字，和 Array.sort 表现一致",
  searchWidget: "设置列表上方的搜索区域",
  fixed: "列是否固定在左侧或者右侧，"
};
function getEditConf() {
  return originEditConf.map(item => {
    const content = addTipsProps[item.prop];
    if (content) {
      item.renderHeader = function() {
        return {
          template: `<div style="display: inline-block;"><span>{{column.label}}</span><el-tooltip content="${content}"><i style="width: 20px" class="el-icon-question"/></el-tooltip></div>`
        };
      };
    }
    item.listeners = {};
    return item;
  });
}
getEditConf();
// export const editConf = getEditConf();
export const editConf = originEditConf;

export function ContentTextAttrForm() {
  return {
    isBold: false,
    isItalic: false,
    isStrikethrough: false,
    isUnderline: false,
    cursor: "pointer",
    fontSize: 12,
    color: "rgb(64, 158, 255)",
    clickEvent: {
      relateBtnId: ""
    },
    iconName: "",
    iconPosition: "front",
    iconStyle: "",
    textStyle: "padding-right: 5px;",
    textVal: "",
    conditionalJudgment: ""
  };
}

export function FiltersConfig() {
  return {
    isFilter: false,
    isSplit: false,
    splitChar: ",",
    customHandler: "",
    limitShowWord: false,
    maxlength: 10
  };
}
export function getSingleTableData(params = {}) {
  return {
    fieldCode: "",
    fieldName: "",
    // englishName: '',
    show: false,
    columnWidth: 110,
    align: 1,
    fixed: "",
    searchWidget: "",
    isSearchWidget: false,
    searchWidgetConfig: {},
    sort: true,
    "sort-method": "",
    // filters 和 filtersConfig 配合使用
    filters: "",
    filtersConfig: new FiltersConfig(),
    "filter-method": "",
    "show-overflow-tooltip": true,
    formatter: "",
    renderHeader: "",
    listeners: {},
    contentTextAttrArr: [],
    isCustom: false,
    ...params
  };
}
