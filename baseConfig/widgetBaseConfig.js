// 各个组件的相关定义，通过函数可以更灵活的进行每个组件的自定义。因为es6的export导出的值是地址引用，会存在各种问题

// const baseStyle = 'min-width: 150px;margin-right: 10px ';
const baseStyle = "";

function composeConfig(options, labelSlot) {
  const { tagName = "el-input", tagAttrs = {}, listeners = {}, extraOption = {}, customAttr = {}, request = {}, style = "" } = options;
  const baseOptions = {
    // 赋值给formitem组件的class和style
    // className: 'select',
    style: style || baseStyle,
    // tagName必须是eleui提供的已有组件或HTML已有标签
    tagName: tagName,
    // 对应的formData的具体属性值，用于赋值组件的v-model
    formField: "",
    // formitem的对应属性
    formItemAttrs: {
      prop: "",
      label: "",
      "label-width": "auto"
    },
    sortNumb: 0,
    // attrs主要包含直接赋值给当前组件的属性值
    tagAttrs: tagAttrs,
    // 事件命名保持和ele官网一致，如'current-change', 'sort-change'等，如果是原生事件，则去掉on使用on后面的名字作为方法名 参考nativeTag
    // change: (s) => {
    //   console.log(s, 'listeners');
    // },
    listeners: listeners,
    // 特殊组件的额外属性值例如select组件下的option组件所需的options
    extraOption: extraOption,
    request,

    contentTextFrontTagOptions: {},
    contentTextBehindTagOptions: {},
    // 非常用属性通过此属性传递
    ...customAttr
  };
  if (labelSlot) {
    baseOptions.formItemAttrs.labelOptions = {
      tagName: "span",
      // style: 'padding-right: 15px',
      contentText: ""
    };
  }

  return baseOptions;
}

export function getElInputConfig() {
  const tagAttrs = {
    placeholder: "请输入",
    maxlength: "",
    clearable: true
    // 注意不要写为驼峰形式
    // 'show-password': true,
  };
  return composeConfig({
    tagName: "el-input",
    tagAttrs
  });
}

export function getElInputNumberConfig() {
  const tagAttrs = {
    label: "请输入"
    // 注意不要写为驼峰形式
    // 'show-password': true,
  };
  return composeConfig({
    tagName: "el-input-number",
    tagAttrs
  });
}

export function getElSelectConfig() {
  const tagAttrs = {
    placeholder: "请选择",
    clearable: true
  };
  const extraOption = {
    options: [],
    props: {
      key: "id",
      label: "cnName"
    }
  };
  const request = { url: "", status: "pending" };

  return composeConfig({
    tagName: "el-select",
    tagAttrs,
    extraOption,
    request
  });
}
export function getElDatePickerConfig() {
  const tagAttrs = {
    placeholder: "请选择日期",
    clearable: true,
    type: "date",
    "value-format": "yyyy-MM-dd"
  };
  return composeConfig({
    tagName: "el-date-picker",
    tagAttrs
  });
}

export function getElDatePickerRangeConfig() {
  const config = getElDatePickerConfig();
  config.tagAttrs.type = "daterange";
  config.tagAttrs["range-separato"] = "至";
  config.tagAttrs["start-placeholder"] = "开始日期";
  config.tagAttrs["end-placeholder"] = "结束日期";
  return config;
}

export function getElBtnConfig(type = "primary", fn, customAttr, extraOption = {}) {
  const tagAttrs = {
    size: "small",
    type
  };
  const listeners = {
    click: fn
  };
  return composeConfig({
    style: "margin-left: 20px",
    tagName: "el-button",
    tagAttrs,
    listeners,
    customAttr,
    extraOption
  });
}

export function getElCascaderConfig() {
  const tagAttrs = {
    placeholder: "请选择",
    props: { expandTrigger: "hover" }
  };
  const extraOption = {
    options: [],
    props: {
      key: "id",
      label: "cnName"
    }
  };
  const request = { url: "", status: "pending" };
  return composeConfig({
    tagName: "el-cascader",
    tagAttrs,
    extraOption,
    request
  });
}
