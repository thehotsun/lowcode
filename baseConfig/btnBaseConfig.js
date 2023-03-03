export const openType = [
  {
    id: 0,
    cnName: '当前页面打开',
  },
  {
    id: 1,
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
        required: true,
      },
      tagName: 'el-input',
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
        prop: 'extraOption.relateFrom',
        label: '选择表单：',
        required: false,
      },
      tagName: 'el-select',
      tagAttrs: {
        placeholder: '',
      },
      // 对应formData中的属性值
      formField: 'extraOption.relateFrom',
      extraOption: {
        options: [
          {
            id: 1,
            label: 's',
          },
        ],
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
        prop: 'extraOption.openType',
        label: '打开方式：',
        required: true,
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
        prop: 'extraOption.openUrl',
        label: '跳转的url：',
      },
      tagName: 'el-input',
      tagAttrs: {
        placeholder: '',
      },
      // 对应formData中的属性值
      formField: 'extraOption.openUrl',
    },
  },
  {
    elRowAttrs: {
      gutter: 10,
    },
    formItem: {
      formItemAttrs: {
        prop: 'extraOption.isRefresh',
        label: '是否刷新列表：',
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
        prop: 'showType',
        label: '显示形式：',
      },
      tagName: 'el-radio-group',
      tagAttrs: {
        placeholder: '',
      },
      // TODO 没想好怎么做
      formField: 'showType',
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
        label: '颜色',
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
    style: '',
    tagName: 'el-button',
    tagAttrs: {
      value: '',
      type: '',
      size: '',
      plain: true,
      round: false,
      showType: 0,
    },
    extraOption: {
      relateFrom: '',
      openType: 0,
      openUrl: '',
      fn: '',
      isRefresh: true,
    },
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
