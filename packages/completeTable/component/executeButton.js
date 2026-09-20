// 按钮执行器（第二期共享抽取）：桌面 tableItem 与移动端 mobileTable 共用同一份按钮执行业务分派。
// 逻辑逐字移植自 tableItem.js handleBtnClick:1616-1920 / autoValidate:1922-1941 / validateSelectList:1597-1615，
// 仅将组件内 this 改为宿主实例 host；分派时机、校验顺序与桌面端完全一致。
//
// 宿主（host）需提供：
//   状态：previewMode、tableDisbaled、editRow、externalParamsFormRow、btnConfigs
//   能力：$nextTick、$warn（或 showTip）、getSelectedData、checkNoSelection、checkOnlyOneSelected、
//         formatSelectListParams、refresh，以及各 dispose*/deal* 分派器
//         （openType -1 固定行为与 0/2/4/6 弹窗体系由宿主实现；移动端未覆盖场景提供告警占位）。
import { str2Fn, BtnConfigs, appendParamsToUrl } from "../../../utils";

function warn(host, message) {
  const warner = host.$warn || host.showTip || console.warn;
  warner.call(host, message);
}

async function autoValidate(host, validateFn, btnValidationOptions, rowDataList) {
  let result = true;
  if (validateFn) {
    // 明确返回false才会中断
    let result1 = await Promise.resolve(str2Fn(validateFn).call(host, rowDataList));
    result = result1 === false ? false : true;
  }
  if (result && rowDataList.length && Object.prototype.hasOwnProperty.call(rowDataList[0], btnValidationOptions?.field)) {
    const { fieldAllowedValue, field, failMessage } = btnValidationOptions;
    result = rowDataList.every(item => {
      return fieldAllowedValue.some(value => {
        return value == item[field];
      });
    });
    if (!result) {
      warn(host, failMessage || "当前数据状态不允许执行此操作");
    }
  }
  return result;
}

function validateSelectList(host, { paramName, paramType, deliverySelectList, deliverySelectListFields, validate }, row) {
  host.btnConfigs.deliverySelectList = deliverySelectList;
  if (deliverySelectList) {
    host.btnConfigs.btnDisposeParamsRule = {
      paramName,
      paramType,
      deliverySelectListFields
    };
    if (validate.includes(0) && host.checkNoSelection() && !row) {
      warn(host, "请至少勾选一条要处理的数据");
      return false;
    }
    if (validate.includes(1) && !host.checkOnlyOneSelected() && !row) {
      warn(host, "当前操作只允许勾选一条数据");
      return false;
    }
  }
  return true;
}

// 处理按钮点击事件（tableItem.handleBtnClick 共享版，行为与桌面端一致）
export async function executeButton(
  {
    relateFrom = "",
    relateMeta = "",
    relateComponent = "",
    relateTable = "",
    openType = "",
    openUrl = "",
    fn = "",
    isRefresh = false,
    btnType = "",
    dialogTitle = "",
    dialogHeight = "",
    closeOnPressEscape = false,
    dialogWidth = "",
    flowKey = "",
    paramName = "",
    paramType = 0,
    deliverySelectList = false,
    deliverySelectListFields = [],
    validate = [],
    requestUrl = "",
    requestType = "post",
    requestBeforeConfirmHint = false,
    requestBeforeConfirmText = "",
    requestBeforeConfirmTitle = "",
    requestBeforeConfirmType = "",
    requestSuccessMessage = "",
    requestParamsConfig = {},
    useDialog = true,
    showFooter = false,
    validateFn = "",
    briefPageFields = [],
    btnValidationOptions = {},
    command = "",
    btnId,
    authorize
  },
  rowData,
  host
) {
  if (host.previewMode || host.tableDisbaled) return;
  host.editRow = null;
  host.externalParamsFormRow = null;
  // 执行按钮操作前先重置btnConfigs
  host.btnConfigs = new BtnConfigs();
  host.btnConfigs.requestUrl = requestUrl;
  host.btnConfigs.requestType = requestType;
  host.btnConfigs.requestFixedParams = requestParamsConfig;
  host.btnConfigs.requestBeforeConfirmHint = requestBeforeConfirmHint;
  host.btnConfigs.requestBeforeConfirmText = requestBeforeConfirmText;
  host.btnConfigs.requestBeforeConfirmTitle = requestBeforeConfirmTitle;
  host.btnConfigs.requestBeforeConfirmType = requestBeforeConfirmType;
  host.btnConfigs.requestSuccessMessage = requestSuccessMessage;
  host.btnConfigs.isRefresh = isRefresh;
  host.btnConfigs.btnType = btnType;
  host.btnConfigs.btnId = btnId;
  host.btnConfigs.authorize = authorize;
  host.btnConfigs.briefPageFields = briefPageFields;
  host.btnConfigs.openType = openType;
  host.btnConfigs.dialogHeight = dialogHeight;
  host.btnConfigs.dialogWidth = dialogWidth;
  host.btnConfigs.closeOnPressEscape = closeOnPressEscape;
  await host.$nextTick();
  // 执行任何操作之前都先进行校验
  if (await autoValidate(host, validateFn, btnValidationOptions, host.getSelectedData())) {
    // 如果有自定义事件，则执行自定义事件
    if (fn) {
      str2Fn(fn).call(host, rowData);
    } else {
      if (openType === -1) {
        // openType为-1是固定行为，如下载 批量删除等
        switch (btnType) {
          case "download":
            host.disposeDown(
              {
                command
              },
              rowData
            );
            break;
          case "flowDocDownload":
            host.disposeFlowDocDown(
              {
                command
              },
              rowData
            );
            break;
          case "flowResultDownload":
            host.disposeFlowResultDown(rowData);
            break;
          case "formDownload":
            host.disposeFormDown(
              {
                command
              },
              rowData
            );
            break;
          case "batchDel":
            host.disposeDel(rowData);
            break;
          case "import":
            // 处理导入
            host.dealImport(relateMeta);
            break;
          case "importRefresh":
            // 处理导入
            host.dealImportRefresh({ requestBeforeConfirmHint, requestBeforeConfirmText, requestBeforeConfirmTitle, requestBeforeConfirmType });
            break;
          case "refresh":
            // 处理刷新
            host.refresh();
            break;
          case "qrCode":
            // 处理二维码下载
            host.dealQrDownload(
              {
                command
              },
              rowData
            );
            break;
          default:
            break;
        }
      } else if (openType === 1) {
        // openType为1是当前页面跳转
        if (
          validateSelectList(host, {
            paramName,
            paramType,
            deliverySelectListFields,
            deliverySelectList,
            validate
          }, rowData)
        ) {
          host.disposeThisPageJump({ openUrl, deliverySelectList, deliverySelectListFields }, rowData);
        }
      } else if (openType === 3) {
        if (
          validateSelectList(host, {
            paramName,
            paramType,
            deliverySelectList,
            deliverySelectListFields,
            validate
          }, rowData)
        ) {
          // openType为3是新窗口打开;
          const isAbsoluteUrl = url => {
            try {
              new URL(url);
              return true;
            } catch {
              return false;
            }
          };
          const externalParams = host.formatSelectListParams({ deliverySelectList, deliverySelectListFields }, rowData, "useJoin");
          // 构造目标URL（保持原有逻辑）
          let targetUrl = isAbsoluteUrl(openUrl) ? openUrl : `${window.location.origin}${openUrl.startsWith("/") ? "" : "/"}${openUrl}`;
          // 附加参数到所有场景的URL
          targetUrl = appendParamsToUrl(targetUrl, externalParams);
          window.open(targetUrl, "_blank");
        }
      } else if (openType === 4) {
        // openType为4是打开本地关联代码
        if (
          validateSelectList(host, {
            paramName,
            paramType,
            deliverySelectList,
            deliverySelectListFields,
            validate
          }, rowData)
        ) {
          host.disposeRelateCompEvent(
            {
              relateComponent,
              useDialog,
              showFooter,
              dialogTitle
            },
            rowData
          );
        }
      } else if (openType === 5) {
        // openType为5是直接调用接口
        if (
          validateSelectList(host, {
            paramName,
            paramType,
            deliverySelectList,
            deliverySelectListFields,
            validate
          }, rowData)
        ) {
          host.disposeRequestEvent(
            {
              requestBeforeConfirmHint,
              requestBeforeConfirmText,
              requestBeforeConfirmTitle,
              requestBeforeConfirmType,
              requestSuccessMessage
            },
            rowData
          );
        }
      } else if (openType === 2) {
        // openType为2是打开流程
        if (
          validateSelectList(host, {
            paramName,
            paramType,
            deliverySelectList,
            deliverySelectListFields,
            validate
          }, rowData)
        ) {
          host.disposeFlowEvent({ flowKey, btnType, isRefresh, deliverySelectList }, rowData);
        }
      } else if (openType === 0) {
        // openType为0是打开表单
        if (
          validateSelectList(host, {
            paramName,
            paramType,
            deliverySelectList,
            deliverySelectListFields,
            validate
          }, rowData)
        ) {
          host.disposeDynamicFormEvent(
            {
              btnType,
              relateFrom,
              dialogTitle,
              deliverySelectList,
              deliverySelectListFields
            },
            rowData
          );
        }
      } else if (openType === 6) {
        // openType为6是打开列表
        if (
          validateSelectList(host, {
            paramName,
            paramType,
            deliverySelectList,
            deliverySelectListFields,
            validate
          }, rowData)
        ) {
          host.disposeDynamicTableEvent(
            {
              btnType,
              relateTable,
              dialogTitle,
              deliverySelectList,
              deliverySelectListFields
            },
            rowData
          );
        }
      }
    }
  }
}
