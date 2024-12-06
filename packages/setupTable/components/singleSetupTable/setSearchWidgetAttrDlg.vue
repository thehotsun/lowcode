<template>
  <el-dialog
    v-dialogDrag
    title="设置搜索控件属性"
    :visible.sync="dialogVisibleFrom"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="1450px"
    :before-close="handleCloseFrom"
    append-to-body
  >
    <div class="flex">
      <div class="left">
        <base-render-form v-if="dialogVisibleFrom" ref="setupForm" :form-data="setupForm" :form-options="setupFormOptions" :use-dialog="false" :show-footer="false">
          <template #searchWidget>
            <el-select v-model="setupForm.searchWidgetType" placeholder="请选择控件类型" filterable @change="changeWidget">
              <el-option v-for="item in searchWidget" :key="item.id" :label="item.cnName" :value="item.id"> </el-option>
            </el-select>
          </template>
          <template #selectDic="{ formData }">
            <el-select :value="formData.request.url" placeholder="请选择字典项" filterable clearable="" @change="changeFormData($event, formData)">
              <el-option v-for="item in dicCodeList" :key="item.dicCode" :label="item.dicName" :value="item.dicCode">
                <span class="code">{{ item.dicCode.split("dicCode=")[1] }}</span>
                <span>{{ item.dicName }}</span>
              </el-option>
            </el-select>
            <el-button @click="requestDicCodeListData">刷新</el-button>
          </template>
        </base-render-form>
        <el-form>
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
      <el-button @click="handleCloseFrom">取消</el-button>
      <el-button type="primary" @click="confirmFrom">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { str2obj, getSetupForm, getSetupFormOptions, setPlaceholder } from "../../../../utils";
import { cloneDeep, merge } from "lodash";
import { searchWidget } from "../../../../baseConfig/tableSelectConfigs";
export default {
  props: {
    generalRequest: {
      type: Function,
      default: () => {}
    },
    listPageId: {
      type: String,
      default: () => {
        return "";
      }
    },
    generateQuerySql: {
      type: Function,
      require: true,
      default: () => {}
    }
  },
  data() {
    return {
      wholeSQL: "",
      suggestSQL: "",
      dicCodeList: [],
      dialogVisibleFrom: false,
      searchWidget,
      setupForm: {},
      setupFormOptions: [],
      curRowData: null
    };
  },
  mounted() {
    this.requestDicCodeListData();
  },
  methods: {
    requestDicCodeListData() {
      this.generalRequest("/dic/list", "get").then(res => {
        this.dicCodeList = res.data.map(item => {
          item.dicCode = `/dic/item/list?dicCode=${item.dicCode}`;
          return item;
        });
      });
    },
    confirmFrom() {
      this.$emit("handleSaveSql", this.listPageId, this.wholeSQL);
      if (this.setupForm.extraOption) {
        this.setupForm.extraOption = str2obj(this.setupForm.extraOption);
      }
      // 将已确认的setupForm更新到tabledata的数据上
      this.curRowData.searchWidgetConfig = this.setupForm;
      this.curRowData.searchWidget = this.setupForm.searchWidgetType;
      this.handleCloseFrom();
      this.$emit("searchOptionsChange");
    },
    changeFormData(value, formData) {
      console.log(formData, value);
      // 防止用户赋值给没有声明的属性值，导致其变为非响应式数据
      this.$set(formData.request, "url", `${value}`);
    },
    querySql(type = "input") {
      const params = {
        listPageId: this.listPageId,
        displayDataType: type,
        fieldNameList: [this.curRowData.fieldCode]
      };
      this.generateQuerySql(params).then(res => {
        this.$refs.ace.codeValue = this.wholeSQL = res.data.querySql;
        this.$refs.ace.aceEditor.setValue(this.wholeSQL);
        this.suggestSQL = res.data.querySqlFragment;
      });
    },

    getDefaultValueForm(searchWidgetName = "el-input", fieldName) {
      const form = getSetupForm(searchWidgetName);
      form.formItemAttrs.label = fieldName;
      form.tagAttrs.placeholder = setPlaceholder(searchWidgetName, fieldName);
      form.sortNumb = this.$parent.getSortNumb();
      // 针对字典项的特殊处理
      if (typeof form.extraOption?.labelTranslateType === "number") {
        form.extraOption = JSON.stringify(form.extraOption);
      }
      return form;
    },
    changeWidget(val) {
      const target = searchWidget.find(widgetitem => widgetitem.id === val);
      const searchWidgetName = target?.tagName;
      const sqlType = target?.sqlType;
      this.suggestSQL = "";
      this.querySql(sqlType);
      this.setupForm = this.getDefaultValueForm(searchWidgetName, this.curRowData.fieldName);
      this.setupFormOptions = this.composeFormOptions(searchWidgetName, this.curRowData);
    },
    openDlg(row) {
      this.curRowData = row;
      this.dialogVisibleFrom = true;
      const target = searchWidget.find(widgetitem => widgetitem.id === row.searchWidget);
      const searchWidgetName = target?.tagName;
      const sqlType = target?.sqlType || "input";
      this.querySql(sqlType);
      this.setupFormOptions = this.composeFormOptions(searchWidgetName, row);
      const searchWidgetConfig = row.searchWidgetConfig;
      const defaultForm = this.getDefaultValueForm(searchWidgetName, row.fieldName);
      if (Object.keys(searchWidgetConfig).length) {
        this.setupForm = merge(defaultForm, cloneDeep(searchWidgetConfig));
        // 针对字典项的特殊处理
        if (typeof this.setupForm.extraOption?.labelTranslateType === "number") {
          this.setupForm.extraOption = JSON.stringify(this.setupForm.extraOption);
        }
      } else {
        this.setupForm = defaultForm;
      }
    },
    // 设置searchForm和装配fromOptions
    composeFormOptions(searchWidgetName = "el-input", row) {
      let formOptions = [];
      // 只有搜索控件有值，才会添加到options中
      if (searchWidgetName) {
        formOptions = getSetupFormOptions(searchWidgetName);
      }
      // 如果是输入框，则考虑关联其他字段，在这里进行填充 el-select的options
      // if (searchWidgetName === 'el-input') {
      //   const target = formOptions.find(item => item.formField === 'relateOtherField')
      //   const options = this.tableData.filter(item => item.fieldCode !== row.fieldCode && item.searchWidget === '' && item.show);
      //   const props = { key: 'fieldCode', label: 'fieldName' }
      //   target.extraOption = {
      //     props,
      //     // 去除自己和已存在筛选框的和未显示的
      //     options: this.supplementLabel(props, options)
      //   }
      // }
      // 由于查询sql接口需要区分单选多选，因此el-select el-cascader 和 dictionary 的多选按钮需要触发相应接口
      if (["el-select", "el-cascader", "dictionary"].includes(searchWidgetName)) {
        const target = formOptions.find(item => ["tagAttrs.multiple", "tagAttrs.props.multiple"].includes(item.formField));
        target.listeners.change = val => this.querySql(val ? "jy-dict-list" : "jy-dict");
      }
      return [
        {
          elRowAttrs: {
            gutter: 10
          },
          formItem: formOptions
        }
      ];
    },
    handleCloseFrom() {
      this.dialogVisibleFrom = false;
      this.setupForm = {};
      this.setupFormOptions = [];
      this.wholeSQL = "";
      this.suggestSQL = "";
    }
  }
};
</script>

<style lang="less" scoped>
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
</style>
