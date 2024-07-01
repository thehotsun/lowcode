<template>
  <el-dialog title="请求接口设置" :visible.sync="showParamsConfig" :close-on-click-modal="false" :close-on-press-escape="false" width="40%" append-to-body>
    <template>
      <el-form ref="dsForm" :model="paramsConfig" label-width="0px" label-position="left" class="ds-form">
        <div class="config">
          <div class="configLeft">url参数（queryString）</div>
          <div class="configRight">
            <el-row v-for="(rp, pIdx) in paramsConfig.params" :key="pIdx" class="rd-row" :gutter="8">
              <el-col :span="7">
                <el-form-item :required="true">
                  <el-input v-model="rp.name" placeholder="请输入名称"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item>
                  <el-input v-model="rp.value" placeholder="请输入值"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="3">
                <el-button icon="el-icon-delete" plain circle @click="deleteRequestParam(pIdx)"></el-button>
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
          <div class="configLeft">body参数（data）</div>
          <div class="configRight">
            <el-row v-for="(rd, dIdx) in paramsConfig.data" :key="dIdx" class="rd-row" :gutter="8">
              <el-col :span="7">
                <el-form-item :required="true">
                  <el-input v-model="rd.name" placeholder="请输入名称"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item>
                  <el-input v-model="rd.value" placeholder="请输入值"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="3">
                <el-button icon="el-icon-delete" plain circle @click="deleteRequestData(dIdx)"></el-button>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="6">
                <el-button type="text" icon="el-icon-plus" @click="addRequestData">新增发送数据</el-button>
              </el-col>
            </el-row>
          </div>
        </div>
        <div class="config">
          <div class="configLeft">请求头</div>
          <div class="configRight">
            <el-row v-for="(rd, dIdx) in paramsConfig.headers" :key="dIdx" class="rd-row" :gutter="8">
              <el-col :span="7">
                <el-form-item :required="true">
                  <el-input v-model="rd.name" placeholder="请输入名称"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item>
                  <el-input v-model="rd.value" placeholder="请输入值"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="3">
                <el-button icon="el-icon-delete" plain circle @click="deleteHeaderData(dIdx)"></el-button>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="6">
                <el-button type="text" icon="el-icon-plus" @click="addHeaderData">新增请求头</el-button>
              </el-col>
            </el-row>
          </div>
        </div>
      </el-form>
    </template>
    <span slot="footer" class="dialog-footer">
      <el-button @click="showParamsConfig = false">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  props: {
    paramsConfig: {
      type: Object,
      default() {
        return {
          params: [],
          data: [],
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
      showParamsConfig: false
    };
  },
  methods: {
    showDlg() {
      this.showParamsConfig = true;
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

.configLeft {
  font-size: 14px;
  width: 160px;
}

.configRight {
  font-size: 14px;
  flex: 1;
}
</style>
