/* eslint-disable */
// 第六期冒烟测试:投放推导 + 四处入口渲染 + 置灰/互斥 + 回归动作分派
// 运行:node .zcode/smoke-phase6.js
const path = require("path");
const { JSDOM } = (() => {
  try {
    return require("jsdom");
  } catch (e) {
    return { JSDOM: null };
  }
})();

if (!JSDOM) {
  // 无jsdom时以最小window/document桩跑(渲染测试依赖的真实DOM能力可能不足,尽力而为)
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
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
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

const btn = (btnId, extraOption, tagAttrs = {}) => ({
  btnId,
  authorize: "",
  tagAttrs: { value: `按钮${btnId}`, ...tagAttrs },
  extraOption: { openType: 5, ...extraOption }
});

const mkJson = formOptions => ({
  pageLayout: "table",
  keyField: "id",
  formOptions,
  tableOptions: [
    { fieldCode: "id", fieldName: "ID", show: true },
    { fieldCode: "name", fieldName: "名称", show: true, contentTextAttrArr: [{ textVal: "{name}", clickEvent: { relateBtnId: 777 } }] }
  ],
  tableAttrs: { isShowCheckbox: true, showPagination: true },
  mobileAttrs: {}
});

function mount(formOptions = [], provides = {}) {
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
    getRawRelateId: () => provides.__rawRelateId || "",
    getListPageId: () => "t1",
    ...provides
  };
  delete provide.__rawRelateId;
  return new Vue({
    el,
    provide,
    render: h => h(Comp, { props: { listPageIdProp: "t1" }, ref: "mt" })
  });
}

// 统一准备组件数据(绕过init:直接喂按钮池/字段配置;rawRelateId经provide的getRawRelateId注入)
function prepare(mt, { formOptions, tableConfigJSON } = {}) {
  mt.previewMode = false;
  mt.tableDisbaled = false;
  mt.formOptions = formOptions || [];
  mt.tableConfigJSON = tableConfigJSON || [{ fieldCode: "id", fieldName: "ID", show: true }];
  mt.composeBtnList();
  return mt;
}

(async () => {
  console.log("== 1. 投放推导 ==");

  // 直接以组件实例跑推导(构造数据)
  {
    const vm = mount();
    const mt = prepare(vm.$refs.mt, {
      formOptions: [
        btn(1, { btnType: "add", openType: 0, relateFrom: "f1" }),
        btn(2, { btnType: "refresh", openType: -1 }),
        btn(3, { btnType: "batchDel", openType: -1 }),
        btn(4, { btnType: "edit", openType: 0, relateFrom: "f1" }),
        btn(5, { btnType: "check", openType: 2, flowKey: "k" }),
        btn(6, { btnType: "custom", openType: 5, requestUrl: "/x" }),
        btn(7, { btnType: "custom", openType: 5, requestUrl: "/x", deliverySelectList: true, validate: [0] }),
        btn(8, { btnType: "custom", openType: 4, relateComponent: "c1" }),
        btn(9, { btnType: "download", openType: -1, command: "all" }),
        btn(10, { btnType: "custom", openType: 5, requestUrl: "/x", isHidden: true }),
        btn(777, { btnType: "custom", openType: 5, requestUrl: "/x" })
      ],
      tableConfigJSON: [
        { fieldCode: "id", fieldName: "ID", show: true },
        { fieldCode: "name", fieldName: "名称", show: true, contentTextAttrArr: [{ textVal: "{name}", clickEvent: { relateBtnId: 777 } }] }
      ]
    });
    await mt.$nextTick();
    const p = mt.btnPlacement;
    assert("add -> FAB", p.fab.map(b => b.btnId).join() === "1", JSON.stringify(p.fab.map(b => b.btnId)));
    assert("refresh -> 顶部", p.top.map(b => b.btnId).join() === "2,6", JSON.stringify(p.top.map(b => b.btnId)));
    assert("batchDel/deliverySelectList -> 批量", p.batch.map(b => b.btnId).join() === "3,7", JSON.stringify(p.batch.map(b => b.btnId)));
    assert("edit/check/relateBtnId引用 -> 行级", p.row.map(b => b.btnId).join() === "4,5,777", JSON.stringify(p.row.map(b => b.btnId)));
    assert("openType=4与download族不渲染入口", !p.fab.concat(p.row, p.batch, p.top).some(b => [8, 9].includes(b.btnId)));
    assert("isHidden不渲染入口", !p.fab.concat(p.row, p.batch, p.top).some(b => b.btnId === 10));
    assert("未投放按钮仍在btnList(emitBtnClick可达)", mt.btnList.some(b => b.btnId === 8));
    vm.$destroy();
  }

  console.log("== 2. 权限过滤分支 ==");
  {
    // 普通列表:无权限且非defaultShow被过滤,rawRelateId经provide注入
    const vm = mount(undefined, { checkPermission: () => false, __rawRelateId: "relate1" });
    const mt = prepare(vm.$refs.mt, {
      formOptions: [btn(1, { btnType: "custom", openType: 5 }), { ...btn(2, { btnType: "custom", openType: 5 }), authorize: "defaultShow" }]
    });
    assert("无权限仅保留defaultShow", mt.btnList.length === 1 && mt.btnList[0].btnId === 2, JSON.stringify(mt.btnList.map(b => b.btnId)));
    vm.$destroy();
  }
  {
    // FreeLayout:btnVerifyType非checkPermission不过滤
    const vm = mount(undefined, { checkPermission: () => false, __rawRelateId: "relate1", renderStrategy: { source: "freeLayoutWidget", btnVerifyType: "" } });
    const mt = prepare(vm.$refs.mt, { formOptions: [btn(1, { btnType: "custom", openType: 5 })] });
    assert("FreeLayout无btnVerifyType不过滤", mt.btnList.length === 1);
    vm.$destroy();
  }
  {
    const vm = mount(undefined, { checkPermission: () => false, __rawRelateId: "relate1", renderStrategy: { source: "freeLayoutWidget", btnVerifyType: "checkPermission" } });
    const mt = prepare(vm.$refs.mt, { formOptions: [btn(1, { btnType: "custom", openType: 5 })] });
    assert("FreeLayout+checkPermission过滤", mt.btnList.length === 0);
    vm.$destroy();
  }

  console.log("== 3. 入口渲染与交互 ==");
  {
    const vm = mount();
    const mt = vm.$refs.mt;
    mt.tableAttrs = { ...mt.tableAttrs, isShowCheckbox: true };
    prepare(mt, {
      formOptions: [
        btn(1, { btnType: "add", openType: 0, relateFrom: "f1" }, { value: "新增" }),
        btn(2, { btnType: "refresh", openType: -1 }, { value: "刷新" }),
        btn(3, { btnType: "edit", openType: 0, relateFrom: "f1" }, { value: "编辑" }),
        btn(4, { btnType: "check", openType: 0, relateFrom: "f1" }, { value: "查看" }),
        btn(5, { btnType: "custom", openType: 1, openUrl: "/go" }, { value: "跳转" }),
        btn(6, { btnType: "batchDel", openType: -1 }, { value: "批量删除" })
      ]
    });
    mt.tableData = [
      { id: 1, name: "a" },
      { id: 2, name: "b" }
    ];
    await mt.$nextTick();
    const html = vm.$el.innerHTML;
    assert("FAB渲染(el-icon-plus)", html.includes("mt-fab") && html.includes("el-icon-plus"));
    assert("顶部按钮行渲染(刷新/跳转)", html.includes("mt-btnbar") && html.includes("刷新") && html.includes("跳转"));
    assert("卡片操作区渲染(编辑/查看直出)", html.includes("mt-card-actions") && html.includes("编辑") && html.includes("查看"));
    assert("行级≤3无···", !html.includes("mt-card-more"));

    // 勾选态:批量栏滑出、FAB上移避让(is-lifted)不隐藏
    assert("无勾选时批量栏不渲染", !html.includes("mt-batchbar"));
    mt.selectList = [mt.tableData[0]];
    await mt.$nextTick();
    assert("勾选态批量栏渲染", vm.$el.innerHTML.includes("mt-batchbar") && vm.$el.innerHTML.includes("已选 1 项"));
    assert("勾选态FAB上移避让不隐藏", vm.$el.querySelector(".mt-fab")?.className.includes("is-lifted"));
    mt.clearBatchSelection();
    await mt.$nextTick();
    assert("取消勾选批量栏收起", !vm.$el.innerHTML.includes("mt-batchbar"));
    assert("取消勾选FAB回落原位", !!vm.$el.querySelector(".mt-fab") && !vm.$el.querySelector(".mt-fab").className.includes("is-lifted"));

    // 半屏面板:行级>3时出现···,点击打开面板(直出3个,面板收其余);
    // custom+openType=5按推导归顶部,行级用relateBtnId引用凑足4个(edit/check/777/778)
    mt.formOptions.push(btn(777, { btnType: "custom", openType: 5, requestUrl: "/x" }, { value: "行内4" }));
    mt.formOptions.push(btn(778, { btnType: "custom", openType: 5, requestUrl: "/x" }, { value: "行内5" }));
    mt.tableConfigJSON = [
      { fieldCode: "id", fieldName: "ID", show: true },
      { fieldCode: "name", fieldName: "名称", show: true, contentTextAttrArr: [{ textVal: "{name}", clickEvent: { relateBtnId: 777 } }, { textVal: "-", clickEvent: { relateBtnId: 778 } }] }
    ];
    mt.composeBtnList();
    await mt.$nextTick();
    assert("行级>3出现···入口", mt.btnPlacement.row.length === 4 && vm.$el.innerHTML.includes("mt-card-more"), `row=${mt.btnPlacement.row.map(b => b.btnId).join(",")}`);
    mt.openRowMoreSheet(mt.tableData[0]);
    await mt.$nextTick();
    const asheet = vm.$el.querySelector(".mt-asheet");
    assert("···打开底部半屏面板(仅含未直出按钮)", !!asheet && asheet.innerHTML.includes("行内5") && !asheet.innerHTML.includes("编辑"), asheet ? asheet.innerHTML.slice(0, 200) : "no asheet");
    mt.activeActionSheet = null;

    // FAB多add聚合面板
    mt.formOptions.push(btn(10, { btnType: "add", openType: 0, relateFrom: "f2" }, { value: "新增2" }));
    mt.composeBtnList();
    await mt.$nextTick();
    vm.$el.querySelector(".mt-fab").click();
    await mt.$nextTick();
    assert("多add点FAB开面板", vm.$el.innerHTML.includes("新增2") && vm.$el.innerHTML.includes("mt-asheet"));
    mt.activeActionSheet = null;
    await mt.$nextTick();

    // 预览态:入口置灰(FAB is-disabled)
    mt.previewMode = true;
    await mt.$nextTick();
    assert("预览态FAB置灰", vm.$el.querySelector(".mt-fab").className.includes("is-disabled"));
    mt.previewMode = false;
    vm.$destroy();
  }

  console.log("== 4. 回归矩阵(已实现动作经入口可执行) ==");
  {
    const calls = [];
    const vm = mount(undefined, { generalRequest: (url, type, data) => (calls.push(["req", url]), Promise.resolve({ result: "0" })), queryChangePrjId: async () => "" });
    const mt = vm.$refs.mt;
    mt.keyField = "id";
    prepare(mt, {
      formOptions: [
        btn(2, { btnType: "refresh", openType: -1 }, { value: "刷新" }),
        btn(5, { btnType: "custom", openType: 5, requestUrl: "/api/x", isRefresh: false }, { value: "调接口" })
      ]
    });
    let refreshed = 0;
    mt.loadFirst = async () => refreshed++;
    // openType=5:disposeRequestEvent -> generalRequest(handleEntryBtnClick为fire-and-forget,与桌面handleBtnClick一致,断言前flush微任务)
    await mt.handleEntryBtnClick(mt.btnPlacement.top.find(b => b.btnId === 5));
    await new Promise(r => setTimeout(r, 50));
    assert("openType=5经顶部入口调接口", calls.some(c => c[1] === "/api/x"), JSON.stringify(calls));
    // openType=-1 refresh:executeButton -> host.refresh()
    await mt.handleEntryBtnClick(mt.btnPlacement.top.find(b => b.btnId === 2));
    await new Promise(r => setTimeout(r, 50));
    assert("openType=-1 refresh经顶部入口重查", refreshed === 1, `refreshed=${refreshed}`);
    vm.$destroy();
  }
  {
    const vm = mount();
    const mt = vm.$refs.mt;
    prepare(mt, { formOptions: [btn(11, { btnType: "custom", openType: 0, fn: "function(rowData){ this.$root.__fnArg = rowData }" }, { value: "自定义" })] });
    await mt.handleEntryBtnClick(mt.btnPlacement.top[0], { id: 9 });
    await new Promise(r => setTimeout(r, 50));
    assert("自定义fn经入口执行且收到行数据", vm.__fnArg && vm.__fnArg.id === 9, JSON.stringify(vm.__fnArg));
    vm.$destroy();
  }
  {
    // openType=1 当前页跳转(行级链路):sessionStorage传参 + router.push
    const vm = mount(undefined, { queryChangePrjId: async () => "" });
    const mt = vm.$refs.mt;
    mt.keyField = "id";
    const pushed = [];
    mt.$router = { push: url => pushed.push(url) };
    prepare(mt, {
      formOptions: [btn(12, { btnType: "custom", openType: 1, openUrl: "/target", deliverySelectList: true, validate: [0], deliverySelectListFields: ["id"] }, { value: "跳行" })]
    });
    // deliverySelectList归批量栏,无勾选经批量入口应被validateSelectList拦截
    mt.selectList = [];
    await mt.handleEntryBtnClick(mt.btnPlacement.batch[0]);
    await new Promise(r => setTimeout(r, 50));
    assert("批量入口无勾选被validateSelectList拦截", pushed.length === 0);
    // 直接以行数据调用(emitBtnClick链路,行操作不被空勾选阻断)
    await mt.emitBtnClick({ id: 5 }, null, 12);
    await new Promise(r => setTimeout(r, 50));
    assert("openType=1行数据经sessionStorage+push跳转", pushed[0] === "/target" && JSON.parse(sessionStorage.getItem("lowcodeTableThisPageJumpParams") || "{}").idArray?.[0] === 5, JSON.stringify(pushed));
    sessionStorage.clear();
    vm.$destroy();
  }
  {
    // openType=3 新窗口
    const vm = mount();
    const mt = vm.$refs.mt;
    mt.keyField = "id";
    const opened = [];
    global.window.open = url => opened.push(url);
    prepare(mt, {
      formOptions: [btn(13, { btnType: "custom", openType: 3, openUrl: "https://a.b/c", deliverySelectList: true, validate: [0], deliverySelectListFields: ["id"] }, { value: "新窗" })]
    });
    mt.selectList = [{ id: 3 }];
    await mt.handleEntryBtnClick(mt.btnPlacement.batch[0]);
    await new Promise(r => setTimeout(r, 50));
    assert("openType=3经批量入口window.open(带勾选参数)", opened[0] === "https://a.b/c?id=3", JSON.stringify(opened));
    vm.$destroy();
  }

  console.log("== 5. 弹层互斥 ==");
  {
    const vm = mount();
    const mt = vm.$refs.mt;
    mt.fuzzyFieldSearchConfig = { placeholder: "", searchFieldList: [{ fieldCode: "id" }] };
    prepare(mt, {
      formOptions: [
        btn(1, { btnType: "add", openType: 0, relateFrom: "f1" }, { value: "新增" }),
        btn(14, { btnType: "add", openType: 0, relateFrom: "f2" }, { value: "新增2" })
      ]
    });
    await mt.$nextTick();
    mt.toggleSheet("__filter__");
    vm.$el.querySelector(".mt-fab").click();
    await mt.$nextTick();
    assert("FAB面板与第四期弹层互斥(打开面板关闭筛选弹层)", mt.activeActionSheet?.type === "fab" && mt.activeFilterKey === "");
    mt.toggleSheet("__sort__");
    assert("打开第四期弹层关闭半屏面板", mt.activeFilterKey === "__sort__" && mt.activeActionSheet === null);
    vm.$destroy();
  }

  console.log(`\n结果: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch(e => {
  console.error("SMOKE ERROR:", e);
  process.exit(1);
});
