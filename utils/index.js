import { getElDatePickerConfig, getElDatePickerRangeConfig, getElInputConfig, getElSelectConfig, getElBtnConfig } from "../baseConfig/widgetBaseConfig";

export function setPlaceholder(tagName, fieldName) {
  console.log(tagName);
  const inputs = ["el-input", "el-input-number"];
  return `请${inputs.includes(tagName) ? "输入" : "选择"}${fieldName}`;
}

export function setFilterAndResetBtnConfig(handleFilter, handleReset) {
  console.log(tagName);
  const inputs = ["el-input", "el-input-number"];
  return `请${inputs.includes(tagName) ? "输入" : "选择"}${fieldName}`;
}

// 设置searchFrom和装配fromOptions
export function composeFromOptions(searchFrom, rawSearchFrom) {
  const formOptions = [];
  const source = {};
  tableData.map(item => {
    const searchWidgetName = searchWidget.find(widgetitem => widgetitem.id === item.searchWidget)?.tagName;
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
        gutter: 10
      },
      formItem: formOptions
    }
  ];
}

export function setFromField(source, field) {
  source[field] = "";
}

export function completeFromItemOptions(data, tableItem) {
  data.formItemAttrs.prop = tableItem.fieldCode;
  data.formField = tableItem.fieldCode;
  data.formItemAttrs.label = tableItem.fieldName;
  data.tagAttrs.placeholder = setPlaceholder(data.tagName, tableItem.fieldName);
  setColSpan(data, 8);
  return data;
}

export function getWidgetOptions(searchWidgetName, item) {
  switch (searchWidgetName) {
    case "el-input":
      return completeFromItemOptions(getElInputConfig(), item);
    case "el-select":
      return completeFromItemOptions(getElSelectConfig(), item);
    case "el-date-picker":
      return completeFromItemOptions(getElDatePickerConfig(), item);
    case "el-date-picker-range":
      return completeFromItemOptions(getElDatePickerRangeConfig(), item);
    default:
      console.warn(`您输入的标签 ${searchWidgetName} 暂不支持！`);
      break;
  }
}

// TODO 每个formitem所占据的宽度如何更好的自定义？
export function setColSpan(data, span) {
  if (data.elColAttrs) {
    data.elColAttrs.span = span;
  } else {
    data.elColAttrs = {
      span: span
    };
  }
}

export function getFormItemEmptyConfig() {
  return {
    className: "",
    style: "",
    formItemAttrs: {
      prop: "",
      label: "",
      required: false
    },
    tagName: "",
    behindText: "",
    frontText: "",
    tagAttrs: {
      placeholder: "",
      clearable: true
    },
    formField: "",
    extraOption: {
      options: [],
      props: {
        key: "id",
        label: "cnName"
      }
    },
    listeners: {}
  };
}

export function str2obj(str) {
  return new Function("return" + str)();
}

export function getter(obj = {}, field = "") {
  const arr = field.split(".");
  return arr.reduce((prev, item) => {
    return prev[item];
  }, obj);
}

export function setter(obj = {}, field = "", value) {
  const arr = field.split(".");
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
    // e可能是原生事件对象
    setter(formData, formField, e?.target?.value ?? e);
    fn && fn(e);
  };
}
