/* eslint-disable */
// 第八期冒烟测试:表单/列表专用路由页(openType=0/6 跳转宿主路由页)
// 覆盖:disposeDynamicFormEvent 分支(add/check/edit+校验拦截)/disposeDynamicTableEvent 校验与useArray传参/
//       sessionStorage 业务参数契约/跳转双通道与query序列化/isRefresh+listPageId 回刷契约闭环/executeButton全链路
// 运行:node .zcode/smoke-phase8.js
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
  // 无jsdom时以最小window/document桩跑(跳转fallback测试依赖location行为,该组跳过)
  const listeners = {};
  global.window = {
    navigator: { userAgent: "node" },
    event: undefined,
    setTimeout,
    clearTimeout,
    addEventListener: () => {},
    removeEventListener: () => {},
    getComputedStyle: () => ({ getPropertyValue: () => "" }),
    open: () => {},
    location: { origin: "http://localhost", href: "http://localhost/" }
  };
  const headStub = { appendChild() {}, removeChild() {}, childNodes: [], firstChild: null, insertBefore() {} };
  global.document = {
    head: headStub,
    getElementsByTagName: () => [headStub],
    createElement: () => ({ style: {}, classList: { add() {}, remove() {} }, setAttribute() {}, appendChild() {}, addEventListener() {} }),
    createTextNode: () => ({}),
    documentElement: { style: {} },
    body: { appendChild() {}, removeChild() {} },
    querySelector: sel => (sel === "head" ? headStub : null),
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {}
  };
  global.navigator = global.window.navigator;
  global.getComputedStyle = global.window.getComputedStyle;
  global.location = global.window.location;
} else {
  // 以 commonDph5.html 为入口建 DOM:跳转 fallback 分支的基地址复用当前 pathname,hash 变更同文档可生效
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/commonDph5.html" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.sessionStorage = dom.window.sessionStorage;
  global.IntersectionObserver = class { observe() {} disconnect() {} };
}

const Vue = require("../node_modules/vue/dist/vue.common.dev.js");
Vue.config.productionTip = false;
global.self = global; // UMD产物以self为global挂载点
const ElementUI = require("../node_modules/element-ui/lib/element-ui.common.js");
Vue.use(ElementUI);

// 加载构建产物(UMD, 自带全部依赖)
const MobileTable = require("../lib/mobileTable.js");
const Comp = MobileTable.default || MobileTable;

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

function mount(provides = {}) {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const provide = {
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
    ...provides
  };
  return new Vue({
    el,
    provide,
    render: h => h(Comp, { props: { listPageIdProp: "t1" }, ref: "mt" })
  });
}

// 挂载后准备运行态(绕过init):记录提示/跳转、装路由桩
function prepare(vm, { resolveRoute = true } = {}) {
  const mt = vm.$refs.mt;
  mt.previewMode = false;
  mt.tableDisbaled = false;
  mt.keyField = "id";
  const state = { tips: [], pushes: [] };
  mt.showTip = msg => state.tips.push(msg);
  mt.$router = { push: loc => state.pushes.push(loc) };
  if (resolveRoute) mt.$router.resolve = () => ({ route: { matched: [{}] } });
  else mt.$router.resolve = () => ({ route: { matched: [] } });
  return { mt, state };
}

const PARAMS_KEY = "lowcodeTableModalPageParams";

(async () => {
  console.log("== 1. 动态表单 openType=0:disposeDynamicFormEvent ==");
  {
    // add 分支:标题默认"新增"、无主键、onlyRead=0、业务参数写 sessionStorage
    sessionStorage && sessionStorage.clear && sessionStorage.clear();
    const vm = mount();
    const { mt, state } = prepare(vm);
    mt.disposeDynamicFormEvent({ btnType: "add", relateFrom: "form1" }, undefined);
    const push = state.pushes[0];
    assert("add 跳转 /lowcodeModal(renderType=form)", push?.path === "/lowcodeModal" && push.query.renderType === "form" && push.query.id === "form1", JSON.stringify(push));
    assert("add 标题默认'新增'且只读关闭", push.query.title === "新增" && push.query.onlyRead === 0, JSON.stringify(push.query));
    assert("query 携带 btnType(路由页组装 dlgFormConfig 用)", push.query.btnType === "add", JSON.stringify(push.query));
    assert("add 不携带 primaryKeyValue(空标识不入 query)", !("primaryKeyValue" in push.query), JSON.stringify(push.query));
    const raw = JSON.parse(sessionStorage.getItem(PARAMS_KEY) || "null");
    assert("业务参数写入 sessionStorage(externalParams 空对象也写入)", raw && typeof raw.externalParams === "object", sessionStorage.getItem(PARAMS_KEY));
    assert("formAttrs 载荷携带桌面同款 attrs(callingFrom/dlgFormConfig)", raw.formAttrs && raw.formAttrs.callingFrom === "dynatic-table" && raw.formAttrs.dlgFormConfig && raw.formAttrs.dlgFormConfig.formId === "form1" && raw.formAttrs.dlgFormConfig.dialogTitle === "新增", JSON.stringify(raw.formAttrs && raw.formAttrs.dlgFormConfig));
    vm.$destroy();
  }
  {
    // dialogTitle 覆盖默认标题
    const vm = mount();
    const { mt, state } = prepare(vm);
    mt.disposeDynamicFormEvent({ btnType: "add", relateFrom: "form1", dialogTitle: "自定义标题" }, undefined);
    assert("dialogTitle 优先于默认标题", state.pushes[0]?.query.title === "自定义标题", JSON.stringify(state.pushes[0]));
    vm.$destroy();
  }
  {
    // check:主键取自行数据、onlyRead=1、标题默认"查看"
    const vm = mount();
    const { mt, state } = prepare(vm);
    mt.disposeDynamicFormEvent({ btnType: "check", relateFrom: "form1" }, { id: 42, name: "a" });
    const push = state.pushes[0];
    assert("check 主键回填 primaryKeyValue", push?.query.primaryKeyValue === 42 && push.query.onlyRead === 1 && push.query.title === "查看", JSON.stringify(push?.query));
    vm.$destroy();
  }
  {
    // edit:无行数据回退勾选/当前行(getFirstSelectedData)、onlyRead=0、标题默认"编辑"
    const vm = mount();
    const { mt, state } = prepare(vm);
    mt.currentSelectedRow = { id: 7 };
    mt.disposeDynamicFormEvent({ btnType: "edit", relateFrom: "form1" }, undefined);
    const push = state.pushes[0];
    assert("edit 回退当前行取主键且非只读", push?.query.primaryKeyValue === 7 && push.query.onlyRead === 0 && push.query.title === "编辑", JSON.stringify(push?.query));
    vm.$destroy();
  }
  {
    // check/edit 无行无勾选:提示且不跳转(与桌面文案一致)
    const vm = mount();
    const { mt, state } = prepare(vm);
    mt.disposeDynamicFormEvent({ btnType: "edit", relateFrom: "form1" }, undefined);
    assert("无行数据无勾选提示'请至少勾选一条要处理的数据！'不跳转", state.tips[0] === "请至少勾选一条要处理的数据！" && state.pushes.length === 0, JSON.stringify(state.tips));
    vm.$destroy();
  }
  {
    // 主键无值:提示且不跳转
    const vm = mount();
    const { mt, state } = prepare(vm);
    mt.disposeDynamicFormEvent({ btnType: "check", relateFrom: "form1" }, { name: "x" });
    assert("主键未取到值提示且不跳转", state.tips[0] === "主键字段未取到值，请检查数据或在列表设计页面重新关联主键！" && state.pushes.length === 0, JSON.stringify(state.tips));
    vm.$destroy();
  }
  {
    // 未知 btnType:对齐桌面 default: break,不跳转不提示
    const vm = mount();
    const { mt, state } = prepare(vm);
    mt.disposeDynamicFormEvent({ btnType: "whatever", relateFrom: "form1" }, { id: 1 });
    assert("未知btnType不跳转不提示(桌面default分支语义)", state.pushes.length === 0 && state.tips.length === 0, JSON.stringify(state));
    vm.$destroy();
  }

  console.log("== 2. 表单 externalParams 默认口径 + isRefresh 透传 ==");
  {
    // default 模式:行数据优先、deliverySelectListFields 映射 + 主键必穿(桌面 externalParamsFormRow 同口径)
    const vm = mount();
    const { mt, state } = prepare(vm);
    mt.disposeDynamicFormEvent(
      { btnType: "add", relateFrom: "form1", deliverySelectList: true, deliverySelectListFields: ["name", { fieldCode: "dept", renamed: "deptName" }] },
      { id: 5, name: "张三", dept: "研发" }
    );
    const raw = JSON.parse(sessionStorage.getItem(PARAMS_KEY));
    assert("externalParams 默认口径(行数据单行形状+renamed映射)", raw.externalParams.name === "张三" && raw.externalParams.deptName === "研发", JSON.stringify(raw));
    assert("deliverySelectListFields 未含主键时主键必穿", raw.externalParams.id === 5, JSON.stringify(raw));
    assert("isRefresh 未配置为 0", state.pushes[0]?.query.isRefresh === 0, JSON.stringify(state.pushes[0]?.query));
    vm.$destroy();
  }
  {
    // btnConfigs.isRefresh 透传到 query(路由页提交成功后据此写回刷标记)
    const vm = mount();
    const { mt, state } = prepare(vm);
    mt.btnConfigs = { btnDisposeParamsRule: {}, isRefresh: true };
    mt.disposeDynamicFormEvent({ btnType: "add", relateFrom: "form1" }, undefined);
    assert("btnConfigs.isRefresh 透传 query.isRefresh=1", state.pushes[0]?.query.isRefresh === 1, JSON.stringify(state.pushes[0]?.query));
    assert("query 携带 listPageId(回刷标记匹配用)", state.pushes[0]?.query.listPageId === "t1", JSON.stringify(state.pushes[0]?.query));
    vm.$destroy();
  }

  console.log("== 3. 动态列表 openType=6:disposeDynamicTableEvent ==");
  {
    // check 无行无勾选:提示不跳转
    const vm = mount();
    const { mt, state } = prepare(vm);
    mt.disposeDynamicTableEvent({ btnType: "check", relateTable: "tb1" }, undefined);
    assert("check 无行数据无勾选提示且不跳转", state.tips[0] === "请至少勾选一条要处理的数据！" && state.pushes.length === 0, JSON.stringify(state.tips));
    vm.$destroy();
  }
  {
    // 带行跳转:renderType=pageList、id=tableId、标题默认"编辑"、无表单专有标识
    const vm = mount();
    const { mt, state } = prepare(vm);
    mt.disposeDynamicTableEvent({ btnType: "edit", relateTable: "tb1" }, { id: 3 });
    const push = state.pushes[0];
    assert("跳转 renderType=pageList(id=tableId,标题默认'编辑')", push?.path === "/lowcodeModal" && push.query.renderType === "pageList" && push.query.id === "tb1" && push.query.title === "编辑", JSON.stringify(push));
    assert("pageList 不携带表单专有标识(primaryKeyValue/onlyRead/isRefresh/btnType)", !("primaryKeyValue" in push.query) && !("onlyRead" in push.query) && !("isRefresh" in push.query) && !("btnType" in push.query), JSON.stringify(push.query));
    vm.$destroy();
  }
  {
    // 非 check/edit btnType 不校验直接跳(桌面同:仅 check/edit 校验)
    const vm = mount();
    const { mt, state } = prepare(vm);
    mt.disposeDynamicTableEvent({ btnType: "add", relateTable: "tb1", dialogTitle: "明细" }, undefined);
    assert("非check/edit不校验直接跳(dialogTitle生效)", state.pushes[0]?.query.title === "明细" && state.pushes.length === 1, JSON.stringify(state.pushes[0]));
    vm.$destroy();
  }
  {
    // useArray 口径:数组形状 + 主键必穿 keyFieldArray(对齐桌面 disposeDynamicTableEvent)
    const vm = mount();
    const { mt } = prepare(vm);
    mt.selectList = [
      { id: 1, name: "a" },
      { id: 2, name: "b" }
    ];
    mt.disposeDynamicTableEvent(
      { btnType: "check", relateTable: "tb1", deliverySelectList: true, deliverySelectListFields: ["name"] },
      undefined
    );
    const raw = JSON.parse(sessionStorage.getItem(PARAMS_KEY));
    assert("externalParams useArray 口径(勾选集合数组形状)", JSON.stringify(raw.externalParams.nameArray) === '["a","b"]', JSON.stringify(raw));
    assert("主键必穿 idArray", JSON.stringify(raw.externalParams.idArray) === "[1,2]", JSON.stringify(raw));
    assert("列表跳转不带 formAttrs(桌面嵌套列表不传 attrs)", !("formAttrs" in raw), JSON.stringify(Object.keys(raw)));
    vm.$destroy();
  }

  console.log("== 4. 跳转双通道与 query 序列化 ==");
  {
    // router 未注册目标路由:回退 location.href 拼 H5 基地址(仅 jsdom 环境可断言 hash 变更)
    const vm = mount();
    const { mt } = prepare(vm, { resolveRoute: false });
    mt.disposeDynamicFormEvent({ btnType: "check", relateFrom: "f1" }, { id: 9 });
    if (HAS_JSDOM) {
      const hash = window.location.hash;
      assert("router未注册回退location.href(基地址+hash路由)", hash.startsWith("#/lowcodeModal?") && hash.includes("renderType=form") && hash.includes("primaryKeyValue=9"), hash);
    } else {
      assert("router未注册回退分支跳过(无jsdom)", true);
    }
    vm.$destroy();
  }
  {
    // 重复跳转覆盖 sessionStorage(单槽契约:路由页挂载读取并删除)
    const vm = mount();
    const { mt, state } = prepare(vm);
    mt.disposeDynamicFormEvent({ btnType: "add", relateFrom: "f1" }, undefined);
    mt.disposeDynamicFormEvent({ btnType: "add", relateFrom: "f2" }, undefined);
    const push = state.pushes[1];
    assert("重复跳转 query 取最新一次 id", push?.query.id === "f2" && state.pushes.length === 2, JSON.stringify(push));
    vm.$destroy();
  }

  console.log("== 5. 经共享 executeButton 全链路 ==");
  {
    // openType=0 + btnType=add:FAB 入口 → executeButton → disposeDynamicFormEvent
    const vm = mount();
    const { mt, state } = prepare(vm);
    mt.formOptions = [
      { btnId: 1, authorize: "", tagAttrs: { value: "新增" }, extraOption: { openType: 0, btnType: "add", relateFrom: "form9", isRefresh: true } }
    ];
    mt.tableConfigJSON = [{ fieldCode: "id", fieldName: "ID", show: true }];
    mt.composeBtnList();
    assert("add 类按钮投放 FAB 入口", mt.btnPlacement.fab.length === 1, JSON.stringify(mt.btnPlacement.fab.length));
    await mt.handleEntryBtnClick(mt.btnPlacement.fab[0]);
    await new Promise(r => setTimeout(r, 50));
    const push = state.pushes[0];
    assert("FAB入口经executeButton闭环跳转表单路由页", push?.path === "/lowcodeModal" && push.query.renderType === "form" && push.query.id === "form9" && push.query.title === "新增", JSON.stringify(push));
    assert("executeButton 的 isRefresh 配置透传到 query", push?.query.isRefresh === 1, JSON.stringify(push?.query));
    vm.$destroy();
  }
  {
    // openType=6 + btnType=check:行级入口无行数据被"请至少勾选"拦截
    const vm = mount();
    const { mt, state } = prepare(vm);
    mt.formOptions = [
      { btnId: 2, authorize: "", tagAttrs: { value: "查看明细" }, extraOption: { openType: 6, btnType: "check", relateTable: "tb9" } }
    ];
    mt.tableConfigJSON = [{ fieldCode: "id", fieldName: "ID", show: true }];
    mt.composeBtnList();
    assert("check 类按钮投放行级入口", mt.btnPlacement.row.length === 1, JSON.stringify(mt.btnPlacement.row.length));
    await mt.handleEntryBtnClick(mt.btnPlacement.row[0]);
    await new Promise(r => setTimeout(r, 50));
    assert("无行数据无勾选被拦截提示不跳转", state.tips[0] === "请至少勾选一条要处理的数据！" && state.pushes.length === 0, JSON.stringify(state.tips));
    vm.$destroy();
  }
  {
    // 行级入口传行数据:直接以该行跳转(不再要求勾选)
    const vm = mount();
    const { mt, state } = prepare(vm);
    mt.formOptions = [
      { btnId: 2, authorize: "", tagAttrs: { value: "编辑明细" }, extraOption: { openType: 0, btnType: "edit", relateFrom: "form9" } }
    ];
    mt.tableConfigJSON = [{ fieldCode: "id", fieldName: "ID", show: true }];
    mt.composeBtnList();
    await mt.handleEntryBtnClick(mt.btnPlacement.row[0], { id: 66 });
    await new Promise(r => setTimeout(r, 50));
    const push = state.pushes[0];
    assert("行级入口传行数据直达(主键回填+标题'编辑')", push?.query.primaryKeyValue === 66 && push.query.title === "编辑", JSON.stringify(push?.query));
    vm.$destroy();
  }

  console.log("== 6. isRefresh 返回回刷契约闭环(路由页提交成功后写标记) ==");
  {
    // 模拟宿主路由页:按 query.listPageId 写第七期回刷标记 → 列表 activated 消费 loadFirst
    sessionStorage && sessionStorage.clear && sessionStorage.clear();
    const vm = mount();
    const { mt, state } = prepare(vm);
    mt.btnConfigs = { btnDisposeParamsRule: {}, isRefresh: true };
    mt.disposeDynamicFormEvent({ btnType: "add", relateFrom: "f1" }, undefined);
    const query = state.pushes[0].query;
    // 路由页提交成功行为(契约):isRefresh=1 时写 lowcodeTablePendingRefresh={listPageId}
    if (query.isRefresh) {
      sessionStorage.setItem("lowcodeTablePendingRefresh", JSON.stringify({ listPageId: query.listPageId }));
    }
    let refreshed = 0;
    mt.loadFirst = async () => refreshed++;
    const hooks = mt.$options.activated || [];
    (Array.isArray(hooks) ? hooks : [hooks]).forEach(fn => fn.call(mt));
    await new Promise(r => setTimeout(r, 20));
    assert("路由页提交标记后列表返回即重查(契约闭环)", refreshed === 1, `refreshed=${refreshed}`);
    assert("标记消费后清理", sessionStorage.getItem("lowcodeTablePendingRefresh") === null);
    vm.$destroy();
  }

  console.log(`\n结果: ${passed} 通过, ${failed} 失败`);
  process.exit(failed ? 1 : 0);
})().catch(error => {
  console.error("smoke-phase8 执行异常:", error);
  process.exit(1);
});
