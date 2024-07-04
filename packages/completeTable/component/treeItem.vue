<template>
  <div class="tree-container">
    <base-render-tree v-if="initiated" :tree-data="treeData" :tree-options="treeOptions" :style="{ style: treeOptions.style }"></base-render-tree>
  </div>
</template>

<script>
import BaseRenderTree from "/packages/BaseRenderTree";
import { addQueryString, transformParamsValue } from "../../../utils";
import { requestTypeList } from "../../../baseConfig/btnBaseConfig";
export default {
  name: "CompleteTreeItem",
  components: { BaseRenderTree },
  props: {
    options: {
      type: Object,
      default() {
        return {};
      }
    }
  },
  data() {
    return {
      initiated: false,
      isPreview: false,
      treeData: [
        { label: "一级 1", s: "1", children: [{ label: "二级 1-1", s: "11", children: [{ label: "三级 1-1-1", s: "111" }] }] },
        {
          label: "一级 2",
          children: [
            { label: "二级 2-1", children: [{ label: "三级 2-1-1" }] },
            { label: "二级 2-2", children: [{ label: "三级 2-2-1" }] }
          ]
        },
        {
          label: "一级 3",
          children: [
            { label: "二级 3-1", children: [{ label: "三级 3-1-1" }] },
            { label: "二级 3-2", children: [{ label: "三级 3-2-1" }] }
          ]
        }
      ],
      treeOptions: {},
      currentKey: ""
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
    }
  },

  created() {},
  mounted() {},
  methods: {
    async expose_preview(data) {
      this.init(true, data);
      this.previewMode = true;
    },
    async init(isPreview, treeOptions, externalParams = {}) {
      this.resetAllData();
      await this.$nextTick();
      this.isPreview = !!isPreview;
      this.externalParams = externalParams;
      if (treeOptions) {
        this.treeOptions = treeOptions;
        this.$nextTick(() => {
          this.initiated = true;
        });
      } else {
        console.warn("当前树没有配置options！");
      }
    },

    resetAllData() {},

    refreshData(data) {
      this.externalParams = data;
      this.queryTreeData();
    },

    refresh() {
      this.queryTreeData();
    },

    getParams(data) {
      return {
        ...data,
        ...this.externalParams,
        prjId: this.getPrjInfo().prjId,
        enterpriseId: this.enterpriseId
      };
    },

    getRequestConfig(row) {
      const {
        treeOptions: { requestFixedParams, requestUrl, requestType }
      } = this;

      // 这里提交的是用户自己设置的固定参数
      const { params = [], data = [], headers = [] } = requestFixedParams;
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
      const requestHeaders = {};
      headers.map(item => {
        const headerFieldNameRegex = /^[\w-]+$/;
        if (headerFieldNameRegex.test(item.name)) requestHeaders[item.name] = item.value;
      });
      await this.generalRequest(finalUrl, finalType, finalData, requestHeaders);
      this.btnConfigs.isRefresh && this.queryTableData();
    },

    queryTableData(data = {}, isReturn) {
      const params = this.getParams(data);
      const { isDataModel } = this.treeOptions;
      return (isDataModel ? requestTreeData : this.disposeRequestEvent)(params)
        .then(res => {
          if (res.result === "0") {
            if (isReturn) {
              return res.data;
            } else {
              this.treeData = res.data;
            }
          } else {
            console.error(`queryTreeData message: ${res.message}`);
          }
        })
        .catch(e => {
          console.error(`queryTableData error: ${e}`);
          throw new Error(e);
        });
    },

    setTreeData(data) {
      this.treeData = data;
      this.currentKey = data[0].id;
    },

    getTreeData() {
      return this.treeData;
    },

    getTreeOptions() {
      return this.treeOptions;
    }
  }
};
</script>
<style lang="less" scoped>
.tree-container {
  margin: 2px;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}
.operate {
  height: 74px;
  display: flex;
  align-items: start;
}
// ::v-deep .el-main {
//   padding: 0 20px 10px 20px;
// }
</style>
