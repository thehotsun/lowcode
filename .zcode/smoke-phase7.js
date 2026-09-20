/* eslint-disable */
// 第七期冒烟测试:流程跳转(openType=2) + isRefresh 返回回刷 + 批量删除闭环(batchDel)
// 运行:node .zcode/smoke-phase7.js
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

// 挂载后准备运行态(绕过init):记录提示与重查、装跳转路由桩
function prepare(vm, { generalRequest, queryFlowDef, requestBatchDel, isCurrentApprover, resolveRoute = true } = {}) {
  const mt = vm.$refs.mt;
  mt.previewMode = false;
  mt.tableDisbaled = false;
  mt.keyField = "id";
  const state = { tips: [], successes: [], refreshes: 0, pushes: [], requests: [] };
  mt.showTip = msg => state.tips.push(msg);
  mt.showSuccess = msg => state.successes.push(msg);
  mt.loadFirst = async () => state.refreshes++;
  if (generalRequest) {
    mt.generalRequest = (...args) => {
      state.requests.push(["generalRequest", ...args]);
      return generalRequest(...args);
    };
  }
  if (queryFlowDef) {
    mt.queryFlowDef = (...args) => {
      state.requests.push(["queryFlowDef", ...args]);
      return queryFlowDef(...args);
    };
  }
  if (requestBatchDel) {
    mt.requestBatchDel = (...args) => {
      state.requests.push(["requestBatchDel", ...args]);
      return requestBatchDel(...args);
    };
  }
  if (isCurrentApprover) {
    mt.isCurrentApprover = (...args) => {
      state.requests.push(["isCurrentApprover", ...args]);
      return isCurrentApprover(...args);
    };
  }
  const router = { push: loc => state.pushes.push(loc) };
  if (resolveRoute) router.resolve = () => ({ route: { matched: [{}] } });
  else router.resolve = () => ({ route: { matched: [] } });
  mt.$router = router;
  return { mt, state };
}

const flowInstance = ok => (ok ? { result: "0", data: { flowInstanceId: "fi1", currentVersionId: "cv1", businessId: "b1" } } : { result: "0", data: null });

(async () => {
  console.log("== 1. 流程跳转 openType=2:check 分支 ==");
  {
    const vm = mount();
    const { mt, state } = prepare(vm, { generalRequest: () => Promise.resolve(flowInstance(true)) });
    await mt.disposeFlowEvent({ flowKey: "k", btnType: "check", isRefresh: false }, { id: 9 });
    assert("check 先查流程实例 /flow/business/{主键值}", state.requests.some(r => r[0] === "generalRequest" && r[1] === "/flow/business/9"), JSON.stringify(state.requests));
    const push = state.pushes[0];
    assert("check 跳转 flowH5Summary(approveType=view,样例URL参数白名单)", push && push.path === "/flowH5Summary" && push.query.approveType === "view" && push.query.flowInstanceId === "fi1" && push.query.currentVersionId === "cv1" && push.query.businessId === "b1", JSON.stringify(push));
    assert("跳转补全 enterpriseId/isProject", push.query.enterpriseId === "ent1" && push.query.isProject === 0, JSON.stringify(push.query));
    vm.$destroy();
  }
  {
    // 无勾选/当前行:主键取不到提示不跳转
    const vm = mount();
    const { mt, state } = prepare(vm, { generalRequest: () => Promise.resolve(flowInstance(true)) });
    await mt.disposeFlowEvent({ flowKey: "k", btnType: "check" }, undefined);
    assert("check 无行数据无勾选提示且不跳转", state.tips[0] === "请至少勾选一条要处理的数据！" && state.pushes.length === 0, JSON.stringify(state.tips));
    vm.$destroy();
  }
  {
    // 无勾选回退当前行(currentSelectedRow)
    const vm = mount();
    const { mt, state } = prepare(vm, { generalRequest: () => Promise.resolve(flowInstance(true)) });
    mt.currentSelectedRow = { id: 7 };
    assert("getFirstSelectedData 无勾选回退当前行", mt.getFirstSelectedData()?.id === 7);
    await mt.disposeFlowEvent({ flowKey: "k", btnType: "check" }, undefined);
    assert("check 回退当前行查其实例", state.requests.some(r => r[1] === "/flow/business/7") && state.pushes[0]?.query.businessId === "b1", JSON.stringify(state.requests));
    vm.$destroy();
  }
  {
    // 实例无数据 / 草稿态
    const vm = mount();
    const { mt, state } = prepare(vm, { generalRequest: () => Promise.resolve(flowInstance(false)) });
    await mt.disposeFlowEvent({ flowKey: "k", btnType: "check" }, { id: 1 });
    assert("实例无数据提示不跳转", state.tips[0] === "未能获取流程详情！" && state.pushes.length === 0, JSON.stringify(state.tips));
    vm.$destroy();
  }
  {
    const vm = mount();
    const { mt, state } = prepare(vm, { generalRequest: () => Promise.resolve({ result: "0", data: { currentVersionId: "cv" } }) });
    await mt.disposeFlowEvent({ flowKey: "k", btnType: "check" }, { id: 1 });
    assert("草稿态(无flowInstanceId)提示不跳转", state.tips[0] === "草稿状态的流程不能查看！" && state.pushes.length === 0, JSON.stringify(state.tips));
    vm.$destroy();
  }

  console.log("== 2. 流程跳转 openType=2:发起/审批分支 ==");
  {
    const vm = mount();
    const { mt, state } = prepare(vm, { queryFlowDef: () => Promise.resolve({ result: "0", data: { currentVersionId: "cv2", flowKey: "fk2", startMode: "normal" } }) });
    await mt.disposeFlowEvent({ flowKey: "k2", btnType: "custom" }, undefined);
    const push = state.pushes[0];
    assert("发起/审批经queryFlowDef查定义(approveType=add)", state.requests.some(r => r[0] === "queryFlowDef") && push?.path === "/flowH5Summary" && push.query.approveType === "add", JSON.stringify(push));
    assert("flowKey定义返回值优先、按钮配置兜底", push.query.flowKey === "fk2", JSON.stringify(push.query));
    vm.$destroy();
  }
  {
    // stdNew:桌面新窗口 /examine-new 的 H5 等价入口
    const vm = mount();
    const { mt, state } = prepare(vm, { queryFlowDef: () => Promise.resolve({ result: "0", data: { currentVersionId: "cv2", startMode: "stdNew" } }) });
    await mt.disposeFlowEvent({ flowKey: "k2", btnType: "custom" }, undefined);
    assert("stdNew发起走 #/examine-new", state.pushes[0]?.path === "/examine-new" && state.pushes[0]?.query.flowKey === "k2", JSON.stringify(state.pushes[0]));
    vm.$destroy();
  }
  {
    const vm = mount();
    const { mt, state } = prepare(vm, { queryFlowDef: () => Promise.resolve({ result: "1", data: null }) });
    await mt.disposeFlowEvent({ flowKey: "k2", btnType: "custom" }, undefined);
    assert("定义无数据提示不跳转", state.tips[0] === "未能获取流程定义！" && state.pushes.length === 0, JSON.stringify(state.tips));
    vm.$destroy();
  }

  console.log("== 3. 跳转双通道 ==");
  {
    // router 未注册目标路由:回退 location.href 拼 H5 基地址(仅 jsdom 环境可断言 hash 变更)
    const vm = mount();
    const { mt } = prepare(vm, { generalRequest: () => Promise.resolve(flowInstance(true)), resolveRoute: false });
    await mt.disposeFlowEvent({ flowKey: "k", btnType: "check" }, { id: 3 });
    if (HAS_JSDOM) {
      const hash = window.location.hash;
      assert("router未注册回退location.href(基地址+hash路由)", hash.startsWith("#/flowH5Summary?") && hash.includes("approveType=view") && hash.includes("enterpriseId=ent1"), hash);
    } else {
      assert("router未注册回退分支跳过(无jsdom)", true);
    }
    vm.$destroy();
  }

  console.log("== 4. isRefresh 返回回刷 ==");
  sessionStorage && sessionStorage.clear && sessionStorage.clear();
  {
    // 跳转前记标记;keep-alive 返回:activated 消费并 loadFirst
    const vm = mount();
    const { mt, state } = prepare(vm, { generalRequest: () => Promise.resolve(flowInstance(true)) });
    await mt.disposeFlowEvent({ flowKey: "k", btnType: "check", isRefresh: true }, { id: 9 });
    const raw = sessionStorage.getItem("lowcodeTablePendingRefresh");
    assert("isRefresh跳转前写入回刷标记(含listPageId)", raw && JSON.parse(raw).listPageId === "t1", raw);
    const hooks = mt.$options.activated || [];
    (Array.isArray(hooks) ? hooks : [hooks]).forEach(fn => fn.call(mt));
    await new Promise(r => setTimeout(r, 20));
    assert("activated消费标记并回第一页重查", state.refreshes === 1 && sessionStorage.getItem("lowcodeTablePendingRefresh") === null, `refreshes=${state.refreshes}`);
    vm.$destroy();
  }
  {
    // 独立验证 activated -> loadFirst 与标记清理
    sessionStorage.setItem("lowcodeTablePendingRefresh", JSON.stringify({ listPageId: "t1" }));
    const vm = mount();
    const { mt, state } = prepare(vm, {});
    const hooks = mt.$options.activated || [];
    (Array.isArray(hooks) ? hooks : [hooks]).forEach(fn => fn.call(mt));
    await new Promise(r => setTimeout(r, 20));
    assert("activated触发loadFirst", state.refreshes === 1, `refreshes=${state.refreshes}`);
    assert("标记消费后清理", sessionStorage.getItem("lowcodeTablePendingRefresh") === null);
    // 再次激活不重复刷新
    (Array.isArray(hooks) ? hooks : [hooks]).forEach(fn => fn.call(mt));
    await new Promise(r => setTimeout(r, 20));
    assert("无标记再次激活不重查", state.refreshes === 1, `refreshes=${state.refreshes}`);
    vm.$destroy();
  }
  {
    // 非本列表标记不误刷
    sessionStorage.setItem("lowcodeTablePendingRefresh", JSON.stringify({ listPageId: "other" }));
    const vm = mount();
    const { mt, state } = prepare(vm, {});
    const hooks = mt.$options.activated || [];
    (Array.isArray(hooks) ? hooks : [hooks]).forEach(fn => fn.call(mt));
    await new Promise(r => setTimeout(r, 20));
    assert("其他listPageId标记不触发重查且保留", state.refreshes === 0 && sessionStorage.getItem("lowcodeTablePendingRefresh") !== null, `refreshes=${state.refreshes}`);
    vm.$destroy();
  }
  {
    // 非 keep-alive 重挂载:init 首查即回刷并清理标记
    sessionStorage.setItem("lowcodeTablePendingRefresh", JSON.stringify({ listPageId: "t1" }));
    const vm = mount();
    const mt = vm.$refs.mt;
    let refreshed = 0;
    mt.loadFirst = async () => refreshed++;
    await mt.init(false, { pageLayout: "table", keyField: "id", tableOptions: [], formOptions: [], tableAttrs: {}, mobileAttrs: {} }, {});
    assert("init首查执行(即回刷本身)", refreshed === 1, `refreshed=${refreshed}`);
    assert("init消费清理标记防重复刷新", sessionStorage.getItem("lowcodeTablePendingRefresh") === null);
    vm.$destroy();
  }

  console.log("== 5. 批量删除闭环 batchDel ==");
  {
    // 行级入口直删
    const vm = mount();
    const { mt, state } = prepare(vm, { requestBatchDel: () => Promise.resolve({ result: "0" }) });
    await mt.disposeDel({ id: 5, name: "a" });
    await new Promise(r => setTimeout(r, 20));
    assert("行数据直删:requestBatchDel([id], listPageId)", state.requests.some(r => r[0] === "requestBatchDel" && JSON.stringify(r[1]) === "[5]" && r[2] === "t1"), JSON.stringify(state.requests));
    assert("删除成功提示并重查", state.successes[0] === "删除成功" && state.refreshes === 1, `success=${state.successes} refreshes=${state.refreshes}`);
    vm.$destroy();
  }
  {
    // 勾选集合批量删
    const vm = mount();
    const { mt, state } = prepare(vm, { requestBatchDel: () => Promise.resolve({ result: "0" }) });
    mt.tableData = [
      { id: 1, name: "a" },
      { id: 2, name: "b" }
    ];
    mt.selectList = mt.tableData;
    await mt.disposeDel();
    await new Promise(r => setTimeout(r, 20));
    assert("无行数据按勾选集合删除(id列表映射)", state.requests.some(r => r[0] === "requestBatchDel" && JSON.stringify(r[1]) === "[1,2]"), JSON.stringify(state.requests));
    vm.$destroy();
  }
  {
    // 无勾选(且无当前行)拦截
    const vm = mount();
    const { mt, state } = prepare(vm, { requestBatchDel: () => Promise.resolve({ result: "0" }) });
    mt.tableData = [{ id: 1 }];
    mt.selectList = [];
    await mt.disposeDel();
    assert("无勾选提示不执行", state.tips[0] === "请至少勾选一条要处理的数据" && state.requests.length === 0, JSON.stringify(state.tips));
    vm.$destroy();
  }
  {
    // 主键取不到值拦截
    const vm = mount();
    const { mt, state } = prepare(vm, { requestBatchDel: () => Promise.resolve({ result: "0" }) });
    mt.tableData = [{ name: "x" }];
    mt.selectList = [{ name: "x" }];
    await mt.disposeDel();
    assert("主键未取到值提示不执行", state.tips[0] === "主键字段未取到值，请检查数据或重新在列表设计页面重新关联主键！" && state.requests.length === 0, JSON.stringify(state.tips));
    vm.$destroy();
  }
  {
    // 失败:提示可重试、不重查
    const vm = mount();
    const { mt, state } = prepare(vm, { requestBatchDel: () => Promise.resolve({ result: "1", message: "busy" }) });
    await mt.disposeDel({ id: 5 });
    await new Promise(r => setTimeout(r, 20));
    assert("删除失败提示且不重查", state.tips[0] === "删除失败，请重试" && state.refreshes === 0, `tips=${state.tips} refreshes=${state.refreshes}`);
    vm.$destroy();
  }
  {
    // 经共享executeButton全链路:批量栏按钮(openType=-1 batchDel)入口点击
    const vm = mount();
    const { mt, state } = prepare(vm, { requestBatchDel: () => Promise.resolve({ result: "0" }) });
    mt.formOptions = [
      { btnId: 3, authorize: "", tagAttrs: { value: "批量删除" }, extraOption: { openType: -1, btnType: "batchDel" } }
    ];
    mt.tableConfigJSON = [{ fieldCode: "id", fieldName: "ID", show: true }];
    mt.composeBtnList();
    mt.tableAttrs = { ...mt.tableAttrs, isShowCheckbox: true };
    mt.tableData = [{ id: 8, name: "a" }];
    mt.selectList = [mt.tableData[0]];
    await mt.handleEntryBtnClick(mt.btnPlacement.batch[0]);
    await new Promise(r => setTimeout(r, 50));
    assert("批量栏batchDel按钮经executeButton闭环删除+重查", state.requests.some(r => r[0] === "requestBatchDel" && JSON.stringify(r[1]) === "[8]") && state.refreshes === 1 && state.successes[0] === "删除成功", JSON.stringify({ req: state.requests, refreshes: state.refreshes }));
    vm.$destroy();
  }

  console.log("== 6. 编辑流程(edit)分支对齐(main合并a8311cb) ==");
  {
    // edit + 审批中(flowStatus==2) + 当前人是审批人 -> approveType=edit
    const vm = mount();
    const { mt, state } = prepare(vm, {
      generalRequest: () => Promise.resolve(flowInstance(true)),
      isCurrentApprover: () => Promise.resolve({ result: "0", data: true })
    });
    await mt.disposeFlowEvent({ flowKey: "k", btnType: "edit", isRefresh: false }, { id: 4, flowStatus: "2" });
    assert("edit走实例分支(查/flow/business/{主键值})", state.requests.some(r => r[0] === "generalRequest" && r[1] === "/flow/business/4"), JSON.stringify(state.requests));
    assert("审批中调isCurrentApprover(传flowInstanceId)", state.requests.some(r => r[0] === "isCurrentApprover" && r[1] === "fi1"), JSON.stringify(state.requests));
    assert("当前人为审批人以审批模式跳转(approveType=edit)", state.pushes[0]?.path === "/flowH5Summary" && state.pushes[0]?.query.approveType === "edit", JSON.stringify(state.pushes[0]));
    vm.$destroy();
  }
  {
    // edit + 审批中 + 非当前审批人 -> 维持 view
    const vm = mount();
    const { mt, state } = prepare(vm, {
      generalRequest: () => Promise.resolve(flowInstance(true)),
      isCurrentApprover: () => Promise.resolve({ result: "0", data: false })
    });
    await mt.disposeFlowEvent({ flowKey: "k", btnType: "edit" }, { id: 4, flowStatus: 2 });
    assert("非当前审批人维持view", state.pushes[0]?.query.approveType === "view" && state.requests.some(r => r[0] === "isCurrentApprover"), JSON.stringify(state.pushes[0]));
    vm.$destroy();
  }
  {
    // edit + 流程非审批中 -> 不查审批人、维持 view
    const vm = mount();
    const { mt, state } = prepare(vm, {
      generalRequest: () => Promise.resolve(flowInstance(true)),
      isCurrentApprover: () => Promise.resolve({ result: "0", data: true })
    });
    await mt.disposeFlowEvent({ flowKey: "k", btnType: "edit" }, { id: 4, flowStatus: "1" });
    assert("非审批中不调isCurrentApprover且维持view", !state.requests.some(r => r[0] === "isCurrentApprover") && state.pushes[0]?.query.approveType === "view", JSON.stringify(state.requests));
    vm.$destroy();
  }
  {
    // edit 草稿态提示语区分"编辑"
    const vm = mount();
    const { mt, state } = prepare(vm, { generalRequest: () => Promise.resolve({ result: "0", data: { currentVersionId: "cv" } }) });
    await mt.disposeFlowEvent({ flowKey: "k", btnType: "edit" }, { id: 4, flowStatus: "2" });
    assert("edit草稿态提示'不能编辑'不跳转", state.tips[0] === "草稿状态的流程不能编辑！" && state.pushes.length === 0, JSON.stringify(state.tips));
    vm.$destroy();
  }
  {
    // edit 无主键提示(与check同口径)
    const vm = mount();
    const { mt, state } = prepare(vm, { generalRequest: () => Promise.resolve(flowInstance(true)) });
    await mt.disposeFlowEvent({ flowKey: "k", btnType: "edit" }, undefined);
    assert("edit无行数据无勾选提示且不跳转", state.tips[0] === "请至少勾选一条要处理的数据！" && state.pushes.length === 0, JSON.stringify(state.tips));
    vm.$destroy();
  }

  console.log("== 7. stageId 固定参数与 requestSuccessMessage 提示语 ==");
  {
    const vm = mount({ stageId: "s9" });
    const mt = vm.$refs.mt;
    assert("getParams携带宿主stageId(与桌面同位置)", mt.getParams().stageId === "s9", JSON.stringify(mt.getParams().stageId));
    vm.$destroy();
  }
  {
    const vm = mount();
    const mt = vm.$refs.mt;
    assert("未提供stageId时为空串(不产生新键值差异)", mt.getParams().stageId === "", JSON.stringify(mt.getParams().stageId));
    vm.$destroy();
  }
  {
    // openType=5 经共享executeButton透传requestSuccessMessage(main合并新增配置)
    const vm = mount();
    const { mt, state } = prepare(vm, { generalRequest: () => Promise.resolve({ result: "0" }) });
    mt.formOptions = [
      { btnId: 5, authorize: "", tagAttrs: { value: "调接口" }, extraOption: { openType: 5, requestUrl: "/api/x", requestSuccessMessage: "操作成功" } }
    ];
    mt.tableConfigJSON = [{ fieldCode: "id", fieldName: "ID", show: true }];
    mt.composeBtnList();
    await mt.handleEntryBtnClick(mt.btnPlacement.top[0]);
    await new Promise(r => setTimeout(r, 50));
    assert("openType=5成功后按配置提示(requestSuccessMessage经executeButton透传)", state.successes[0] === "操作成功", JSON.stringify(state.successes));
    vm.$destroy();
  }
  {
    // 未配置提示语时不提示(桌面 requestSuccessMessage && $success 同语义)
    const vm = mount();
    const { mt, state } = prepare(vm, { generalRequest: () => Promise.resolve({ result: "0" }) });
    mt.formOptions = [
      { btnId: 6, authorize: "", tagAttrs: { value: "调接口2" }, extraOption: { openType: 5, requestUrl: "/api/y" } }
    ];
    mt.tableConfigJSON = [{ fieldCode: "id", fieldName: "ID", show: true }];
    mt.composeBtnList();
    await mt.handleEntryBtnClick(mt.btnPlacement.top[0]);
    await new Promise(r => setTimeout(r, 50));
    assert("未配置requestSuccessMessage不提示", state.successes.length === 0, JSON.stringify(state.successes));
    vm.$destroy();
  }

  console.log(`\n结果: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch(e => {
  console.error("SMOKE ERROR:", e);
  process.exit(1);
});
