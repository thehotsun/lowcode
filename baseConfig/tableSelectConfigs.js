// 统一的关于table渲染涉及到的各种选项
export const align = [
  {
    id: 0,
    cnName: "居左",
    value: "left"
  },
  {
    id: 1,
    cnName: "居中",
    value: "center"
  },
  {
    id: 2,
    cnName: "居右",
    value: "right"
  }
];
export const fixed = [
  {
    id: "left",
    cnName: "居左",
    value: "left"
  },
  {
    id: "right",
    cnName: "居右",
    value: "right"
  }
];

export const searchWidget = [
  {
    id: 0,
    cnName: "单行文本框",
    tagName: "el-input",
    sqlType: "input"
  },
  // {
  //   id: 1,
  //   cnName: '计数器',
  //   tagName: 'el-input-number',
  // },
  {
    id: 6,
    cnName: "字典选择器",
    tagName: "dictionary",
    sqlType: "jy-dict-list"
  },
  {
    id: 2,
    cnName: "组合下拉框",
    tagName: "el-select",
    sqlType: "jy-dict-list"
  },
  {
    id: 3,
    cnName: "日期选择框",
    tagName: "el-date-picker",
    sqlType: "dateRadio"
  },
  {
    id: 4,
    cnName: "日期选择范围框",
    tagName: "el-date-picker-range",
    sqlType: "datePicker"
  },
  {
    id: 5,
    cnName: "级联选择器",
    tagName: "el-cascader",
    sqlType: "jy-dict-list"
  }
];
