import { requestTypeList } from "/baseConfig/btnBaseConfig";
import { addQueryString, transformParamsValue, arrayToTree } from "/utils";
export default {
  data() {
    return {
      initiated: false,
      treeOptions: {},
      treeData: [
        { label: "一级 1", id: "1", children: [{ label: "二级 1-1", id: "11", children: [{ label: "三级 1-1-1", id: "111" }] }] },
        {
          label: "一级 2",
          id: "2",
          children: [
            { label: "二级 2-1", id: "21", children: [{ label: "三级 2-1-1", id: "211" }] },
            { label: "二级 2-2", id: "22", children: [{ label: "三级 2-2-1", id: "221" }] }
          ]
        },
        {
          label: "一级 3",
          id: "3",
          children: [
            { label: "二级 3-1", id: "31", children: [{ label: "三级 3-1-1", id: "311" }] },
            { label: "二级 3-2", id: "32", children: [{ label: "三级 3-2-1", id: "321" }] }
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
    getRequestConfig() {
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
      const finalData = {};
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
    async disposeRequestEvent() {
      const { finalUrl, finalType, finalData, headers } = this.getRequestConfig();
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
      const { isDataModel } = this.treeOptions;
      return (isDataModel ? this.requestTreeData : this.disposeRequestEvent)(params)
        .then(res => {
          if (res.result === "0") {
            let data = res.data;
            if (isDataModel) {
              data = arrayToTree(data);
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
