import { requestTypeList } from "/baseConfig/btnBaseConfig";
import { addQueryString, transformParamsValue, arrayToTree } from "/utils";
export default {
  props: {
    listPageIdProp: String
  },
  data() {
    return {
      initiated: false,
      treeOptions: {},
      treeData: [
        {
          originalVal: true,
          label: "一级 1",
          id: "1",
          children: [{ originalVal: true, label: "二级 1-1", id: "11", children: [{ originalVal: true, label: "三级 1-1-1", id: "111" }] }]
        },
        {
          originalVal: true,
          label: "一级 2",
          id: "2",
          children: [
            { originalVal: true, label: "二级 2-1", id: "21", children: [{ originalVal: true, label: "三级 2-1-1", id: "211" }] },
            { originalVal: true, label: "二级 2-2", id: "22", children: [{ originalVal: true, label: "三级 2-2-1", id: "221" }] }
          ]
        },
        {
          originalVal: true,
          label: "一级 3",
          id: "3",
          children: [
            { originalVal: true, label: "二级 3-1", id: "31", children: [{ originalVal: true, label: "三级 3-1-1", id: "311" }] },
            { originalVal: true, label: "二级 3-2", id: "32", children: [{ originalVal: true, label: "三级 3-2-1", id: "321" }] }
          ]
        }
      ]
    };
  },
  inject: {
    enterpriseId: {
      default: () => ""
    },
    getPrjInfo: {
      default: () => () => {
        console.warn("inject缺失getPrjInfo!");
      }
    },
    generalRequest: {
      default: () => () => {
        console.warn("inject缺失generalRequest!");
      }
    },
    requestTreeData: {
      default: () => () => {
        console.warn("inject缺失requestTreeData!");
      }
    },
    getListPageId: {
      default: () => () => {
        console.warn("inject缺失getListPageId!");
      }
    }
  },
  computed: {
    listPageId() {
      return this.listPageIdProp || this.getListPageId();
    }
  },
  methods: {
    getParams(data) {
      return {
        ...data,
        ...this.externalParams,
        prjId: this.getPrjInfo().prjId,
        enterpriseId: this.enterpriseId
      };
    },
    getRequestConfig(externalParams = {}) {
      const {
        treeOptions: { requestParamsConfig, requestUrl, requestType }
      } = this;

      // 这里提交的是用户自己设置的固定参数
      const { params = [], data = [], headers = [] } = requestParamsConfig;
      // 这里提交的是列表选中的数据
      let finalUrl = requestUrl;
      if (params?.length) {
        const finalParams = {};
        params.map(item => {
          finalParams[item.name] = transformParamsValue(item.value);
        });
        finalUrl = addQueryString(finalParams, requestUrl);
      }
      const finalData = externalParams;
      console.log(externalParams, "externalParams");
      if (data?.length) {
        data.map(item => {
          finalData[item.name] = transformParamsValue(item.value);
        });
      }

      const finalType = requestTypeList.find(item => item.id === requestType)?.cnName || "";
      return {
        finalUrl,
        finalData,
        finalType,
        headers
      };
    },
    async disposeRequestEvent(params) {
      const { finalUrl, finalType, finalData, headers } = this.getRequestConfig(params);
      if (!finalUrl) return { message: "接口没有设置url" };
      const requestHeaders = {};
      headers.map(item => {
        const headerFieldNameRegex = /^[\w-]+$/;
        if (headerFieldNameRegex.test(item.name)) requestHeaders[item.name] = item.value;
      });
      return await this.generalRequest(finalUrl, finalType, finalData, requestHeaders);
    },
    queryTreeData(data = {}, isReturn) {
      const params = this.getParams(data);
      console.log(params, "paramsparams");
      const { isDataModel } = this.treeOptions;
      return (isDataModel ? this.requestTreeData : this.disposeRequestEvent)(params, this.listPageId)
        .then(res => {
          if (res.result === "0") {
            let data = res.data;
            if (isDataModel) {
              if (Object.keys(data[0] || {}).includes("id", "pid")) {
                data = arrayToTree(data);
              } else {
                console.warn("当前接口返回的对象缺失id和pid字段！重组为树状结构失败");
              }
            }
            if (isReturn) {
              return data;
            } else {
              this.treeData = res.data;
            }
          } else {
            console.error(`queryTreeData message: ${res.message}`);
          }
        })
        .catch(e => {
          console.error(`queryTreeData error: ${e}`);
          throw new Error(e);
        });
    },
    getTreeData() {
      return this.treeData;
    },

    getTreeOptions() {
      return this.treeOptions;
    }
  }
};
