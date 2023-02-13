// 如果想一行展示多个formitem，则formitem要设置为数组
const multipleCol = {
  // el-row的属性值
  elRowAttrs: {
    gutter: 10
  },
  formItem: [
    {
      // el-col的对应属性
      elColAttrs: {
        span: 16
      },
      // 赋值给formitem组件的class和style
      className: 'select',
      style: 'font-size: 12px',
      // formitem的对应属性
      formItemAttrs: {
        label: '册数：',
        prop: 'pageNum'
      },
      // 一个formItem的content也允许渲染多个组件，方式为添加child属性，必须为数组
      child: [
        {
          // behindText和frontText为组件前后的文本，如需更复杂的自定义，请使用slotName(参考变量 slotOption)
          frontText: '第',
          behindText: '册',
          frontTextStyle: 'color: red',
          behindTextStyle: 'color: blue',
          // tagName必须是eleui提供的已有组件或HTML已有标签
          tagName: 'el-input',
          style: 'width: 100px',
          // 对应formData中的属性值
          formField: 'pageNum',
          // 最终使用tagName渲染的标签或者组件的对应属性
          tagAttrs: {
            placeholder: '请输入册数',
            maxlength: ''
          }
        },
        {
          style: 'width: 100px; ',
          // behindText和frontText为组件前后的文本，如需更复杂的自定义，请使用slotName(参考变量 slotOption)
          frontText: '共',
          behindText: '册(有分册时，请填写)',
          frontTextStyle: 'color: red; margin-left: 20px',
          // tagName必须是eleui提供的已有组件或HTML已有标签
          tagName: 'el-input',
          // 对应formData中的属性值
          formField: 'pageAllNum',
          // 最终使用tagName渲染的标签或者组件的对应属性
          tagAttrs: {
            placeholder: '请输入册数',
            maxlength: '',
            value: '',
            // 注意不要写为驼峰形式
            'show-password': true
          }
        }
      ]
    },
    {
      // tagName必须是eleui提供的已有组件或HTML已有标签
      tagName: 'span',
      // 对应formData中的属性值
      formField: 'format',
      contentText: 44,
      // formitem的对应属性
      formItemAttrs: {
        label: '格式：'
      },
      // el-col的对应属性
      elColAttrs: {
        span: 8
      },
      // 最终使用tagName渲染的标签或者组件的对应属性
      tagAttrs: {}
    }
  ]
};

// 如果想一行展示一个formitem，则formitem要设置为对象
const singleRow = {
  formItem: {
    // 赋值给formitem组件的class和style
    className: 'select',
    style: 'font-size: 30px',
    // formitem的对应属性
    formItemAttrs: {
      prop: 'coverId',
      label: '选择封面：',
      required: true
    },
    // tagName必须是eleui提供的已有组件或HTML已有标签
    tagName: 'el-select',
    // behindText和frontText为组件前后的展示文本，如需更复杂的自定义，请使用slotName
    behindText: '1',
    frontText: '2',
    // attrs主要包含直接赋值给当前组件的属性值
    tagAttrs: {
      placeholder: '请选择封面',
      clearable: true
    },
    // 对应formData中的属性值
    formField: 'coverId',

    // 特殊组件的额外属性值例如select组件下的option组件所需的options
    extraOption: {
      options: [],
      props: {
        key: 'id',
        label: 'cnName',
      },
    },
    listeners: {
      // 事件命名保持和ele官网一致，如'current-change', 'sort-change'等，如果是原生事件，则去掉on使用on后面的名字作为方法名 参考nativeTag
      change: (s) => {
        console.log(s, 'listeners');
      }
    }
  }
};

// 原生标签所需配置
const nativeTag = {
  formItem: {
    className: 'input',
    formItemAttrs: {
      prop: 'input',
      label: '原生input标签'
    },
    tagName: 'input',
    // 原生标签使用v-model会失效，请直接使用原生提供的属性值进行赋值
    tagAttrs: {
      placeholder: '请选择input'
    },
    formField: 'input',
    listeners: {
      // 原生事件命名，去掉on使用on后面的名字作为方法名
      focus: (s) => {
        console.log(s, 'input onfocus');
      }
    }
  }
};

// 如需使用自定义插槽，则只需以下配置，且在模板中使用#operator="{ formData }"来插入和正确获取数据
const slotOption = {
  formItem: {
    formItemAttrs: {
      label: '自定义插槽',
      required: true
    },
    slotName: 'operator'
  }
};

export default [multipleCol, singleRow, nativeTag, slotOption];
