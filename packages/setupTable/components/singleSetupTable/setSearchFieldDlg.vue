<template>
  <el-dialog
    v-dialogDrag
    title="设置搜索字段"
    :visible.sync="dialogVisibleFuzzyFrom"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="1450px"
    class="setSearchFieldDlg"
    :before-close="handleCloseFuzzyFrom"
    append-to-body
  >
    <div class="flex">
      <div class="left">
        <el-form ref="fuzzyFrom" :model="fuzzyFieldSearchConfig" :rules="fuzzyFromRules" label-position="top">
          <el-form-item label="搜索字段列表：" prop="searchFieldList">
            <el-checkbox-group v-model="fuzzyFieldSearchConfig.searchFieldList" class="fieldList" @change="fuzzySearchFieldListChange">
              <el-checkbox v-for="row in tableData" :key="row.fieldCode" :label="row.fieldCode">{{ row.fieldName }}</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="提示文本：" prop="placeholder">
            <el-input v-model="fuzzyFieldSearchConfig.placeholder" placeholder="请输入提示文本"></el-input>
          </el-form-item>
          <el-form-item label-width="106px" label="生成sql片段：">
            <el-input v-model="suggestSQL" :autosize="{ minRows: 4, maxRows: 10 }" type="textarea" placeholder="" readonly></el-input>
          </el-form-item>
          <el-form-item label="">
            <div class="color78">提示：生成的sql片段仅供参考</div>
          </el-form-item>
        </el-form>
      </div>
      <div class="right">
        <sql-code-editor ref="ace" v-model="wholeSQL"></sql-code-editor>
      </div>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="handleCloseFuzzyFrom">取消</el-button>
      <el-button type="primary" @click="confirmFuzzyFrom">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { cloneDeep } from "lodash";
export default {
  inject: ["queryGenerateMultiFieldSql", "getListPageId"],
  props: {
    listPageId: {
      type: String,
      default: () => {
        return "";
      }
    }
  },
  data() {
    return {
      tableData: [],
      suggestSQL: "",
      wholeSQL: "",
      fuzzyFromRules: {
        searchFieldList: [{ required: true, validator: this.validatePass, message: "请选择搜索字段列表", trigger: "change" }],
        placeholder: [{ required: true, message: "请输入提示文本", trigger: "change" }]
      },
      originFuzzyFieldSearchConfig: {},
      fuzzyFieldSearchConfig: {
        placeholder: "",
        searchFieldList: []
      },
      dialogVisibleFuzzyFrom: false
    };
  },
  methods: {
    expose_setFuzzyFieldSearchConfig(obj) {
      this.originFuzzyFieldSearchConfig = obj;
      this.fuzzyFieldSearchConfig = cloneDeep(obj);
    },
    expose_initFieldList(val) {
      if (!this.fuzzyFieldSearchConfig.searchFieldList.length && val.length) {
        this.fuzzyFieldSearchConfig.searchFieldList = [val[0].fieldCode];
        this.setFuzzySearchPlaceholder();
      }
    },
    expose_getFuzzyFieldSearchConfig() {
      return this.fuzzyFieldSearchConfig;
    },
    validatePass(rule, value, callback) {
      if (value?.length) {
        callback();
      } else {
        callback(new Error("请选择搜索字段列表"));
      }
    },
    setFuzzySearchPlaceholder() {
      const searchFieldList = this.fuzzyFieldSearchConfig.searchFieldList;
      const fieldNameList = (searchFieldList.length > 2 ? searchFieldList.slice(0, 2) : searchFieldList).map(
        fieldCode => this.tableData.find(item => item.fieldCode === fieldCode).fieldName
      );
      fieldNameList;
      this.fuzzyFieldSearchConfig.placeholder = `输入${fieldNameList.join("、")}${searchFieldList.length > 2 ? "等" : ""}进行搜索`;
    },
    confirmFuzzyFrom() {
      this.$refs.fuzzyFrom.validate(valid => {
        if (valid) {
          this.$emit("handleSaveSql", this.listPageId, this.wholeSQL);
          this.handleCloseFuzzyFrom(false);
          this.$emit("updateOriginFuzzyFieldSearchConfig", cloneDeep(this.fuzzyFieldSearchConfig));
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    },

    handleCloseFuzzyFrom(resetConfig = true) {
      if (resetConfig) this.fuzzyFieldSearchConfig = cloneDeep(this.originFuzzyFieldSearchConfig);
      this.dialogVisibleFuzzyFrom = false;
      this.wholeSQL = "";
      this.suggestSQL = "";
    },
    queryMultiFieldSql(type = "input") {
      const params = {
        listPageId: this.listPageId,
        displayDataType: type,
        fieldNameList: this.fuzzyFieldSearchConfig.searchFieldList
      };
      this.queryGenerateMultiFieldSql(params).then(res => {
        this.$refs.ace.codeValue = this.wholeSQL = res.data.querySql;
        this.$refs.ace.aceEditor.setValue(this.wholeSQL);
        this.suggestSQL = res.data.querySqlFragment;
      });
    },
    fuzzySearchFieldListChange() {
      this.queryMultiFieldSql("input", true);
      this.setFuzzySearchPlaceholder();
    },
    openDlg(val, originFuzzyFieldSearchConfig) {
      this.dialogVisibleFuzzyFrom = true;
      this.expose_setFuzzyFieldSearchConfig(originFuzzyFieldSearchConfig);
      this.tableData = val;
      this.expose_initFieldList(val);
      this.queryMultiFieldSql("input", true);
    }
  }
};
</script>

<style lang="less" scoped>
.setSearchFieldDlg {
  .flex {
    display: flex;
    .left {
      width: 500px;
      box-sizing: border-box;
      padding-right: 15px;

      .fieldList {
        max-height: 280px;
        overflow: auto;
      }
    }

    .right {
      width: 990px;
    }
  }
  .code {
    float: right;
    color: #999;
  }

  .colorRed {
    color: #ef5b5b;
  }
  .color78 {
    color: #787878;
  }
}
</style>
