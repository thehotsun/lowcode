export const treeAttrsCodeExampleList = {
  loadFn:
    "function loadNode(node, resolve) {\r\n  // node为当前节点的信息，resolve用来把数据塞进数组\r\n  if (node.level === 0) {\r\n    return resolve([{ name: 'region' }]);\r\n  }\r\n  if (node.level > 1) return resolve([]);\r\n\r\n  setTimeout(() => {\r\n    const data = [{\r\n      name: 'leaf',\r\n      leaf: true\r\n    }, {\r\n      name: 'zone'\r\n    }];\r\n\r\n    resolve(data);\r\n  }, 500);\r\n}",
  dataTransitionFn:
    "function dataTransition(data) {\n  // data 是接口返回的数据\n  // 数组对象中的id字段\n  const idField = 'id';\n  // 数组对象中指向父级的字段\n  const parentField = 'parentField';\n  // 创建一个哈希表，存储每个节点\n  const idMapping = data.reduce((acc, el, i) => {\n    acc[el[idField]] = i;\n    return acc;\n  }, {});\n\n  const root = [];\n  data.forEach(el => {\n    // 如果是根节点（没有父节点），将其加入根节点数组\n    if (el[parentField] === null) {\n      root.push(el);\n      return;\n    }\n\n    // 使用哈希表获取父节点\n    const parentEl = data[idMapping[el[parentField]]];\n\n    // 如果父节点没有子节点数组，则创建一个\n    if (!parentEl.children) {\n      parentEl.children = [];\n    }\n\n    // 将当前节点加入父节点的子节点数组\n    parentEl.children.push(el);\n  });\n\n  return root;\n}",
  renderContent:
    'function render() {\n  // 此函数直接返回一个类似vue options组件的对象，如data、methods等，\n  // 模板则使用template代替，由于某些原因，尽量使用``来包裹整个字符串\n  return {\n    methods: {\n      getValue () {\n        return this.data.s\n      }\n    },\n    template: `<div><i  class="el-icon-date"></i> <span> {{getValue()}} </span></div>`\n  }\n}',
  nodeClick:
    "function nodeClick(data){\n  // data是点击节点的data\n  // 在这个函数中，你可以使用this关键字，this指向当前组件实例\n  // 无论之前你怎么处理数据，想要传递给table并刷新table的数据，必须调用下面的语句，前两个参数是固定值\n  this.dispatch('CompleteTable', 'refreshTable', data);\n}",
  filterFn:
    "function filterNode(value, data) {\r\n  // value是筛选输入框内的值\r\n  // data是每个节点的数据\r\n  if (!value) return true;\r\n  return data.label.indexOf(value) !== -1;\r\n}"
};
export const tableAttrsCodeExampleList = {
  index: "function indexMethod(index) {\r\n  // index是数组的下标，如果是第一行，index为0\r\n  return index * 2;\r\n}",
  summaryMethod:
    "function getSummaries(param) {\r\n  // 接受的参数，columns是列信息, data是tabledata\r\n  const { columns, data } = param;\r\n  const sums = [];\r\n  columns.forEach((column, index) => {\r\n    if (index === 0) {\r\n      // 如果是第一列，直接展示总价这个文本\r\n      sums[index] = '总价';\r\n      return;\r\n    }\r\n    // 将这一列所有的数据进行数字转换\r\n    const values = data.map(item => Number(item[column.property]));\r\n    // 如果没有一个是NaN,则将所有数据相加，最后加一个元字\r\n    if (!values.every(value => isNaN(value))) {\r\n      sums[index] = values.reduce((prev, curr) => {\r\n        const value = Number(curr);\r\n        if (!isNaN(value)) {\r\n          return prev + curr;\r\n        } else {\r\n          return prev;\r\n        }\r\n      }, 0);\r\n      sums[index] += ' 元';\r\n    } else {\r\n      // 否则，直接展示N/A文本\r\n      sums[index] = 'N/A';\r\n    }\r\n  });\r\n\r\n  return sums;\r\n}",
  spanMethod:
    "function objectSpanMethod({ row, column, rowIndex, columnIndex }) {\r\n  // 只针对第一列\r\n  if (columnIndex === 0) {\r\n    // 如果行是偶数行，则占据两列\r\n    if (rowIndex % 2 === 0) {\r\n      return {\r\n        // rowspan返回几，就占据几行，\r\n        rowspan: 2,\r\n        // colspan返回几，就占据几列\r\n        colspan: 1\r\n      };\r\n    } else {\r\n      // 返回0则当前cell不展示\r\n      return {\r\n        rowspan: 0,\r\n        colspan: 0\r\n      };\r\n    }\r\n  }\r\n}",
  dataTransitionFn:
    "function dataTransition(data) {\n  // data 是接口返回的数据\n  // 数组对象中的id字段\n  const idField = 'id';\n  // 数组对象中指向父级的字段\n  const parentField = 'parentField';\n  // 创建一个哈希表，存储每个节点\n  const idMapping = data.reduce((acc, el, i) => {\n    acc[el[idField]] = i;\n    return acc;\n  }, {});\n\n  const root = [];\n  data.forEach(el => {\n    // 如果是根节点（没有父节点），将其加入根节点数组\n    if (el[parentField] === null) {\n      root.push(el);\n      return;\n    }\n\n    // 使用哈希表获取父节点\n    const parentEl = data[idMapping[el[parentField]]];\n\n    // 如果父节点没有子节点数组，则创建一个\n    if (!parentEl.children) {\n      parentEl.children = [];\n    }\n\n    // 将当前节点加入父节点的子节点数组\n    parentEl.children.push(el);\n  });\n\n  return root;\n}",
  setPaginationSize:
    '[{\r\n  label: "10条/页",\r\n  value: 10\r\n},\r\n{\r\n  label: "20条/页",\r\n  value: 20\r\n},\r\n{\r\n  label: "50条/页",\r\n  value: 50\r\n},\r\n{\r\n  label: "100条/页",\r\n  value: 100\r\n}]'
};

export const tableOptionsCodeExampleList = {
         filters: "[{text: '2016-05-01(显示值)', value: '2016-05-01(传递给筛选函数的值)'}]",
         "sort-method":
           "function sortMethod(a, b) {\n  // a是需要排序的上一个值，b是需要排序的下一个值\n  // 需返回一个数字，和 Array.sort 表现一致\n  if (a < b) {\n    return -1\n  } else if (a > b) {\n    return 1\n  } else {\n    return 0\n  }\n}",
         "filter-method":
           "function filterHandler(value, row, column) {\r\n  // value是筛选选中的值，如果选择多个，则会将值挨个遍历此方法\r\n  \r\n  // 取出属性名\r\n  const property = column['property'];\r\n  // 筛选\r\n  return row[property] === value;\r\n}",
         renderHeader:
           'function render() {\n  // 此函数直接返回一个类似vue options组件的对象，如data、methods等，\n  // 可以通过this.row获取当前行数据，this.index获取下标，this.getTableRenderInstance()获取当前渲染实例\n  // 可以通过this.emitBtnClick(this.row, 按钮名称， 按钮id)来触发配置的按钮，其中按钮名称（会找到第一个匹配到的按钮注意重名问题）和按钮id任选其一即可。\n  // 模板则使用template代替，由于某些原因，尽量使用``来包裹整个字符串\n  return {\n    data () {\n      return {\n        s: "22"\n      }\n    },\n    methods: {\n      getValue () {\n        return this.s\n      },\n      btnClick() {\n        this.emitBtnClick(this.row, "后台接口")  \n      }\n    },\n    template: `<div @click.stop="btnClick"><i  class="el-icon-date"></i> <span> {{getValue()}} </span></div>`\n  }\n}',
         formatter:
           'function render() {\n  // 此函数直接返回一个类似vue options组件的对象，如data、methods等，\n  // 可以通过this.row获取当前行数据，this.index获取下标，this.getTableRenderInstance()获取当前渲染实例\n  // 可以通过this.emitBtnClick(this.row, 按钮名称， 按钮id)来触发配置的按钮，其中按钮名称（会找到第一个匹配到的按钮注意重名问题）和按钮id任选其一即可。\n  // 模板则使用template代替，由于某些原因，尽量使用``来包裹整个字符串\n  return {\n    data () {\n      return {\n        s: "22"\n      }\n    },\n    methods: {\n      getValue () {\n        return this.s\n      },\n      btnClick() {\n        this.emitBtnClick(this.row, "后台接口")  \n      }\n    },\n    template: `<div @click.stop="btnClick"><i  class="el-icon-date"></i> <span> {{getValue()}} </span></div>`\n  }\n}'
       };
