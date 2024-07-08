export const treeAttrsCodeExampleList = {
  loadFn:
    "function loadNode(node, resolve) {\r\n  // node为当前节点的信息，resolve用来把数据塞进数组\r\n  if (node.level === 0) {\r\n    return resolve([{ name: 'region' }]);\r\n  }\r\n  if (node.level > 1) return resolve([]);\r\n\r\n  setTimeout(() => {\r\n    const data = [{\r\n      name: 'leaf',\r\n      leaf: true\r\n    }, {\r\n      name: 'zone'\r\n    }];\r\n\r\n    resolve(data);\r\n  }, 500);\r\n}",
  dataTransitionFn:
    "function (data) {\n  // data 是接口返回的数据\n  // 数组对象中的id字段\n  const idField = 'id';\n  // 数组对象中指向父级的字段\n  const parentField = 'parentField';\n  // 创建一个哈希表，存储每个节点\n  const idMapping = data.reduce((acc, el, i) => {\n    acc[el[idField]] = i;\n    return acc;\n  }, {});\n\n  const root = [];\n  data.forEach(el => {\n    // 如果是根节点（没有父节点），将其加入根节点数组\n    if (el[parentField] === null) {\n      root.push(el);\n      return;\n    }\n\n    // 使用哈希表获取父节点\n    const parentEl = data[idMapping[el[parentField]]];\n\n    // 如果父节点没有子节点数组，则创建一个\n    if (!parentEl.children) {\n      parentEl.children = [];\n    }\n\n    // 将当前节点加入父节点的子节点数组\n    parentEl.children.push(el);\n  });\n\n  return root;\n}",
  renderContent:
    'function render () {\n  // 此函数直接返回一个类似vue options组件的对象，如data、methods等，\n  // 模板则使用template代替，由于某些原因，尽量使用``来包裹整个字符串\n  return {\n    methods: {\n      getValue () {\n        return this.data.s\n      }\n    },\n    template: `<div><i  class="el-icon-date"></i> <span> {{getValue()}} </span></div>`\n  }\n}',
  nodeClick:
    "function nodeClick(data){\n  // data是点击节点的data\n  // 在这个函数中，你可以使用this关键字，this指向当前组件实例\n  // 无论之前你怎么处理数据，想要传递给table并刷新table的数据，必须调用下面的语句，前两个参数是固定值\n  this.dispatch('CompleteTable', 'refreshTable', data);\n}",
  filterFn:
    "function filterNode(value, data) {\r\n  // value是筛选输入框内的值\r\n  // data是每个节点的数据\r\n  if (!value) return true;\r\n  return data.label.indexOf(value) !== -1;\r\n}"
};
