export const openType = [
  {
    id: 0,
    cnName: '对话框（关联表单）',
  },
  {
    id: 2,
    cnName: '对话框（关联流程）',
  },
  {
    id: 4,
    cnName: '对话框（关联组件）',
  },
  {
    id: 1,
    cnName: '当前页面跳转',
  },
  {
    id: 3,
    cnName: '新窗口打开',
  },
];

export const showType = [
  {
    value: 0,
    label: '纯文字',
  },
  // {
  //   value: 1,
  //   label: '纯图标',
  // },
  // {
  //   value: 2,
  //   label: '图标+文字',
  // },
];

export const size = [
  {
    value: '',
    label: '默认',
  },
  {
    value: 'medium',
    label: '中等',
  },
  {
    label: '小型',
    value: 'small',
  },
  {
    label: '超小',
    value: 'mini',
  },
];

export const yesOrNo = [
  {
    value: true,
    label: '是',
  },
  {
    value: false,
    label: '否',
  },
];

export const btnConfigFormOptions = [
  {
    elRowAttrs: {
      gutter: 10,
    },
    formItem: {
      formItemAttrs: {
        prop: 'tagAttrs.value',
        label: '按钮标题：',
        rules: {
          message: '请输入按钮标题',
          trigger: 'blur',
          required: true,
        },
      },
      tagName: 'el-input',
      style: 'width: 180px',
      tagAttrs: {
        placeholder: '',
      },
      // 对应formData中的属性值
      formField: 'tagAttrs.value',
    },
  },
  {
    elRowAttrs: {
      gutter: 10,
    },
    formItem: {
      formItemAttrs: {
        prop: 'extraOption.openType',
        label: '打开方式：',
        rules: {
          required: true,
          message: '请选择打开方式',
          trigger: 'change',
        },
      },
      tagName: 'el-select',
      tagAttrs: {
        placeholder: '',
      },
      // 对应formData中的属性值
      formField: 'extraOption.openType',
      extraOption: {
        options: openType,
        props: {
          key: 'id',
          label: 'cnName',
        },
      },
    },
  },
  {
    elRowAttrs: {
      gutter: 10,
    },
    formItem: {
      formItemAttrs: {
        prop: 'extraOption.relateFrom',
        label: '选择表单：',
        rules: {
          required: true,
          message: '请选择表单',
          trigger: 'change',
        },
      },
      tagName: 'el-select',
      tagAttrs: {
        placeholder: '请选择表单',
      },
      // 对应formData中的属性值
      formField: 'extraOption.relateFrom',
      extraOption: {
        options: [],
        props: {
          key: 'id',
          label: 'cnName',
        },
      },
      request: {
        require: false,
        url: '',
        type: 'get',
        params: '',
        status: 'pending',
      },
      renderDependFn: function(formData) {
        return formData.extraOption.openType === 0;
      },
    },
  },

  {
    elRowAttrs: {
      gutter: 10,
    },
    formItem: {
      formItemAttrs: {
        prop: 'extraOption.relateMeta',
        label: '业务模型：',
        rules: {
          required: true,
          message: '请选择业务模型',
          trigger: 'change',
        },
      },
      tagName: 'el-select',
      tagAttrs: {
        placeholder: '请选择目标业务模型',
      },
      // 对应formData中的属性值
      formField: 'extraOption.relateMeta',
      extraOption: {
        options: [],
        props: {
          key: 'metaNameID',
          label: 'businessName',
        },
      },
      request: {
        require: false,
        url: '',
        type: 'get',
        params: '',
        status: 'pending',
      },
      renderDependFn: function(formData) {
        return formData.extraOption.btnType === 'import';
      },
    },
  },

  {
    elRowAttrs: {
      gutter: 10,
    },
    formItem: {
      formItemAttrs: {
        prop: 'extraOption.relateComponent',
        label: '选择组件：',
        rules: {
          required: true,
          message: '请选择组件',
          trigger: 'change',
        },
      },
      tagName: 'el-select',
      tagAttrs: {
        placeholder: '请选择组件',
      },
      // 对应formData中的属性值
      formField: 'extraOption.relateComponent',
      extraOption: {
        options: [],
        props: {
          key: 'id',
          label: 'cnName',
        },
      },
      request: {
        require: false,
        url: '',
        type: 'get',
        params: '',
        status: 'pending',
      },
      renderDependFn: function(formData) {
        return formData.extraOption.openType === 4;
      },
    },
  },

  {
    elRowAttrs: {
      gutter: 10,
    },
    formItem: {
      formItemAttrs: {
        prop: 'extraOption.openUrl',
        label: '跳转的url：',
        rules: {
          required: true,
          message: '请输入url',
          trigger: 'blur',
        },
      },
      tagName: 'el-input',
      style: 'width: 180px',
      tagAttrs: {
        placeholder: '',
      },
      // 对应formData中的属性值
      formField: 'extraOption.openUrl',
      renderDependFn: function(formData) {
        return [1, 3].includes(formData.extraOption.openType);
      },
    },
  },

  {
    elRowAttrs: {
      gutter: 10,
    },
    formItem: {
      extraOption: {
        options: [],
        props: {
          emitPath: false,
          value: 'flowKey',
          label: 'name',
          children: 'flowDefinitionDtoList',
        },
      },
      request: {
        require: false,
        url: '',
        type: 'get',
        params: '',
        status: 'pending',
      },
      formItemAttrs: {
        prop: 'extraOption.flowKey',
        label: '选择流程：',
        rules: {
          required: true,
          message: '请选择流程',
          trigger: 'change',
        },
      },
      tagName: 'el-cascader',
      style: 'width: 180px',
      tagAttrs: {
        placeholder: '请选择流程',
      },
      // 对应formData中的属性值
      formField: 'extraOption.flowKey',
      renderDependFn: function(formData) {
        return [2].includes(formData.extraOption.openType);
      },
    },
  },

  {
    elRowAttrs: {
      gutter: 10,
    },
    formItem: {
      formItemAttrs: {
        prop: 'authorize',
        label: '权限设置：',
        rules: {
          required: true,
          message: '请选择权限',
          trigger: 'change',
        },
      },
      tagName: 'el-select',
      tagAttrs: {
        placeholder: '请选择权限',
      },
      // 对应formData中的属性值
      formField: 'authorize',
      extraOption: {
        options: [],
        props: {
          key: 'id',
          label: 'cnName',
        },
      },
    },
  },
  {
    elRowAttrs: {
      gutter: 10,
    },
    formItem: {
      formItemAttrs: {
        prop: 'extraOption.isRefresh',
        label: '刷新列表：',
      },
      tagName: 'el-radio-group',
      tagAttrs: {
        placeholder: '',
      },
      // 对应formData中的属性值
      formField: 'extraOption.isRefresh',
      extraOption: {
        options: yesOrNo,
        props: {
          key: 'value',
          label: 'label',
        },
      },
      renderDependFn: function(formData) {
        return formData.extraOption.openType === 0;
      },
    },
  },
  {
    elRowAttrs: {
      gutter: 10,
    },
    formItem: {
      formItemAttrs: {
        prop: 'extraOption.dialogTitle',
        label: '弹窗标题：',
      },
      tagName: 'el-input',
      style: 'width: 180px',
      tagAttrs: {
        placeholder: '请输入弹窗标题',
      },
      // 对应formData中的属性值
      formField: 'extraOption.dialogTitle',
      renderDependFn: function(formData) {
        return [0, 4, 2].includes(formData.extraOption.openType);
      },
    },
  },
  {
    elRowAttrs: {
      gutter: 10,
    },
    formItem: {
      formItemAttrs: {
        prop: 'extraOption.dialogWidth',
        label: '弹窗宽度：',
      },
      tagName: 'el-input',
      style: 'width: 180px',
      tagAttrs: {
        placeholder: '请输入弹窗宽度',
      },
      // 对应formData中的属性值
      formField: 'extraOption.dialogWidth',
      renderDependFn: function(formData) {
        return [0, 4, 2].includes(formData.extraOption.openType);
      },
    },
  },
  {
    elRowAttrs: {
      gutter: 10,
    },
    formItem: {
      formItemAttrs: {
        prop: 'extraOption.dialogHeight',
        label: '弹窗高度：',
      },
      tagName: 'el-input',
      style: 'width: 180px',
      tagAttrs: {
        placeholder: '请输入弹窗高度',
      },
      // 对应formData中的属性值
      formField: 'extraOption.dialogHeight',
      renderDependFn: function(formData) {
        return [0, 4, 2].includes(formData.extraOption.openType);
      },
    },
  },

  {
    elRowAttrs: {
      gutter: 10,
    },
    formItem: {
      formItemAttrs: {
        prop: 'tagAttrs.showType',
        label: '显示形式：',
      },
      tagName: 'el-radio-group',
      tagAttrs: {
        placeholder: '',
      },
      // TODO 没想好怎么做
      formField: 'tagAttrs.showType',
      extraOption: {
        options: showType,
        props: {
          key: 'value',
          label: 'label',
        },
      },
    },
  },
  {
    elRowAttrs: {
      gutter: 10,
    },
    formItem: {
      formItemAttrs: {
        label: '颜色：',
      },
      slotName: 'color',
    },
  },
  {
    elRowAttrs: {
      gutter: 10,
    },
    formItem: {
      formItemAttrs: {
        prop: 'tagAttrs.size',
        label: '大小：',
      },
      tagName: 'el-radio-group',
      tagAttrs: {
        placeholder: '',
      },
      // 对应formData中的属性值
      formField: 'tagAttrs.size',
      extraOption: {
        options: size,
        props: {
          key: 'value',
          label: 'label',
        },
      },
    },
  },
  {
    elRowAttrs: {
      gutter: 10,
    },
    formItem: {
      formItemAttrs: {
        prop: 'tagAttrs.plain',
        label: '朴素：',
      },
      tagName: 'el-radio-group',
      tagAttrs: {
        placeholder: '',
      },
      // 对应formData中的属性值
      formField: 'tagAttrs.plain',
      extraOption: {
        options: yesOrNo,
        props: {
          key: 'value',
          label: 'label',
        },
      },
    },
  },
  {
    elRowAttrs: {
      gutter: 10,
    },
    formItem: {
      formItemAttrs: {
        prop: 'tagAttrs.round',
        label: '圆角：',
      },
      tagName: 'el-radio-group',
      tagAttrs: {
        placeholder: '',
      },
      // 对应formData中的属性值
      formField: 'tagAttrs.round',
      extraOption: {
        options: yesOrNo,
        props: {
          key: 'value',
          label: 'label',
        },
      },
    },
  },
  {
    elRowAttrs: {
      gutter: 10,
    },
    formItem: {
      formItemAttrs: {
        prop: 'style',
        label: '自定义样式：',
      },
      tagName: 'el-input',
      style: 'width: 180px',
      tagAttrs: {
        placeholder: '',
      },
      // 对应formData中的属性值
      formField: 'style',
    },
  },
  {
    elRowAttrs: {
      gutter: 10,
    },
    formItem: {
      formItemAttrs: {
        label: '可执行函数：',
        prop: 'extraOption.fn',
      },
      tagName: 'el-input',
      style: 'width: 180px',
      tagAttrs: {
        placeholder: '',
        type: 'textarea',
      },
      // 对应formData中的属性值
      formField: 'extraOption.fn',
    },
  },
];

export function BtnConfigFrom(custom = {}) {
  return {
    style: 'margin-right: 20px;',
    tagName: 'el-button',
    tagAttrs: {
      value: '',
      type: 'primary',
      size: 'small',
      plain: true,
      round: false,
      showType: 0,
    },
    extraOption: {
      relateFrom: '',
      relateMeta: '',
      relateComponent: '',
      openType: 0,
      openUrl: '',
      fn: '',
      flowKey: '',
      isRefresh: false,
      dialogTitle: '',
      dialogWidth: '900',
      dialogHeight: '600',
    },
    authorize: '',
    btnId: +new Date(),
    ...custom,
  };
}

export default {
  BtnConfigFrom,
  btnConfigFormOptions,
  yesOrNo,
  showType,
  openType,
  size,
};
