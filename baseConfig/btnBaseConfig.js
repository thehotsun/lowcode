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

export const btnTypeArr = [
  {
    name: "add",
    displayName: "新增",
    isStatic: false
  },
  {
    name: "edit",
    displayName: "编辑",
    isStatic: false
  },
  {
    name: "check",
    displayName: "查看",
    isStatic: false
  },
  {
    name: "batchDel",
    displayName: "批量删除",
    isStatic: true
  },
  {
    name: "download",
    displayName: "导出",
    isStatic: true
  },
  {
    name: "flowDocDownload",
    displayName: "流程文档导出",
    isStatic: true
  },
  {
    name: "formDownload",
    displayName: "表单打印",
    isStatic: true
  },
  {
    name: "import",
    displayName: "导入",
    isStatic: true
  },
  {
    name: "importRefresh",
    displayName: "导入更新",
    isStatic: true
  },
  {
    name: "refresh",
    displayName: "刷新",
    isStatic: true
  },
  {
    name: "qrCode",
    displayName: "生成二维码",
    isStatic: true
  },
  {
    name: "custom",
    displayName: "自定义",
    isStatic: true
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

export const leftOrRight = [
  {
    value: "left",
    label: "左"
  },
  {
    value: "right",
    label: "右"
  }
];

export const QRCodePageOperateList = [
  {
    id: "form",
    cnName: "表单"
  }
];

export const QRBtnOptions = function() {
  return {
    // 二维码大小
    qrSize: 0,
    // 二维码标题
    title: "",
    // 二维码位置 bottom top
    titlePosition: "bottom",
    // 二维码过期时间
    expireDays: 0,
    // 二维码页面展示数据
    briefPageFields: [],
    // 二维码页面操作项
    briefPageOperations: [],
    // 二维码页面表单操作项关联的表单id
    targetFormId: "",
    // 二维码文件每行几个
    printCountPerRow: 3,
    // 二维码文件导出类型
    printFileType: "word"
  };
};
const staticBtn = btnTypeArr.filter(btn => btn.isStatic).map(btn => btn.name);

const downBtn = ["download", "flowDocDownload", "formDownload"];

const customBtn = "custom";

const dialogAttrRenderDependFn = function(formData) {
  return [0, 2, 6].includes(formData.extraOption.openType) || (formData.extraOption.openType === 4 && formData.extraOption.useDialog);
};

const requestBeforeConfirmRenderDependFn = function(formData) {
  return (
    !downBtn.concat("refresh", "qrCode", "custom").includes(formData.extraOption.btnType) &&
    !(
      (formData.extraOption.openType === 4 && formData.extraOption.useDialog && !formData.extraOption.showFooter) ||
      (formData.extraOption.openType === 4 && !formData.extraOption.useDialog)
    )
  );
};

const requestBeforeConfirmTextRenderDependFn = function(formData) {
  return formData.extraOption.requestBeforeConfirmHint;
};

const deliverySelectListRenderDependFn = function(formData) {
  return formData.extraOption.deliverySelectList && [4, 5].includes(formData.extraOption.openType);
};

const deliverySelectListFieldsRenderDependFn = function(formData) {
  return formData.extraOption.deliverySelectList && [0, 1, 3, 5, 6].includes(formData.extraOption.openType);
};

const excludeDownAndDelRenderDependFn = function(formData) {
  return !downBtn.concat("batchDel", "refresh", "qrCode", "custom").includes(formData.extraOption.btnType);
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
        style: "max-width: 180px;width: 100%;",
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
          return !staticBtn.includes(formData.extraOption.btnType);
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
        tagName: "div",
        contentTextFrontTagOptions: {
          wrapDivStyle: "display: inline-block;",
          tagName: "el-select",
          tagAttrs: {
            placeholder: "请选择表单",
            filterable: true
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
          }
        },
        contentTextBehindTagOptions: [
          {
            wrapDivStyle: "display: inline-block;",
            slotName: "refreshList"
          },
          {
            slotName: "relateFrom"
          }
        ],
        renderDependFn: expectOpenTypeRenderDependFnGenerator(0)
      }
    },

    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "extraOption.relateTable",
          label: "选择列表：",
          rules: {
            required: true,
            message: "请选择列表",
            trigger: "change"
          }
        },
        tagName: "div",
        contentTextFrontTagOptions: {
          extraOption: {
            options: [],
            props: {
              emitPath: false,
              key: "groupId",
              label: "groupName",
              children: "children"
            }
          },
          request: {
            require: false,
            url: "",
            type: "get",
            params: "",
            status: "pending"
          },
          wrapDivStyle: "display: inline-block;",
          tagName: "el-cascader",
          style: "width: 180px",
          tagAttrs: {
            placeholder: "请选择列表"
          },
          // 对应formData中的属性值
          formField: "extraOption.relateTable"
        },
        contentTextBehindTagOptions: [
          {
            wrapDivStyle: "display: inline-block;",
            slotName: "refreshList"
          },
          {
            slotName: "relateFrom"
          }
        ],
        renderDependFn: function(formData) {
          return [6].includes(formData.extraOption.openType);
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
        style: "max-width: 180px;width: 100%;",
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
        formItemAttrs: {
          prop: "extraOption.flowKey",
          label: "选择流程：",
          rules: {
            required: true,
            message: "请选择流程",
            trigger: "change"
          }
        },
        tagName: "div",
        contentTextFrontTagOptions: {
          extraOption: {
            options: [],
            props: {
              emitPath: false,
              key: "flowKey",
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
          wrapDivStyle: "display: inline-block;",
          tagName: "el-cascader",
          style: "width: 180px",
          tagAttrs: {
            placeholder: "请选择流程"
          },
          ref: "chooseFlow",
          // 对应formData中的属性值
          formField: "extraOption.flowKey",
          watch: {
            handler(formData, item, that) {
              console.log(formData, item, "handler");
              if (formData.extraOption.openType === 2) {
                that.$set(item.formItemAttrs.rules, "required", formData.extraOption.btnType !== "check");
              }
            },
            deep: true
          }
        },
        contentTextBehindTagOptions: [
          {
            wrapDivStyle: "display: inline-block;",
            slotName: "refreshList"
          },
          {
            slotName: "relateFrom"
          }
        ],
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
        style: "max-width: 180px;width: 100%;",
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
          placeholder: "请选择请求类型"
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
          return !staticBtn.includes(formData.extraOption.btnType);
        }
      }
    },

    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          prop: "extraOption.deliverySelectListFields",
          label: "提交字段："
        },

        slotName: "deliverySelectListFields",

        wrapDivStyle: "display: inline;",
        tagName: "el-select",
        tagAttrs: {
          placeholder: "不选默认只传主键值",
          multiple: true
        },
        // 对应formData中的属性值
        formField: "extraOption.deliverySelectListFields",
        extraOption: {
          props: {
            key: "id",
            label: "cnName"
          }
        },

        renderDependFn: deliverySelectListFieldsRenderDependFn
      }
    },

    // {
    //   elRowAttrs: {
    //     gutter: 10
    //   },
    //   formItem: {
    //     formItemAttrs: {
    //       prop: "extraOption.paramName",
    //       label: "参数名称："
    //     },
    //     formField: "extraOption.paramName",
    //     tagName: "el-input",
    //     style: "width: 180px",
    //     tagAttrs: {
    //       placeholder: "请输入参数名"
    //     },
    //     renderDependFn: deliverySelectListRenderDependFn
    //   }
    // },

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
        renderDependFn: formData => formData.extraOption.deliverySelectList
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
        style: "max-width: 180px;width: 100%;",
        tagAttrs: {
          type: "textarea",
          placeholder: "请输入提示文本",
          autosize: true
        },
        // 对应formData中的属性值
        formField: "extraOption.requestBeforeConfirmText",
        renderDependFn: requestBeforeConfirmTextRenderDependFn
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
        style: "max-width: 180px;width: 100%;",
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
        style: "max-width: 180px;width: 100%;",
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
        style: "max-width: 180px;width: 100%;",
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
          label: "打印文件模板："
          // "label-width": "0px"
        },
        slotName: "formDownloadSlot",
        renderDependFn: function(formData) {
          return ["formDownload"].includes(formData.extraOption.btnType);
        }
      }
    },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          label: "打印文件名称："
          // "label-width": "0px"
        },
        slotName: "formDownloadFileNameSlot",
        renderDependFn: function(formData) {
          return ["formDownload"].includes(formData.extraOption.btnType);
        }
      }
    },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          label: "输出文件格式："
          // "label-width": "0px"
        },
        slotName: "formDownloadFileTypeSlot",
        renderDependFn: function(formData) {
          return ["formDownload"].includes(formData.extraOption.btnType);
        }
      }
    },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          label: "数据设计："
          // "label-width": "0px"
        },
        slotName: "formDownloadDataSlot",
        renderDependFn: function(formData) {
          return ["formDownload"].includes(formData.extraOption.btnType);
        }
      }
    },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          label: "二维码长宽："
        },
        tagName: "div",
        contentTextFrontTagOptions: {
          tagName: "el-input-number",
          style: "max-width: 180px;width: 100%;",
          tagAttrs: {
            size: "mini",
            step: 1,
            min: 0
          },
          wrapDivStyle: "display: inline-block;",
          formField: "extraOption.qrSize"
        },
        contentTextBehindTagOptions: {
          tagName: "span",
          contentText: "毫米",
          wrapDivStyle: "display: inline-block;",
          style: "margin-left: 10px"
        },
        renderDependFn: function(formData) {
          return ["qrCode"].includes(formData.extraOption.btnType);
        }
      }
    },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          label: "二维码标题："
        },
        slotName: "title",
        renderDependFn: function(formData) {
          return ["qrCode"].includes(formData.extraOption.btnType);
        }
      }
    },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          label: "标题位置："
          // "label-width": "0px"
        },
        child: [
          {
            formField: "extraOption.titlePosition",
            tagName: "el-radio",
            contentText: "位于二维码下面",
            tagAttrs: {
              label: "bottom"
            },
            wrapDivStyle: "display: inline-block;margin-right: 15px;"
          },
          {
            formField: "extraOption.titlePosition",
            tagName: "el-radio",
            contentText: "位于二维码上面",
            tagAttrs: {
              label: "top"
            },
            wrapDivStyle: "display: inline-block;"
          }
        ],
        renderDependFn: function(formData) {
          return ["qrCode"].includes(formData.extraOption.btnType);
        }
      }
    },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          label: "有效期："
        },
        tagName: "div",
        contentTextFrontTagOptions: {
          tagName: "el-input-number",
          style: "max-width: 180px;width: 100%;",
          tagAttrs: {
            size: "mini",
            step: 1,
            min: 0
          },
          wrapDivStyle: "display: inline-block;",
          formField: "extraOption.expireDays"
        },
        contentTextBehindTagOptions: {
          tagName: "span",
          contentText: "天（0表示长期有效）",
          wrapDivStyle: "display: inline-block;",
          style: "margin-left: 10px"
        },
        renderDependFn: function(formData) {
          return ["qrCode"].includes(formData.extraOption.btnType);
        }
      }
    },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          label: "页面显示数据："
        },
        slotName: "briefPageFields",
        renderDependFn: function(formData) {
          return ["qrCode"].includes(formData.extraOption.btnType);
        }
      }
    },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          label: "页面操作项："
        },
        tagName: "el-select",
        tagAttrs: {
          placeholder: "请选择页面操作项",
          multiple: true
        },
        // 对应formData中的属性值
        formField: "extraOption.briefPageOperations",
        extraOption: {
          options: QRCodePageOperateList,
          props: {
            key: "id",
            label: "cnName"
          }
        },
        renderDependFn: function(formData) {
          return ["qrCode"].includes(formData.extraOption.btnType);
        }
      }
    },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          label: "选择表单："
        },
        tagName: "div",
        contentTextFrontTagOptions: {
          wrapDivStyle: "display: inline-block;",
          tagName: "el-select",
          tagAttrs: {
            placeholder: "请选择表单",
            filterable: true
          },
          // 对应formData中的属性值
          formField: "extraOption.targetFormId",
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
          }
        },
        contentTextBehindTagOptions: [
          {
            wrapDivStyle: "display: inline-block;",
            slotName: "refreshList"
          },
          {
            slotName: "relateFrom"
          }
        ],
        renderDependFn: function(formData) {
          return ["qrCode"].includes(formData.extraOption.btnType) && formData.extraOption.briefPageOperations.includes("form");
        }
      }
    },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          label: "二维码单行个数："
        },
        tagName: "el-input-number",
        behindText: "个",
        behindTextStyle: "margin-left: 10px",
        style: "max-width: 180px;width: 100%;",
        tagAttrs: {
          size: "mini",
          min: 1,
          step: 1
        },
        formField: "extraOption.printCountPerRow",
        renderDependFn: function(formData) {
          return ["qrCode"].includes(formData.extraOption.btnType);
        }
      }
    },
    {
      elRowAttrs: {
        gutter: 10
      },
      formItem: {
        formItemAttrs: {
          label: "文件格式："
          // "label-width": "0px"
        },
        child: [
          {
            formField: "extraOption.printFileType",
            tagName: "el-radio",
            contentText: "word",
            tagAttrs: {
              label: "word"
            },
            wrapDivStyle: "display: inline-block;margin-right: 15px;"
          },
          {
            formField: "extraOption.printFileType",
            tagName: "el-radio",
            contentText: "pdf",
            tagAttrs: {
              label: "pdf"
            },
            wrapDivStyle: "display: inline-block;"
          }
        ],
        renderDependFn: function(formData) {
          return ["qrCode"].includes(formData.extraOption.btnType);
        }
      }
    },
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
          prop: "extraOption.isHidden",
          label: "隐藏按钮："
        },
        tagName: "el-radio-group",
        tagAttrs: {
          placeholder: ""
        },
        // 对应formData中的属性值
        formField: "extraOption.isHidden",
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
          prop: "extraOption.btnPosition",
          label: "按钮位置："
        },
        tagName: "el-radio-group",
        tagAttrs: {
          placeholder: ""
        },
        // 对应formData中的属性值
        formField: "extraOption.btnPosition",
        extraOption: {
          options: leftOrRight,
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
        style: "max-width: 180px;width: 100%;",
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
        style: "max-width: 180px;width: 100%;",
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
          label: "执行函数：",
          rules: {
            message: "请输入执行函数",
            trigger: "blur",
            required: true
          },
          prop: "extraOption.fn",
          labelSlotName: "",
          labelOptions: {
            tagName: "el-tooltip",
            wrapDivStyle: "display: inline-block;",
            tagAttrs: {
              effect: "dark",
              content:
                "点击按钮后只执行当前输入的函数。此函数无入参，this指向当前渲染组件，可以通过this.selectList（这个值代表当前的选中行）等获取你要的相应信息（具体请参阅文档）",
              placement: "top-start",
              internalTagOption: {
                contentText: "执行函数：",
                style: "font-size: 14px"
              }
            }
          }
        },
        tagName: "el-input",
        style: "max-width: 180px;width: 100%;",
        tagAttrs: {
          placeholder: "请输入执行函数",
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
    ref: "",
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
      isHidden: false,
      btnPosition: "left",
      dialogTitle: "",
      dialogWidth: "900",
      dialogHeight: "600",
      deliverySelectList: false,
      deliverySelectListFields: [],
      // 此参数已废弃
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
      ...new QRBtnOptions(),
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
    btnId: Math.floor(Math.random() * 900) + 100,
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
