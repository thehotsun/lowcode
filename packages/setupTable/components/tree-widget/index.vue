<template>
  <div class="tree-container">
    <el-container>
      <base-render-tree v-if="initiated" :key="random" ref="baseTree" :tree-data="treeData" :tree-options="treeOptions"></base-render-tree>
    </el-container>
  </div>
</template>

<script>
import BaseRenderTree from "/packages/BaseRenderTree";
// import { addQueryString, transformParamsValue } from "/utils";
// import { requestTypeList } from "/baseConfig/btnBaseConfig";
import tree from "/mixins/tree";
export default {
  name: "TreeWidget",
  components: { BaseRenderTree },
  mixins: [tree],
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
      currentKey: "",
      random: +new Date()
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

  watch: {
    treeOptions: {
      deep: true,
      handler() {
        this.queryTreeData();
        this.random = +new Date();
      }
    }
  },

  created() {},
  mounted() {},
  methods: {
    init(id, formCode, treeOptions) {
      if (treeOptions) {
        this.treeOptions = treeOptions;
        this.$nextTick(() => {
          this.initiated = true;
        });
      } else {
        this.initiated = true;
      }
      this.queryTreeData();
    },

    // getParams(data) {
    //   return {
    //     ...data,
    //     ...this.externalParams,
    //     prjId: this.getPrjInfo().prjId,
    //     enterpriseId: this.enterpriseId
    //   };
    // },

    // getRequestConfig() {
    //   const {
    //     treeOptions: { requestParamsConfig, requestUrl, requestType }
    //   } = this;

    //   // 这里提交的是用户自己设置的固定参数
    //   const { params = [], data = [], headers = [] } = requestParamsConfig;
    //   // 这里提交的是列表选中的数据
    //   let finalUrl = requestUrl;
    //   if (params?.length) {
    //     const finalParams = {};
    //     params.map(item => {
    //       finalParams[item.name] = transformParamsValue(item.value);
    //     });
    //     finalUrl = addQueryString(finalParams, requestUrl);
    //   }
    //   const finalData = {};
    //   if (data?.length) {
    //     data.map(item => {
    //       finalData[item.name] = transformParamsValue(item.value);
    //     });
    //   }

    //   const finalType = requestTypeList.find(item => item.id === requestType)?.cnName || "";
    //   return {
    //     finalUrl,
    //     finalData,
    //     finalType,
    //     headers
    //   };
    // },
    // async disposeRequestEvent() {
    //   const { finalUrl, finalType, finalData, headers } = this.getRequestConfig();
    //   if (!finalUrl) return;
    //   const requestHeaders = {};
    //   headers.map(item => {
    //     const headerFieldNameRegex = /^[\w-]+$/;
    //     if (headerFieldNameRegex.test(item.name)) requestHeaders[item.name] = item.value;
    //   });
    //   return await this.generalRequest(finalUrl, finalType, finalData, requestHeaders);
    // },

    queryTreeData(data = {}, isReturn) {
      const params = this.getParams(data);
      const { isDataModel } = this.treeOptions;
      return (isDataModel ? this.requestTreeData : this.disposeRequestEvent)(params)
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
          console.error(`queryTreeData error: ${e}`);
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
    },
    setTreeOptions(treeOptions) {
      this.treeOptions = treeOptions;
    }
  }
};
</script>
<style lang="less" scoped>
.tree-container {
  margin: 2px;

  .form-widget-list {
    min-height: 28px;
  }
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
::v-deep .el-main {
  padding: 0 20px 10px 20px;
}
</style>
