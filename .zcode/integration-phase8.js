/* eslint-disable */
// 第八期代码联调：表单/列表路由页全链路（真实构建产物 + 宿主真实 SFC 源码）
//
// A. vform 参数桌面一致性：同一按钮配置分别驱动桌面 complete-table（lib/completeTable.js）
//    与移动端 mobileTable（lib/mobileTable.js），深度对比桌面 getExternalCompBaseAttrs()/
//    externalParamsFormRow 与移动端 sessionStorage 载荷（formAttrs/externalParams）。
// B. 宿主路由页链路：编译宿主 D:/prj/commondp-web/src/CommonDPh5/pages/commonRender/lowcodeModal.vue
//    真实 SFC（宿主 node_modules 的 vue-template-compiler + @babel），以真实移动端跳转产生的
//    query + sessionStorage 挂载，断言 VFormRender 收到的 props/attrs 与桌面完全一致、
//    addExtraData 载荷一致、确定/提交/回刷链路与 pageList 分流正确。
//
// 运行：node .zcode/integration-phase8.js
const fs = require("fs");
const path = require("path");
const { JSDOM } = (() => {
  try {
    return require("jsdom");
  } catch (e) {
    return { JSDOM: null };
  }
})();

const HAS_JSDOM = !!JSDOM;
if (!HAS_JSDOM) {
  console.error("本联调脚本需要 jsdom 环境（B 部分依赖 DOM 挂载）");
  process.exit(1);
}
const dom = new JSDOM('<!doctype html><html><head><script src="http://localhost/mock.js"></script></head><body></body></html>', { url: "http://localhost/commonDph5.html" });
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.sessionStorage = dom.window.sessionStorage;
global.IntersectionObserver = class { observe() {} disconnect() {} };

const Vue = require("../node_modules/vue/dist/vue.common.dev.js");
Vue.config.productionTip = false;
global.self = global; // UMD产物以self为global挂载点
const ElementUI = require("../node_modules/element-ui/lib/element-ui.common.js");
Vue.use(ElementUI);

const CompleteTable = require("../lib/completeTable.js");
const MobileTable = require("../lib/mobileTable.js");
const DesktopComp = CompleteTable.default || CompleteTable;
const MobileComp = MobileTable.default || MobileTable;

const HOST = "D:/prj/commondp-web";
const MODAL_PARAMS_KEY = "lowcodeTableModalPageParams";
const PENDING_REFRESH_KEY = "lowcodeTablePendingRefresh";

let passed = 0;
let failed = 0;
function assert(name, cond, extra) {
  if (cond) {
    passed++;
    console.log(`  PASS ${name}`);
  } else {
    failed++;
    console.log(`  FAIL ${name}${extra ? " -> " + extra : ""}`);
  }
}

// 键序稳定 + 丢弃 undefined 的序列化（JSON 语义），用于深度对比
function stable(value) {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stable);
  const out = {};
  Object.keys(value)
    .sort()
    .forEach(key => {
      const v = stable(value[key]);
      if (v !== undefined) out[key] = v;
    });
  return out;
}
function deepEqual(a, b) {
  return JSON.stringify(stable(a)) === JSON.stringify(stable(b));
}
// 精确键级差异报告：收集叶子路径上的不同值
function diff(a, b, prefix = "") {
  const lines = [];
  const sa = stable(a);
  const sb = stable(b);
  const keys = Array.from(new Set([...Object.keys(sa || {}), ...Object.keys(sb || {})])).sort();
  if (Array.isArray(sa) || Array.isArray(sb)) {
    if (JSON.stringify(sa) !== JSON.stringify(sb)) lines.push(`${prefix}: [desktop] ${JSON.stringify(sa)} vs [mobile] ${JSON.stringify(sb)}`);
    return lines;
  }
  keys.forEach(key => {
    const va = sa?.[key];
    const vb = sb?.[key];
    if (JSON.stringify(va) !== JSON.stringify(vb)) {
      if (va && vb && typeof va === "object" && typeof vb === "object" && !Array.isArray(va) && !Array.isArray(vb)) {
        lines.push(...diff(va, vb, `${prefix}${prefix ? "." : ""}${key}`));
      } else {
        lines.push(`${prefix}${prefix ? "." : ""}${key}: [desktop] ${JSON.stringify(va)} vs [mobile] ${JSON.stringify(vb)}`);
      }
    }
  });
  return lines;
}

// 联调按钮配置（extraOption.iconName 预置：规避桌面 composeBtnRegularOptions 的
// setDefaultIconName 原地补默认值——该差异仅存在于 originInfo 的展示性字段，vform 运行时不消费）
const BTN_FORM = {
  btnId: 1,
  authorize: "",
  tagAttrs: { value: "新增" },
  extraOption: {
    openType: 0,
    btnType: "add",
    relateFrom: "formA",
    dialogTitle: "",
    isRefresh: true,
    deliverySelectList: true,
    deliverySelectListFields: ["name", { fieldCode: "dept", renamed: "deptName" }],
    paramName: "",
    paramType: 0,
    validate: [],
    iconName: "el-icon-custom"
  }
};
const BTN_TABLE = {
  btnId: 2,
  authorize: "",
  tagAttrs: { value: "查看明细" },
  extraOption: {
    openType: 6,
    btnType: "check",
    relateTable: "tbB",
    deliverySelectList: true,
    deliverySelectListFields: ["name"],
    paramName: "",
    paramType: 0,
    validate: [0]
  }
};
const TABLE_JSON = {
  pageLayout: "table",
  keyField: "id",
  tableOptions: [
    { fieldCode: "id", fieldName: "ID", show: true },
    { fieldCode: "name", fieldName: "名称", show: true },
    { fieldCode: "dept", fieldName: "部门", show: true }
  ],
  formOptions: [],
  tableAttrs: {},
  mobileAttrs: {},
  fuzzyFieldSearchConfig: {}
};
const ROWS = [
  { id: 5, name: "张三", dept: "研发" },
  { id: 6, name: "李四", dept: "测试" }
];

function baseProvide(extra = {}) {
  return {
    requestTableData: () => Promise.resolve({ result: "0", data: [] }),
    requestTablePaginationData: () => Promise.resolve({ result: "0", data: [], totalCount: 0 }),
    requestTableConfig: () => Promise.resolve({ result: "0", data: "{}" }),
    checkPermission: () => true,
    renderStrategy: { source: "" },
    eventBus: new Vue(),
    getWidgetByFreeLayout: () => ({}),
    getRawRelateId: () => "",
    getListPageId: () => "t1",
    enterpriseId: "ent1",
    getWrapHeight: () => ({ height: 600 }),
    ...extra
  };
}

function mountComp(Comp) {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return new Vue({
    el,
    provide: baseProvide(),
    render: h => h(Comp, { props: { listPageIdProp: "t1" }, ref: "ct" })
  });
}

(async () => {
  console.log("== A. vform 参数桌面一致性（桌面 complete-table vs 移动 mobileTable） ==");
  const desktopVM = mountComp(DesktopComp);
  const dt = desktopVM.$refs.ct.$refs.tableItem;
  assert("桌面 complete-table 挂载并取到 tableItem", !!dt);

  const mobileVM = mountComp(MobileComp);
  const mt = mobileVM.$refs.ct.isMobileMode ? mobileVM.$refs.ct.$refs.mobileItem : mobileVM.$refs.ct;
  // 桌面环境（jsdom UA 非 mobile）下 complete-table 走桌面 tableItem；mobileTable 顶层即移动组件
  const mtDirect = (mobileVM.$refs.ct.$refs.mobileItem || mobileVM.$refs.ct);
  assert("移动 mobileTable 挂载", !!mtDirect);

  // 桌面：装配同一配置与数据，走真实 executeButton 链
  dt.$warn = msg => console.log(`    [desktop $warn] ${msg}`);
  dt.expose_showDialog = () => {}; // 弹窗打开占位（移动端等价为路由跳转）
  dt.parseTableConfig({ ...TABLE_JSON, formOptions: [JSON.parse(JSON.stringify(BTN_FORM))] });
  dt.tableData = ROWS.map(r => ({ ...r }));
  dt.selectList = [dt.tableData[0]];
  dt.externalParams = { src: "outer" };
  await dt.handleBtnClick({ ...BTN_FORM.extraOption, btnId: BTN_FORM.btnId, authorize: "" }, undefined);
  const desktopAttrs = dt.getExternalCompBaseAttrs();
  const desktopExtra = dt.externalParamsFormRow;
  assert("桌面侧产出 attrs 与 externalParamsFormRow", !!desktopAttrs && !!desktopExtra);

  // 移动：同一配置与数据，走真实 executeButton 链（fab 入口等价）
  mtDirect.formOptions = [JSON.parse(JSON.stringify(BTN_FORM))];
  mtDirect.tableConfigJSON = TABLE_JSON.tableOptions.map(c => ({ ...c }));
  mtDirect.composeBtnList();
  mtDirect.keyField = "id";
  mtDirect.tableData = ROWS.map(r => ({ ...r }));
  mtDirect.selectList = [mtDirect.tableData[0]];
  mtDirect.externalParams = { src: "outer" };
  const mobilePushes = [];
  mtDirect.$router = { push: loc => mobilePushes.push(loc), resolve: () => ({ route: { matched: [{}] } }) };
  await mtDirect.executeButton({ ...BTN_FORM.extraOption, btnId: BTN_FORM.btnId, authorize: "" }, undefined);
  const payload = JSON.parse(sessionStorage.getItem(MODAL_PARAMS_KEY));
  const push = mobilePushes[0];

  assert("移动跳转 /lowcodeModal 且 sessionStorage 载荷含两通道", push?.path === "/lowcodeModal" && !!payload?.formAttrs && !!payload?.externalParams, JSON.stringify(push));

  // ---- 核心断言：vform 获得的 attrs 与桌面完全一致 ----
  assert("attrs.callingFrom 与桌面一致", payload.formAttrs.callingFrom === desktopAttrs.callingFrom);
  assert("attrs.dlgFormConfig 与桌面完全一致", deepEqual(payload.formAttrs.dlgFormConfig, desktopAttrs.dlgFormConfig), diff(desktopAttrs.dlgFormConfig, payload.formAttrs.dlgFormConfig));
  assert("attrs.requestConfig 与桌面完全一致", deepEqual(payload.formAttrs.requestConfig, desktopAttrs.requestConfig), diff(desktopAttrs.requestConfig, payload.formAttrs.requestConfig));
  assert("attrs 外部参数三件(dynamicExternalParams/externalParams/tableData)与桌面完全一致", deepEqual(
    { dynamicExternalParams: payload.formAttrs.dynamicExternalParams, externalParams: payload.formAttrs.externalParams, tableData: payload.formAttrs.tableData },
    { dynamicExternalParams: desktopAttrs.dynamicExternalParams, externalParams: desktopAttrs.externalParams, tableData: desktopAttrs.tableData }
  ), "");
  assert("attrs 勾选链三件(keyFieldName/selectList/paramsRule)与桌面完全一致", deepEqual(
    { keyFieldName: payload.formAttrs.keyFieldName, selectList: payload.formAttrs.selectList, paramsRule: payload.formAttrs.paramsRule },
    { keyFieldName: desktopAttrs.keyFieldName, selectList: desktopAttrs.selectList, paramsRule: desktopAttrs.paramsRule }
  ), diff(desktopAttrs.paramsRule, payload.formAttrs.paramsRule));
  assert("attrs 全集与桌面完全一致（键级深度对比）", deepEqual(payload.formAttrs, desktopAttrs), diff(desktopAttrs, payload.formAttrs));
  assert("addExtraData 载荷(externalParams)与桌面 externalParamsFormRow 完全一致", deepEqual(payload.externalParams, desktopExtra), diff(desktopExtra, payload.externalParams));

  // edit 分支一致性（行级入口传行数据）
  await dt.handleBtnClick({ ...BTN_FORM.extraOption, btnType: "edit", relateFrom: "formA" }, ROWS[1]);
  const desktopEditAttrs = dt.getExternalCompBaseAttrs();
  const desktopEditExtra = dt.externalParamsFormRow;
  await mtDirect.executeButton({ ...BTN_FORM.extraOption, btnType: "edit", relateFrom: "formA" }, ROWS[1]);
  const editPayload = JSON.parse(sessionStorage.getItem(MODAL_PARAMS_KEY));
  assert("edit 分支 attrs 全集与桌面完全一致", deepEqual(editPayload.formAttrs, desktopEditAttrs), diff(desktopEditAttrs, editPayload.formAttrs));
  assert("edit 分支 addExtraData 载荷与桌面完全一致", deepEqual(editPayload.externalParams, desktopEditExtra), diff(desktopEditExtra, editPayload.externalParams));
  assert("edit 跳转 query 回填主键与只读标识", mobilePushes[1]?.query.primaryKeyValue === 6 && mobilePushes[1]?.query.onlyRead === 0, JSON.stringify(mobilePushes[1]?.query));
  const editQuery = mobilePushes[1].query;

  console.log("== B. 宿主路由页真实 SFC 编译挂载（lowcodeModal.vue） ==");
  // 用宿主 node_modules 的 vue-template-compiler + @babel 编译真实 SFC
  const compiler = require(`${HOST}/node_modules/vue-template-compiler`);
  const babel = require(`${HOST}/node_modules/@babel/core`);
  const commonjsPlugin = require(`${HOST}/node_modules/@babel/plugin-transform-modules-commonjs`);
  const sfcPath = `${HOST}/src/CommonDPh5/pages/commonRender/lowcodeModal.vue`;
  const sfc = compiler.parseComponent(fs.readFileSync(sfcPath, "utf8"));
  const tpl = compiler.compile(sfc.template.content);
  assert("宿主 SFC 模板编译无错误", !tpl.errors?.length, JSON.stringify(tpl.errors));
  const scriptCode = babel.transformSync(sfc.script.content, {
    configFile: false,
    babelrc: false,
    filename: "lowcodeModal.vue",
    plugins: [commonjsPlugin]
  }).code;

  // 子组件桩：记录 VFormRender/tableRender 收到的 props/attrs/事件与调用
  const formRecords = [];
  const VFormRenderStub = {
    name: "VFormRenderStub",
    props: { formId: String, primaryKeyValue: String, isDisabled: Boolean, hasSubmit: Boolean },
    template: '<div class="vfr-stub"></div>',
    mounted() {
      this.extraDataCalls = [];
      this.submitCalls = [];
      formRecords.push(this);
    },
    methods: {
      addExtraData(data) {
        this.extraDataCalls.push(JSON.parse(JSON.stringify(data)));
      },
      submitForm(...args) {
        this.submitCalls.push(args);
      },
      setFormData() {}
    }
  };
  const tableRecords = [];
  const TableRenderStub = {
    name: "TableRenderStub",
    props: { renderType: String, relateId: String, rawRelateId: String, externalParams: Object, options: Object, dynamicExternalParams: Object },
    template: "<div class='tr-stub'></div>",
    mounted() {
      tableRecords.push(this);
    }
  };
  const NavStub = { template: '<div class="nav-stub"><slot /></div>' };
  const BtnStub = { template: '<button type="button" @click="$emit(\'click\')"><slot /></button>' };

  const importStubs = {
    "@/CommonDP/pages/mainMg/lowcode/component/vFormRender.vue": VFormRenderStub,
    "@/CommonDP/pages/commonRender/components/tableRender.vue": TableRenderStub,
    "@/CommonDP/utils/routeAuth": { checkPermission: () => true },
    vuex: { mapActions: () => ({}), mapState: () => ({}) },
    "@/CommonDP/utils/request": {},
    "@/CommonDP/utils": { generalRequest: () => {} }
  };
  const mod = { exports: {} };
  new Function("require", "module", "exports", scriptCode)(spec => {
    if (!(spec in importStubs)) throw new Error(`联调脚本缺少导入桩: ${spec}`);
    return importStubs[spec];
  }, mod, mod.exports);
  const pageOptions = mod.exports.default || mod.exports;
  const PageComp = Vue.extend({
    ...pageOptions,
    components: { ...(pageOptions.components || {}), "van-nav-bar": NavStub, "van-button": BtnStub },
    render: new Function(tpl.render),
    staticRenderFns: tpl.staticRenderFns.map(fn => new Function(fn))
  });

  const routerBacks = [];
  function mountPage(query) {
    const el = document.createElement("div");
    document.body.appendChild(el);
    Vue.prototype.$route = { query };
    Vue.prototype.$router = { back: () => routerBacks.push(true) };
    const vm = new Vue({ el, render: h => h(PageComp, { ref: "page" }) });
    return vm;
  }

  // ---- B1. add 分支：真实移动跳转载荷挂载宿主页面 ----
  sessionStorage.clear();
  await mtDirect.executeButton({ ...BTN_FORM.extraOption, btnType: "add", relateFrom: "formA", btnId: BTN_FORM.btnId, authorize: "" }, undefined);
  const addPush = mobilePushes[mobilePushes.length - 1];
  const pageVM = mountPage(addPush.query);
  const page = pageVM.$refs.page;
  const form = formRecords[formRecords.length - 1];
  assert("宿主页面挂载后消费并删除 sessionStorage 单槽", sessionStorage.getItem(MODAL_PARAMS_KEY) === null);
  assert("VFormRender props 与桌面弹窗一致(formId/primaryKeyValue/isDisabled/hasSubmit=false)", form.formId === "formA" && form.primaryKeyValue === "" && form.isDisabled === false && form.hasSubmit === false, JSON.stringify({ formId: form.formId, pk: form.primaryKeyValue, dis: form.isDisabled, sub: form.hasSubmit }));
  assert("VFormRender $attrs 与桌面 getExternalCompBaseAttrs 完全一致", deepEqual({ ...form.$attrs }, desktopAttrs), diff(desktopAttrs, { ...form.$attrs }));
  await new Promise(r => setTimeout(r, 350));
  assert("addExtraData 以桌面 externalParamsFormRow 同款载荷注入(300ms 延迟)", form.extraDataCalls.length === 1 && deepEqual(form.extraDataCalls[0], desktopExtra), diff(desktopExtra, form.extraDataCalls[0]));

  // 底部确定/取消 + 提交回刷链路
  const buttons = pageVM.$el.querySelectorAll("button");
  assert("非只读渲染 取消/确定 两个底部按钮", buttons.length === 2, `buttons=${buttons.length}`);
  buttons[1].click();
  assert("确定 → VFormRender.submitForm()", form.submitCalls.length === 1);
  form.$emit("submit", { id: 99 });
  assert("提交成功写回刷标记(lowcodeTablePendingRefresh, listPageId 匹配)", sessionStorage.getItem(PENDING_REFRESH_KEY) === JSON.stringify({ listPageId: "t1" }), sessionStorage.getItem(PENDING_REFRESH_KEY));
  assert("提交成功后路由返回", routerBacks.length === 1);
  pageVM.$destroy();

  // ---- B2. isRefresh=0：提交成功不写回刷标记 ----
  sessionStorage.clear();
  routerBacks.length = 0;
  await mtDirect.executeButton({ ...BTN_FORM.extraOption, btnType: "add", relateFrom: "formA", isRefresh: false, btnId: BTN_FORM.btnId, authorize: "" }, undefined);
  const noRefreshPush = mobilePushes[mobilePushes.length - 1];
  const pageVM2 = mountPage(noRefreshPush.query);
  const form2 = formRecords[formRecords.length - 1];
  form2.$emit("submit", {});
  assert("isRefresh 未配置时提交成功不写回刷标记", sessionStorage.getItem(PENDING_REFRESH_KEY) === null);
  assert("仍路由返回", routerBacks.length === 1);
  pageVM2.$destroy();

  // ---- B3. edit(check 只读)分支：真实 query 挂载 ----
  sessionStorage.clear();
  routerBacks.length = 0;
  await mtDirect.executeButton({ ...BTN_FORM.extraOption, btnType: "check", relateFrom: "formA", btnId: BTN_FORM.btnId, authorize: "" }, ROWS[0]);
  const checkPush = mobilePushes[mobilePushes.length - 1];
  const pageVM3 = mountPage(checkPush.query);
  const form3 = formRecords[formRecords.length - 1];
  assert("check 只读：isDisabled=true 且无确定按钮", form3.isDisabled === true && pageVM3.$el.querySelectorAll("button").length === 0, `buttons=${pageVM3.$el.querySelectorAll("button").length}`);
  const checkPayload = JSON.parse(sessionStorage.getItem(MODAL_PARAMS_KEY) || "null");
  assert("check 挂载即消费单槽(读取并删除)", checkPayload === null);
  pageVM3.$destroy();

  // ---- B4. pageList 分流 ----
  sessionStorage.clear();
  routerBacks.length = 0;
  await mtDirect.executeButton({ ...BTN_TABLE.extraOption, btnId: BTN_TABLE.btnId, authorize: "" }, ROWS[0]);
  const listPush = mobilePushes[mobilePushes.length - 1];
  const listPayload = JSON.parse(sessionStorage.getItem(MODAL_PARAMS_KEY));
  const pageVM4 = mountPage(listPush.query);
  const tableStub = tableRecords[tableRecords.length - 1];
  assert("pageList 分流渲染 tableRender(VFormRender 未渲染)", !!tableStub && formRecords[formRecords.length - 1] === form3);
  assert("tableRender 传参(renderType=list/relateId/rawRelateId=notVerify)", tableStub.renderType === "list" && tableStub.relateId === "tbB" && tableStub.rawRelateId === "notVerify", JSON.stringify({ renderType: tableStub.renderType, relateId: tableStub.relateId, raw: tableStub.rawRelateId }));
  assert("tableRender externalParams = 移动端 useArray 载荷", deepEqual(tableStub.externalParams, listPayload.externalParams), diff(listPayload.externalParams, tableStub.externalParams));
  assert("pageList 无底部按钮", pageVM4.$el.querySelectorAll("button").length === 0);
  pageVM4.$destroy();

  console.log(`\n联调结果: ${passed} 通过, ${failed} 失败`);
  process.exit(failed ? 1 : 0);
})().catch(error => {
  console.error("integration-phase8 执行异常:", error);
  process.exit(1);
});
