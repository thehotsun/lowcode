<template>
  <el-dialog title="请求接口设置" :visible.sync="showParamsConfig" :close-on-click-modal="false" :close-on-press-escape="false" width="40%" append-to-body @close="handleClose">
    <template>
      <el-form ref="dsForm" :model="paramsConfig" label-width="0px" label-position="left" class="ds-form">
        <div class="config">
          <div class="configLeft">url参数（queryString）</div>
          <div class="configRight">
            <el-row v-for="(rp, pIdx) in paramsConfig.params" :key="pIdx" class="rd-row" :gutter="8">
              <el-col :span="7">
                <el-form-item :required="true">
                  <el-input v-model="rp.name" size="small" placeholder="请输入名称"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item>
                  <el-input v-model="rp.value" size="small" placeholder="请输入值"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="3">
                <el-button icon="el-icon-delete" size="small" plain circle @click="deleteRequestParam(pIdx)"></el-button>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="6">
                <el-button type="text" icon="el-icon-plus" @click="addRequestParam">新增请求参数</el-button>
              </el-col>
            </el-row>
          </div>
        </div>

        <div class="config">
          <div class="configLeft">请求头（header）</div>
          <div class="configRight">
            <el-row v-for="(rd, dIdx) in paramsConfig.headers" :key="dIdx" class="rd-row" :gutter="8">
              <el-col :span="7">
                <el-form-item :required="true">
                  <el-input v-model="rd.name" size="small" placeholder="请输入名称"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item>
                  <el-input v-model="rd.value" size="small" placeholder="请输入值"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="3">
                <el-button icon="el-icon-delete" size="small" plain circle @click="deleteHeaderData(dIdx)"></el-button>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="6">
                <el-button type="text" icon="el-icon-plus" @click="addHeaderData">新增请求头</el-button>
              </el-col>
            </el-row>
          </div>
        </div>

        <div class="config">
          <div class="configLeft">body参数（data）</div>
          <div class="configRight">
            <JsCodeEditor v-model="paramsConfig.data" mode="json" display-height="220px"></JsCodeEditor>
          </div>
        </div>
      </el-form>
      <div v-if="dlgParams.showTestRequest" class="testRequest">
        <div class="flex">
          <span>测试结果</span>
          <el-button type="text" size="small" @click="testRequest()">发送请求</el-button>
        </div>
        <JsCodeEditor ref="jsCodeEditor" v-model="responseStr" mode="json" :readonly="true" display-height="220px"></JsCodeEditor>
      </div>
    </template>
    <span v-if="!dlgParams.hiddenFooter" slot="footer" class="dialog-footer">
      <el-button @click="showParamsConfig = false">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { disposeParams } from "/utils/interfaceParams";
export default {
  props: {
    interfaceDlgType: {
      type: String,
      default: ""
    },
    interfaceConfig: {
      type: Object,
      default: () => ({})
    },
    paramsConfig: {
      type: Object,
      default() {
        return {
          params: [],
          data: "",
          headers: []
        };
      }
    }
  },

  data() {
    return {
      requestTypeList: [
        {
          id: 0,
          cnName: "post"
        },
        {
          id: 1,
          cnName: "get"
        }
      ],
      showParamsConfig: false,
      responseStr: "",
      dlgParams: {}
    };
  },
  inject: {
    generalRequest: {
      default: () => () => {
        console.warn("inject缺失generalRequest!");
      }
    }
  },
  watch: {
    paramsConfig: {
      handler(val) {
        if (Array.isArray(val.data)) {
          val.data = val.data.length ? JSON.stringify(this.arrayToObject(val.data), null, 2) : "";
        }
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    handleClose() {
      this.dlgParams = {};
      this.responseStr = "";
    },
    arrayToObject(arr) {
      return arr.reduce((acc, item) => {
        acc[item.name] = item.value; // 将 value 转换为数字
        return acc;
      }, {});
    },
    showDlg(dlgParams) {
      this.showParamsConfig = true;
      if (typeof dlgParams === "object") this.dlgParams = dlgParams;
    },
    async testRequest() {
      const { apiUrl, apiMethod } = this.interfaceConfig;
      const config = {};
      config.url = apiUrl;
      config.method = apiMethod;
      config.paramsConfig = this.paramsConfig;
      if (!config.url) {
        this.$warn("接口地址不能为空");
        return;
      }

      try {
        const { finalUrl, finalType, finalData, requestHeaders } = disposeParams(config.url, config.method, config.paramsConfig);
        const response = await this.generalRequest(finalUrl, finalType, finalData, requestHeaders);
        this.responseStr = JSON.stringify(response, null, 2);
      } catch (error) {
        console.error(error);
        this.$message.error("请求接口失败");
      }
    },
    handleConfirm() {
      this.$refs.dsForm.validate((valid, fields) => {
        if (!valid) {
          this.$message.error("请求接口设置存在错误，请修改");
          return;
        }
        this.showParamsConfig = false;
        this.$emit("confirm", this.paramsConfig);
      });
    },
    addRequestParam() {
      this.paramsConfig.params.push({
        name: "",
        value: ""
      });
    },

    deleteRequestParam(idx) {
      this.paramsConfig.params.splice(idx, 1);
    },

    addRequestData() {
      this.paramsConfig.data.push({
        name: "",
        value: ""
      });
    },

    deleteRequestData(idx) {
      this.paramsConfig.data.splice(idx, 1);
    },

    addHeaderData() {
      this.paramsConfig.headers.push({
        name: "",
        value: ""
      });
    },

    deleteHeaderData(idx) {
      this.paramsConfig.headers.splice(idx, 1);
    }
  }
};
</script>

<style lang="less" scoped>
.config {
  display: flex;
  align-items: flex-start;
  font-size: 14px;
}
.el-form-item {
  margin-bottom: 0 !important;
}

.configLeft {
  font-size: 14px;
  width: 160px;
}

.configRight {
  font-size: 14px;
  flex: 1;
}
.flex {
  display: flex;
  justify-content: space-between;
}
</style>
