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
  {
    id: 1,
    cnName: "数值范围",
    tagName: "el-input-range",
    sqlType: "el-input-range"
  },
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

export const CELL_REBDER_TYPE = {
  DICT: "dict",
  PERSON: "person"
};

export const cellRenderType = [
  {
    id: CELL_REBDER_TYPE.DICT,
    cnName: "字典",
    value: CELL_REBDER_TYPE.DICT
  },
  {
    id: CELL_REBDER_TYPE.PERSON,
    cnName: "人员",
    value: CELL_REBDER_TYPE.PERSON
  }
];

// 移动端卡片布局枚举（mobileAttrs.fieldLayout / labelLayout）：设计端弹窗单选、
// getMobileAttrs() 默认值与渲染端布局判断共用同一取值来源，取值变更须三处同步语义。
export const MOBILE_FIELD_LAYOUT = {
  SINGLE: "single",
  DOUBLE: "double"
};

export const fieldLayout = [
  {
    id: MOBILE_FIELD_LAYOUT.SINGLE,
    cnName: "单列",
    value: MOBILE_FIELD_LAYOUT.SINGLE
  },
  {
    id: MOBILE_FIELD_LAYOUT.DOUBLE,
    cnName: "双列",
    value: MOBILE_FIELD_LAYOUT.DOUBLE
  }
];

export const MOBILE_LABEL_LAYOUT = {
  VERTICAL: "vertical",
  HORIZONTAL: "horizontal"
};

export const labelLayout = [
  {
    id: MOBILE_LABEL_LAYOUT.VERTICAL,
    cnName: "上下",
    value: MOBILE_LABEL_LAYOUT.VERTICAL
  },
  {
    id: MOBILE_LABEL_LAYOUT.HORIZONTAL,
    cnName: "左右",
    value: MOBILE_LABEL_LAYOUT.HORIZONTAL
  }
];

export const cellDictRenderConfig = [
  {
    backgroundColor: "#FCE9DE",
    color: "#ED6F21",
    desc: "多彩色/橘红/橘红"
  },
  { backgroundColor: "#E6E4FE", color: "#564AF7", desc: "多彩色/紫色/紫色" },
  { backgroundColor: "#E5E5E5", color: "#000000", desc: "图标颜色/悬停背景" },
  { backgroundColor: "#F9EAFF", color: "#AC49F5", desc: "多彩色/玫紫/玫紫" },
  { backgroundColor: "#FEF8E8", color: "#C89818", desc: "功能色/一般提示-浅色背景" },
  { backgroundColor: "#EFFAEB", color: "#64BB5C", desc: "多彩色/绿色/绿色" },
  { backgroundColor: "#E6F8EE", color: "#00B955", desc: "功能色/成功提示-浅色背景" },
  { backgroundColor: "#DBF9EF", color: "#28A697", desc: "多彩色/青色/青色" },
  { backgroundColor: "#FDECE6", color: "#EB4100", desc: "功能色/错误警告-浅色背景" },
  { backgroundColor: "#FFE4E4", color: "#E64566", desc: "多彩色/玫红/红" },
  { backgroundColor: "#FFE4D4", color: "#FF7D2D", desc: "功能色/重要提示-浅色背景" },
  { backgroundColor: "#FCE9DE", color: "#ED6F21", desc: "多彩色/橘红/橘红" },
  { backgroundColor: "#E1EFFE", color: "#3491FA", desc: "多彩色/蓝色/湖蓝" }
];
