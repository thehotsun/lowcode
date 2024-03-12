export const openType = [
  {
    id: 0,
    cnName: "对话框（关联表单）"
  },
  {
    id: 2,
    cnName: "对话框（关联流程）"
  },
  {
    id: 4,
    cnName: "对话框（关联组件）"
  },
  {
    id: 6,
    cnName: "对话框（关联列表）"
  },
  {
    id: 5,
    cnName: "调用后台接口"
  },
  {
    id: 1,
    cnName: "当前页面跳转"
  },
  {
    id: 3,
    cnName: "新窗口打开"
  }
];

export const requestTypeList = [
  {
    id: 0,
    cnName: "post"
  },
  {
    id: 1,
    cnName: "get"
  }
];

export const showType = [
  {
    value: 0,
    label: "纯文字"
  },
  {
    value: 1,
    label: "纯图标"
  },
  {
    value: 2,
    label: "图标+文字"
  }
];

export const size = [
  {
    value: "",
    label: "默认"
  },
  {
    value: "medium",
    label: "中等"
  },
  {
    label: "小型",
    value: "small"
  },
  {
    label: "超小",
    value: "mini"
  }
];

export const yesOrNo = [
  {
    value: true,
    label: "是"
  },
  {
    value: false,
    label: "否"
  }
];

const dialogAttrRenderDependFn = function(formData) {
  return [0, 2, 6].includes(formData.extraOption.openType) || (formData.extraOption.openType === 4 && formData.extraOption.useDialog);
};

const requestBeforeConfirmRenderDependFn = function(formData) {
  return (
    formData.extraOption.btnType !== "download" &&
    !(
      (formData.extraOption.openType === 4 && formData.extraOption.useDialog && !formData.extraOption.showFooter) ||
      (formData.extraOption.openType === 4 && !formData.extraOption.useDialog)
    )
  );
};

const deliverySelectListRenderDependFn = function(formData) {
  return formData.extraOption.deliverySelectList && formData.extraOption.openType !== 6;
};

const excludeDownAndDelRenderDependFn = function(formData) {
  return !["download", "batchDel"].includes(formData.extraOption.btnType);
};

const expectOpenTypeRenderDependFnGenerator = openType =>
  function(formData) {
    return formData.extraOption.openType === openType;
  };

export function BtnConfigFormOptions() {
  return [
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "tagAttrs.value",
          label: "按钮标题：",
          rules: {
            message: "请输入按钮标题",
            trigger: "blur",
            required: true
          }
        },
        tagName: "el-input",
        style: "width: 180px",
        tagAttrs: {
          placeholder: ""
        },
        // 对应formData中的属性值
        formField: "tagAttrs.value"
      }
    },

    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "authorize",
          label: "操作权限：",
          rules: {
            required: true,
            message: "请选择权限",
            trigger: "change"
          }
        },
        tagName: "el-select",
        tagAttrs: {
          placeholder: "请选择权限"
        },
        // 对应formData中的属性值
        formField: "authorize",
        extraOption: {
          options: [],
          props: {
            key: "id",
            label: "cnName"
          }
        }
      }
    },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "extraOption.openType",
          label: "打开方式：",
          rules: {
            required: true,
            message: "请选择打开方式",
            trigger: "change"
          }
        },
        tagName: "el-select",
        tagAttrs: {
          placeholder: ""
        },
        // 对应formData中的属性值
        formField: "extraOption.openType",
        extraOption: {
          options: openType,
          props: {
            key: "id",
            label: "cnName"
          }
        },
        renderDependFn: function(formData) {
          return !["import", "download", "batchDel"].includes(formData.extraOption.btnType);
        }
      }
    },

    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "extraOption.relateFrom",
          label: "选择表单：",
          rules: {
            required: true,
            message: "请选择表单",
            trigger: "change"
          }
        },
        tagName: "el-select",
        tagAttrs: {
          placeholder: "请选择表单"
        },
        // 对应formData中的属性值
        formField: "extraOption.relateFrom",
        extraOption: {
          options: [],
          props: {
            key: "id",
            label: "cnName"
          }
        },
        request: {
          require: false,
          url: "",
          type: "get",
          params: "",
          status: "pending"
        },
        renderDependFn: expectOpenTypeRenderDependFnGenerator(0)
      }
    },

    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        extraOption: {
          options: [],
          props: {
            emitPath: false,
            value: "flowKey",
            label: "name",
            children: "flowDefinitionDtoList"
          }
        },
        request: {
          require: false,
          url: "",
          type: "get",
          params: "",
          status: "pending"
        },
        formItemAttrs: {
          prop: "extraOption.relateTable",
          label: "选择列表：",
          rules: {
            required: true,
            message: "请选择列表",
            trigger: "change"
          }
        },
        tagName: "el-cascader",
        style: "width: 180px",
        tagAttrs: {
          placeholder: "请选择列表"
        },
        // 对应formData中的属性值
        formField: "extraOption.relateTable",
        renderDependFn: function(formData) {
          return [2].includes(formData.extraOption.openType);
        }
      }
    },

    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "extraOption.relateMeta",
          label: "业务模型：",
          rules: {
            required: true,
            message: "请选择业务模型",
            trigger: "change"
          }
        },
        tagName: "el-select",
        tagAttrs: {
          placeholder: "请选择目标业务模型"
        },
        // 对应formData中的属性值
        formField: "extraOption.relateMeta",
        extraOption: {
          options: [],
          props: {
            key: "metaId",
            label: "businessName"
          }
        },
        request: {
          require: false,
          url: "",
          type: "get",
          params: "",
          status: "pending"
        },
        renderDependFn: function(formData) {
          return formData.extraOption.btnType === "import";
        }
      }
    },

    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "extraOption.relateComponent",
          label: "选择组件：",
          rules: {
            required: true,
            message: "请选择组件",
            trigger: "change"
          }
        },
        tagName: "el-select",
        tagAttrs: {
          placeholder: "请选择组件"
        },
        // 对应formData中的属性值
        formField: "extraOption.relateComponent",
        extraOption: {
          options: [],
          props: {
            key: "id",
            label: "cnName"
          }
        },
        request: {
          require: false,
          url: "",
          type: "get",
          params: "",
          status: "pending"
        },
        renderDependFn: expectOpenTypeRenderDependFnGenerator(4)
      }
    },

    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "extraOption.openUrl",
          label: "跳转的url：",
          rules: {
            required: true,
            message: "请输入url",
            trigger: "blur"
          }
        },
        tagName: "el-input",
        style: "width: 180px",
        tagAttrs: {
          placeholder: ""
        },
        // 对应formData中的属性值
        formField: "extraOption.openUrl",
        renderDependFn: function(formData) {
          return [1, 3].includes(formData.extraOption.openType);
        }
      }
    },

    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        extraOption: {
          options: [],
          props: {
            emitPath: false,
            value: "flowKey",
            label: "name",
            children: "flowDefinitionDtoList"
          }
        },
        request: {
          require: false,
          url: "",
          type: "get",
          params: "",
          status: "pending"
        },
        formItemAttrs: {
          prop: "extraOption.flowKey",
          label: "选择流程：",
          rules: {
            required: true,
            message: "请选择流程",
            trigger: "change"
          }
        },
        tagName: "el-cascader",
        style: "width: 180px",
        tagAttrs: {
          placeholder: "请选择流程"
        },
        // 对应formData中的属性值
        formField: "extraOption.flowKey",
        renderDependFn: function(formData) {
          return [2].includes(formData.extraOption.openType);
        }
      }
    },

    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "extraOption.requestUrl",
          label: "接口地址：",
          // rules: {
          //   required: true,
          //   message: '请输入接口地址',
          //   trigger: 'blur',
          // },
          labelSlotName: "",
          labelOptions: {
            tagName: "el-tooltip",
            style: "width: 180px",
            tagAttrs: {
              effect: "dark",
              content: "请输入相对路径，请略过url前缀如（/common/dp/api/v1）",
              placement: "top-start",
              internalTagOption: {
                contentText: "接口地址：",
                style: "font-size: 14px"
              }
            }
          }
        },
        slotName: "requestUrl",
        tagName: "el-input",
        style: "width: 180px",
        tagAttrs: {
          placeholder: ""
        },
        // 对应formData中的属性值
        formField: "extraOption.requestUrl",
        renderDependFn: function(formData) {
          return formData.extraOption.openType === 5;
        }
      }
    },

    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "extraOption.requestType",
          label: "请求类型："
        },
        tagName: "el-select",
        tagAttrs: {
          placeholder: "请选择组件"
        },
        // 对应formData中的属性值
        formField: "extraOption.requestType",
        extraOption: {
          options: requestTypeList,
          props: {
            key: "id",
            label: "cnName"
          }
        },
        request: {
          require: false,
          url: "",
          type: "get",
          params: "",
          status: "pending"
        },
        renderDependFn: function(formData) {
          return formData.extraOption.openType === 5;
        }
      }
    },

    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "extraOption.deliverySelectList",
          label: "提交列表选中数据："
        },
        tagName: "el-switch",
        tagAttrs: {},
        // 对应formData中的属性值
        formField: "extraOption.deliverySelectList",
        extraOption: {},
        renderDependFn: function(formData) {
          return !["import", "batchDel", "download"].includes(formData.extraOption.btnType);
        }
      }
    },

    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "extraOption.paramName",
          label: "参数名称："
          // rules: {
          //   required: true,
          //   message: '请输入参数名',
          //   trigger: 'blur',
          // },
        },
        formField: "extraOption.paramName",
        tagName: "el-input",
        style: "width: 180px",
        tagAttrs: {
          placeholder: "请输入参数名"
        },
        renderDependFn: deliverySelectListRenderDependFn
      }
    },

    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "extraOption.paramType",
          label: "参数位置："
        },
        // 对应formData中的属性值
        formField: "extraOption.paramType",
        tagName: "el-select",
        tagAttrs: {
          placeholder: "请选择参数位置"
        },
        extraOption: {
          options: [
            {
              id: 0,
              cnName: "body"
            },
            {
              id: 1,
              cnName: "url"
            }
          ],
          props: {
            key: "id",
            label: "cnName"
          }
        },
        renderDependFn: deliverySelectListRenderDependFn
      }
    },

    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "extraOption.validate",
          label: "选中数据校验规则："
        },
        // 对应formData中的属性值
        formField: "extraOption.validate",
        tagName: "el-checkbox-group",
        tagAttrs: {},
        extraOption: {
          options: [
            {
              id: 0,
              cnName: "无选中记录时，提示并中断操作"
            },
            {
              id: 1,
              cnName: "只允许选中一条"
            }
          ],
          props: {
            key: "id",
            label: "cnName"
          }
        },
        renderDependFn: deliverySelectListRenderDependFn
      }
    },

    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "extraOption.isRefresh",
          label: "刷新列表："
        },
        tagName: "el-radio-group",
        tagAttrs: {
          placeholder: ""
        },
        // 对应formData中的属性值
        formField: "extraOption.isRefresh",
        extraOption: {
          options: yesOrNo,
          props: {
            key: "value",
            label: "label"
          }
        },
        renderDependFn: excludeDownAndDelRenderDependFn
      }
    },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "extraOption.useDialog",
          label: "使用对话框："
        },
        tagName: "el-switch",
        tagAttrs: {},
        // 对应formData中的属性值
        formField: "extraOption.useDialog",
        extraOption: {},
        renderDependFn: expectOpenTypeRenderDependFnGenerator(4)
      }
    },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "extraOption.showFooter",
          label: "展示底部按钮："
        },
        tagName: "el-switch",
        tagAttrs: {},
        // 对应formData中的属性值
        formField: "extraOption.showFooter",
        extraOption: {},
        renderDependFn: function(formData) {
          return formData.extraOption.openType === 4 && formData.extraOption.useDialog;
        }
      }
    },

    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "extraOption.requestBeforeConfirmHint",
          label: "提交前弹出对话框："
        },
        tagName: "el-switch",
        tagAttrs: {},
        // 对应formData中的属性值
        formField: "extraOption.requestBeforeConfirmHint",
        extraOption: {},
        renderDependFn: requestBeforeConfirmRenderDependFn
      }
    },

    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "extraOption.requestBeforeConfirmText",
          label: "提示文本："
        },
        tagName: "el-input",
        style: "width: 180px",
        tagAttrs: {
          type: "textarea",
          placeholder: "请输入提示文本",
          autosize: true
        },
        // 对应formData中的属性值
        formField: "extraOption.requestBeforeConfirmText",
        renderDependFn: requestBeforeConfirmRenderDependFn
      }
    },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "extraOption.dialogTitle",
          label: "弹窗标题："
        },
        tagName: "el-input",
        style: "width: 180px",
        tagAttrs: {
          placeholder: "请输入弹窗标题"
        },
        // 对应formData中的属性值
        formField: "extraOption.dialogTitle",
        renderDependFn: dialogAttrRenderDependFn
      }
    },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "extraOption.dialogWidth",
          label: "弹窗宽度："
        },
        tagName: "el-input",
        style: "width: 180px",
        tagAttrs: {
          placeholder: "请输入弹窗宽度"
        },
        // 对应formData中的属性值
        formField: "extraOption.dialogWidth",
        renderDependFn: dialogAttrRenderDependFn
      }
    },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "extraOption.dialogHeight",
          label: "弹窗高度："
        },
        tagName: "el-input",
        style: "width: 180px",
        tagAttrs: {
          placeholder: "请输入弹窗高度"
        },
        // 对应formData中的属性值
        formField: "extraOption.dialogHeight",
        renderDependFn: dialogAttrRenderDependFn
      }
    },

    // {
    //   elRowAttrs: {
    //     gutter: 10,
    //   },
    //   formItem: {
    //     formItemAttrs: {
    //       prop: 'tagAttrs.showType',
    //       label: '显示形式：',
    //     },
    //     tagName: 'el-radio-group',
    //     tagAttrs: {
    //       placeholder: '',
    //     },
    //     formField: 'tagAttrs.showType',
    //     extraOption: {
    //       options: showType,
    //       props: {
    //         key: 'value',
    //         label: 'label',
    //       },
    //     },
    //   },
    // },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          label: "颜色："
        },
        slotName: "color"
      }
    },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "tagAttrs.size",
          label: "大小："
        },
        tagName: "el-radio-group",
        tagAttrs: {
          placeholder: ""
        },
        // 对应formData中的属性值
        formField: "tagAttrs.size",
        extraOption: {
          options: size,
          props: {
            key: "value",
            label: "label"
          }
        }
      }
    },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "tagAttrs.plain",
          label: "朴素："
        },
        tagName: "el-radio-group",
        tagAttrs: {
          placeholder: ""
        },
        // 对应formData中的属性值
        formField: "tagAttrs.plain",
        extraOption: {
          options: yesOrNo,
          props: {
            key: "value",
            label: "label"
          }
        }
      }
    },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "tagAttrs.round",
          label: "圆角："
        },
        tagName: "el-radio-group",
        tagAttrs: {
          placeholder: ""
        },
        // 对应formData中的属性值
        formField: "tagAttrs.round",
        extraOption: {
          options: yesOrNo,
          props: {
            key: "value",
            label: "label"
          }
        }
      }
    },

    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "extraOption.iconName",
          label: "图标："
        },
        slotName: "iconName"
      }
    },

    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "extraOption.iconPosition",
          label: "图标位置："
        },
        tagName: "el-radio-group",
        tagAttrs: {
          placeholder: ""
        },
        // 对应formData中的属性值
        formField: "extraOption.iconPosition",
        listeners: {},
        extraOption: {
          options: [
            { label: "icon前置", value: "front" },
            { label: "icon后置", value: "behind" }
          ],
          props: {
            key: "value",
            label: "label"
          }
        }
      }
    },

    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "style",
          label: "自定义样式："
        },
        tagName: "el-input",
        style: "width: 180px",
        tagAttrs: {
          placeholder: ""
        },
        // 对应formData中的属性值
        formField: "style",
        listeners: {}
      }
    },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          label: "按钮校验函数：",
          prop: "extraOption.validateFn"
        },
        tagName: "el-input",
        style: "width: 180px",
        tagAttrs: {
          placeholder: "按钮执行前的校验函数，返回true则继续执行按钮操作，false则中断操作",
          type: "textarea",
          autosize: true
        },
        showCodeEditor: true,
        // 对应formData中的属性值
        formField: "extraOption.validateFn"
      }
    },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          label: "自定义执行函数：",
          prop: "extraOption.fn"
        },
        tagName: "el-input",
        style: "width: 180px",
        tagAttrs: {
          placeholder: "",
          type: "textarea",
          autosize: true
        },
        // 对应formData中的属性值
        formField: "extraOption.fn",
        showCodeEditor: true,
        renderDependFn: function(formData) {
          return ["custom"].includes(formData.extraOption.btnType);
        }
      }
    }
  ];
}

export function BtnConfigFrom(custom = {}) {
  return {
    style: "margin-right: 20px;",
    tagName: "el-button",
    tagAttrs: {
      value: "",
      type: "primary",
      size: "small",
      plain: true,
      round: false,
      icon: ""
    },
    extraOption: {
      btnType: "",
      relateFrom: "",
      relateTable: "",
      relateMeta: "",
      relateComponent: "",
      openType: 0,
      openUrl: "",
      fn: "",
      flowKey: "",
      isRefresh: false,
      dialogTitle: "",
      dialogWidth: "900",
      dialogHeight: "600",
      deliverySelectList: false,
      paramName: "",
      paramType: 0,
      validate: [],
      requestUrl: "",
      requestType: 0,
      requestBeforeConfirmHint: false,
      requestBeforeConfirmText: "",
      requestParamsConfig: {
        params: [],
        data: []
      },
      iconPosition: "front",
      iconName: "",
      useDialog: true,
      showFooter: false,
      // 执行当前按钮逻辑前的校验，返回true则继续执行
      validateFn: ""
    },
    contentTextFrontTagOptions: {},
    contentTextBehindTagOptions: {},
    // 点击按钮是否传递当前选中数据
    authorize: "",
    btnId: +new Date(),
    ...custom
  };
}

export default {
  BtnConfigFrom,
  BtnConfigFormOptions,
  yesOrNo,
  showType,
  openType,
  size
};
