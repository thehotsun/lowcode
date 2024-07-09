<template>
  <el-form ref="ruleForm" :model="form" label-width="90px" style="padding-bottom: 20px">
    <el-form-item label="选择类型" prop="isDataModel">
      <el-radio-group v-model="form.isDataModel">
        <el-radio :label="true">sql</el-radio>
        <el-radio :label="false">自定义接口</el-radio>
      </el-radio-group>
    </el-form-item>

    <!-- <el-form-item v-if="form.isDataModel" :label="sqlLabel" :prop="sqlField">
      <el-input v-model="form[sqlField]" :autosize="{ minRows: 2, maxRows: 4 }" type="textarea" readonly></el-input>
      <el-button type="text" @click="handleSqlConfigEdit">编辑</el-button>
    </el-form-item> -->
    <!-- <sqlConfig ref="sqlConfig" :form="form" :sql-field="sqlField"></sqlConfig> -->

    <el-form-item v-if="form.isDataModel" :label="sqlLabel" :prop="sqlField">
      <sql-code-editor ref="chEditor" v-model="form[sqlField]" mode="javascript" />
    </el-form-item>

    <el-form-item v-if="!form.isDataModel" :label="requestUrlLabel">
      <el-input v-model="form[requestUrlField]" clearable placeholder="请输入接口地址"></el-input>
      <el-button type="text" @click="handleRequestParamsConfigEdit"> 编辑请求 </el-button>
    </el-form-item>
    <el-form-item v-if="!form.isDataModel" :label="requestTypeLabel">
      <el-select v-model="form[requestTypeField]" placeholder="请选择">
        <el-option v-for="item in requestTypeList" :key="item.id" :label="item.cnName" :value="item.id"> </el-option>
      </el-select>
    </el-form-item>
    <interfaceConfig ref="interfaceDlg" :params-config="paramsConfig" @confirm="handleConfirm"></interfaceConfig>
  </el-form>
</template>

<script>
import interfaceConfig from "../interfaceDlg.vue";
// import sqlConfig from "./sqlConfig";
import { cloneDeep } from "lodash";
import { requestTypeList } from "/baseConfig/btnBaseConfig";
export default {
  components: { interfaceConfig },
  props: {
    form: {
      type: Object,
      default() {
        return {};
      }
    },
    sqlField: {
      type: String,
      default: "treeSql"
    },
    sqlLabel: {
      type: String,
      default: "sql"
    },
    title: {
      type: String,
      default: "sql"
    },
    requestUrlField: {
      type: String,
      default: "requestUrl"
    },
    requestUrlLabel: {
      type: String,
      default: "接口地址"
    },

    requestTypeField: {
      type: String,
      default: "requestType"
    },
    requestTypeLabel: {
      type: String,
      default: "请求方式"
    }
  },
  data() {
    return {
      paramsConfig: {
        params: [],
        data: [],
        headers: []
      },
      requestTypeList,
      sql: ""
    };
  },
  methods: {
    handleRequestParamsConfigEdit() {
      this.paramsConfig = {
        ...this.paramsConfig,
        ...cloneDeep(this.form.requestParamsConfig)
      };
      this.$refs.interfaceDlg.showDlg();
    },
    handleSqlConfigEdit() {
      this.$refs.sqlConfig.showDlg();
    },
    handleSqlConfirm(sql) {
      this.form.requestParamsConfig = sql;
    },
    handleConfirm(paramsConfig) {
      this.form.requestParamsConfig = paramsConfig;
    }
  }
};
</script>
