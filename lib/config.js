(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["config"] = factory();
	else
		root["config"] = factory();
})(self, function() {
return /******/ (function() { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 288:
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getSingleFromData": function() { return /* binding */ getSingleFromData; }
/* harmony export */ });
// 如果想一行展示多个formitem，则formitem要设置为数组
var multipleCol = {
  // el-row的属性值
  elRowAttrs: {
    gutter: 10
  },
  formItem: [{
    // el-col的对应属性
    elColAttrs: {
      span: 16
    },
    // 赋值给formitem组件的class和style
    className: "select",
    style: "font-size: 12px",
    // formitem的对应属性
    formItemAttrs: {
      label: "册数：",
      prop: "pageNum"
    },
    // 一个formItem的content也允许渲染多个组件，方式为添加child属性，必须为数组
    child: [{
      // behindText和frontText为组件前后的文本，如需更复杂的自定义，请使用slotName(参考变量 slotOption)
      frontText: "第",
      behindText: "册",
      frontTextStyle: "color: red",
      behindTextStyle: "color: blue",
      // tagName必须是eleui提供的已有组件或HTML已有标签
      tagName: "el-input",
      style: "width: 100px",
      // 对应formData中的属性值
      formField: "pageNum",
      // 最终使用tagName渲染的标签或者组件的对应属性
      tagAttrs: {
        placeholder: "请输入册数",
        maxlength: ""
      }
    }, {
      style: "width: 100px; ",
      // behindText和frontText为组件前后的文本，如需更复杂的自定义，请使用slotName(参考变量 slotOption)
      frontText: "共",
      behindText: "册(有分册时，请填写)",
      frontTextStyle: "color: red; margin-left: 20px",
      // tagName必须是eleui提供的已有组件或HTML已有标签
      tagName: "el-input",
      // 对应formData中的属性值
      formField: "pageAllNum",
      // 最终使用tagName渲染的标签或者组件的对应属性
      tagAttrs: {
        placeholder: "请输入册数",
        maxlength: "",
        value: "",
        // 注意不要写为驼峰形式
        "show-password": true
      }
    }]
  }, {
    // tagName必须是eleui提供的已有组件或HTML已有标签
    tagName: "span",
    // 对应formData中的属性值
    formField: "format",
    contentText: 44,
    // formitem的对应属性
    formItemAttrs: {
      label: "格式："
    },
    // el-col的对应属性
    elColAttrs: {
      span: 8
    },
    // 最终使用tagName渲染的标签或者组件的对应属性
    tagAttrs: {}
  }]
};

// 如果想一行展示一个formitem，则formitem要设置为对象
var singleRow = {
  formItem: {
    // 赋值给formitem组件的class和style
    className: "select",
    style: "font-size: 30px",
    // formitem的对应属性
    formItemAttrs: {
      prop: "coverId",
      label: "选择封面：",
      required: true
    },
    // tagName必须是eleui提供的已有组件或HTML已有标签
    tagName: "el-select",
    // behindText和frontText为组件前后的展示文本，如需更复杂的自定义，请使用slotName
    behindText: "1",
    frontText: "2",
    // attrs主要包含直接赋值给当前组件的属性值
    tagAttrs: {
      placeholder: "请选择封面",
      clearable: true
    },
    // 对应formData中的属性值
    formField: "coverId",
    // 特殊组件的额外属性值例如select组件下的option组件所需的options
    extraOption: {
      options: [],
      props: {
        key: "id",
        label: "cnName"
      }
    },
    listeners: {
      // 事件命名保持和ele官网一致，如'current-change', 'sort-change'等，如果是原生事件，则去掉on使用on后面的名字作为方法名 参考nativeTag
      change: function change(s) {
        console.log(s, "listeners");
      }
    }
  }
};

// 原生标签所需配置
var nativeTag = {
  formItem: {
    className: "input",
    formItemAttrs: {
      prop: "input",
      label: "原生input标签"
    },
    tagName: "input",
    // 原生标签使用v-model会失效，请直接使用原生提供的属性值进行赋值
    tagAttrs: {
      placeholder: "请选择input"
    },
    formField: "input",
    listeners: {
      // 原生事件命名，去掉on使用on后面的名字作为方法名
      focus: function focus(s) {
        console.log(s, "input onfocus");
      }
    }
  }
};

// 如需使用自定义插槽，则只需以下配置，且在模板中使用#operator="{ formData }"来插入和正确获取数据
var slotOption = {
  formItem: {
    formItemAttrs: {
      label: "自定义插槽",
      required: true
    },
    slotName: "operator"
  }
};
function getSingleFromData() {
  return {
    fieldCode: "",
    fieldName: "",
    englishName: "",
    columnWidth: "",
    align: 1,
    show: true,
    sort: false,
    searchWidget: ""
  };
}

/***/ }),

/***/ 267:
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "editBtnConf": function() { return /* binding */ editBtnConf; },
/* harmony export */   "eidtConf": function() { return /* binding */ eidtConf; },
/* harmony export */   "getSingleBtnData": function() { return /* binding */ getSingleBtnData; },
/* harmony export */   "getSingleTableData": function() { return /* binding */ getSingleTableData; }
/* harmony export */ });
/* harmony import */ var C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(102);
/* harmony import */ var _tableSelectConfigs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(258);

// tableOptions中的item，可以理解为传给el-table-column中的attrs，要注意区分书写格式，例如min-width不要写成驼峰格式


var baseAttr = {
  tagName: 'el-input',
  align: 'center',
  'min-width': '50px',
  tagAttrs: {
    placeholder: '请输入',
    maxlength: ''
  },
  style: {
    width: '100%'
  }
};
var eidtConf = [{
  // 如需多选，则添加此item
  type: 'selection'
},
// {
//   // 如需展示索引，则添加此item
//   type: 'index',
// },
(0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])({
  label: '字段编号',
  prop: 'fieldCode'
}, baseAttr), (0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])({
  label: '字段名称',
  prop: 'fieldName'
}, baseAttr), (0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])({
  label: '英文名称',
  prop: 'englishName'
}, baseAttr), (0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])((0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])({
  label: '列宽',
  prop: 'columnWidth'
}, baseAttr), {}, {
  'min-width': '50',
  tagName: 'el-input-number'
}), (0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])((0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])({
  label: '对齐',
  prop: 'align'
}, baseAttr), {}, {
  'min-width': '50',
  tagName: 'el-select',
  // 特殊组件的额外属性值例如select组件下的option组件所需的options
  extraOption: {
    options: _tableSelectConfigs__WEBPACK_IMPORTED_MODULE_1__.align
  }
}), (0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])((0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])({
  label: '展示',
  prop: 'show'
}, baseAttr), {}, {
  'min-width': '50',
  tagName: 'el-checkbox',
  tagAttrs: {}
}), (0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])((0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])({
  label: '排序',
  prop: 'sort'
}, baseAttr), {}, {
  'min-width': '50',
  tagName: 'el-checkbox',
  tagAttrs: {}
}), (0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])((0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])({}, baseAttr), {}, {
  label: '查询控件',
  prop: 'searchWidget',
  tagName: 'el-select',
  tagAttrs: {
    clearable: true
  },
  // 特殊组件的额外属性值例如select组件下的option组件所需的options
  extraOption: {
    options: _tableSelectConfigs__WEBPACK_IMPORTED_MODULE_1__.searchWidget
  }
}), {
  label: '控件属性',
  prop: '',
  align: 'center',
  slotName: 'setupWidget'
},
// 如需使用slot功能，请添加slotName属性，并在template中使用相同的slot名称
{
  label: '操作',
  prop: '',
  align: 'center',
  slotName: 'operator'
}];
var editBtnConf = [{
  type: 'selection'
}, (0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])({
  label: '按钮ID',
  prop: 'btnID'
}, baseAttr), (0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])({
  label: '按钮名称',
  prop: 'btnName'
}, baseAttr), (0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])({
  label: '英文名称',
  prop: 'englishName'
}, baseAttr), (0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])((0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])({
  label: 'URL',
  prop: 'URL'
}, baseAttr), {}, {
  'min-width': '150px'
}), (0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])({
  label: '图标',
  prop: 'icon'
}, baseAttr), (0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])((0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])({
  label: '是否可用',
  prop: 'isUse'
}, baseAttr), {}, {
  'min-width': '50',
  tagName: 'el-checkbox'
}), (0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])((0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])({
  label: '是否显示',
  prop: 'isShow'
}, baseAttr), {}, {
  'min-width': '50',
  tagName: 'el-checkbox',
  tagAttrs: {}
}), (0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])((0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])({
  label: '按钮授权',
  prop: 'isAuth'
}, baseAttr), {}, {
  'min-width': '50',
  tagName: 'el-checkbox',
  tagAttrs: {}
}),
// 如需使用slot功能，请添加slotName属性，并在template中使用相同的slot名称
{
  label: '操作',
  prop: '',
  align: 'center',
  slotName: 'operator'
}];
function getSingleTableData() {
  return {
    fieldCode: '',
    fieldName: '',
    englishName: '',
    columnWidth: '',
    align: 1,
    show: true,
    sort: false,
    searchWidget: '',
    searchWidgetConfig: {}
  };
}
function getSingleBtnData() {
  return {
    btnID: '',
    btnName: '',
    englishName: '',
    URL: '',
    icon: '',
    isUse: true,
    isShow: false,
    isAuth: '',
    searchWidgetConfig: {}
  };
}

/***/ }),

/***/ 258:
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "align": function() { return /* binding */ align; },
/* harmony export */   "searchWidget": function() { return /* binding */ searchWidget; }
/* harmony export */ });
// 统一的关于table渲染涉及到的各种选项
var align = [{
  id: 0,
  cnName: '居左',
  value: 'left'
}, {
  id: 1,
  cnName: '居中',
  value: 'center'
}, {
  id: 2,
  cnName: '居右',
  value: 'right'
}];
var searchWidget = [{
  id: 0,
  cnName: '单行文本框',
  tagName: 'el-input'
}, {
  id: 1,
  cnName: '计数器',
  tagName: 'el-input-number'
}, {
  id: 2,
  cnName: '组合下拉框',
  tagName: 'el-select'
}, {
  id: 3,
  cnName: '日期选择框',
  tagName: 'el-date-picker'
}, {
  id: 4,
  cnName: '日期选择范围框',
  tagName: 'el-date-picker-range'
}, {
  id: 5,
  cnName: '级联选择器',
  tagName: 'el-cascader'
}];

/***/ }),

/***/ 162:
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getElBtnConfig": function() { return /* binding */ getElBtnConfig; },
/* harmony export */   "getElCascaderConfig": function() { return /* binding */ getElCascaderConfig; },
/* harmony export */   "getElDatePickerConfig": function() { return /* binding */ getElDatePickerConfig; },
/* harmony export */   "getElDatePickerRangeConfig": function() { return /* binding */ getElDatePickerRangeConfig; },
/* harmony export */   "getElInputConfig": function() { return /* binding */ getElInputConfig; },
/* harmony export */   "getElInputNumberConfig": function() { return /* binding */ getElInputNumberConfig; },
/* harmony export */   "getElSelectConfig": function() { return /* binding */ getElSelectConfig; }
/* harmony export */ });
/* harmony import */ var C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(102);

// 各个组件的相关定义，通过函数可以更灵活的进行每个组件的自定义。因为es6的export导出的值是地址引用，会存在各种问题

// const baseStyle = 'min-width: 150px;margin-right: 10px ';
var baseStyle = '';
function composeConfig(options) {
  var _options$tagName = options.tagName,
    tagName = _options$tagName === void 0 ? 'el-input' : _options$tagName,
    _options$tagAttrs = options.tagAttrs,
    tagAttrs = _options$tagAttrs === void 0 ? {} : _options$tagAttrs,
    _options$listeners = options.listeners,
    listeners = _options$listeners === void 0 ? {} : _options$listeners,
    _options$extraOption = options.extraOption,
    extraOption = _options$extraOption === void 0 ? {} : _options$extraOption,
    _options$customAttr = options.customAttr,
    customAttr = _options$customAttr === void 0 ? {} : _options$customAttr;
  return (0,C_Users_Admin_Desktop_git_lowcode_node_modules_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])({
    // 赋值给formitem组件的class和style
    // className: 'select',
    style: baseStyle,
    // tagName必须是eleui提供的已有组件或HTML已有标签
    tagName: tagName,
    // 对应的formData的具体属性值，用于赋值组件的v-model
    formField: '',
    // formitem的对应属性
    formItemAttrs: {
      prop: '',
      label: ''
    },
    // attrs主要包含直接赋值给当前组件的属性值
    tagAttrs: tagAttrs,
    // 事件命名保持和ele官网一致，如'current-change', 'sort-change'等，如果是原生事件，则去掉on使用on后面的名字作为方法名 参考nativeTag
    // change: (s) => {
    //   console.log(s, 'listeners');
    // },
    listeners: listeners,
    // 特殊组件的额外属性值例如select组件下的option组件所需的options
    extraOption: extraOption
  }, customAttr);
}
function getElInputConfig() {
  var tagAttrs = {
    placeholder: '请输入',
    maxlength: ''
    // 注意不要写为驼峰形式
    // 'show-password': true,
  };

  return composeConfig({
    tagName: 'el-input',
    tagAttrs: tagAttrs
  });
}
function getElInputNumberConfig() {
  var tagAttrs = {
    label: '请输入'
    // 注意不要写为驼峰形式
    // 'show-password': true,
  };

  return composeConfig({
    tagName: 'el-input-number',
    tagAttrs: tagAttrs
  });
}
function getElSelectConfig() {
  var tagAttrs = {
    placeholder: '请选择',
    clearable: true
  };
  var extraOption = {
    options: [],
    props: {
      key: 'id',
      label: 'cnName'
    }
  };
  return composeConfig({
    tagName: 'el-select',
    tagAttrs: tagAttrs,
    extraOption: extraOption
  });
}
function getElDatePickerConfig() {
  var tagAttrs = {
    placeholder: '请选择日期',
    clearable: true,
    type: 'date'
  };
  return composeConfig({
    tagName: 'el-date-picker',
    tagAttrs: tagAttrs
  });
}
function getElDatePickerRangeConfig() {
  var config = getElDatePickerConfig();
  config.tagAttrs.type = 'daterange';
  config.tagAttrs['range-separato'] = '至';
  config.tagAttrs['start-placeholder'] = '开始日期';
  config.tagAttrs['end-placeholder'] = '结束日期';
  return config;
}
function getElBtnConfig() {
  var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'primary';
  var fn = arguments.length > 1 ? arguments[1] : undefined;
  var text = arguments.length > 2 ? arguments[2] : undefined;
  var extraOption = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var tagAttrs = {
    size: 'small',
    type: type
  };
  var listeners = {
    click: fn
  };
  var customAttr = {
    contentText: text
  };
  return composeConfig({
    tagName: 'el-button',
    tagAttrs: tagAttrs,
    listeners: listeners,
    customAttr: customAttr,
    extraOption: extraOption
  });
}
function getElCascaderConfig() {
  var tagAttrs = {
    placeholder: '请选择',
    props: {
      expandTrigger: 'hover'
    },
    options: []
  };
  var extraOption = {
    options: [],
    props: {
      key: 'id',
      label: 'cnName'
    }
  };
  return composeConfig({
    tagName: 'el-cascader',
    tagAttrs: tagAttrs,
    extraOption: extraOption
  });
}

/***/ }),

/***/ 103:
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ _defineProperty; }
/* harmony export */ });
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

/***/ }),

/***/ 102:
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ _objectSpread2; }
/* harmony export */ });
/* harmony import */ var _defineProperty_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(103);


function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);

    if (enumerableOnly) {
      symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    }

    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        (0,_defineProperty_js__WEBPACK_IMPORTED_MODULE_0__["default"])(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	!function() {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = function(exports) {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	}();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
!function() {
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _widgetBaseConfig__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(162);
/* harmony import */ var _formBaseConfig__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(288);
/* harmony import */ var _tableBaseConfig__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(267);
/* harmony import */ var _tableSelectConfigs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(258);




/* harmony default export */ __webpack_exports__["default"] = ({
  widgetBaseConfig: _widgetBaseConfig__WEBPACK_IMPORTED_MODULE_0__,
  formBaseConfig: _formBaseConfig__WEBPACK_IMPORTED_MODULE_1__,
  tableBaseConfig: _tableBaseConfig__WEBPACK_IMPORTED_MODULE_2__,
  tableSelectConfig: _tableSelectConfigs__WEBPACK_IMPORTED_MODULE_3__
});
}();
__webpack_exports__ = __webpack_exports__["default"];
/******/ 	return __webpack_exports__;
/******/ })()
;
});