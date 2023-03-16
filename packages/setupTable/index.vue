<template>
  <div class="content">
    <div class="top">
      页面设计区
      <div class="operate">
        <el-button size="mini" @click="showPreview">预览</el-button>
        <el-button size="mini" type="primary" @click="confirm">保存</el-button>
      </div>
    </div>
    <div class="el-divider el-divider--horizontal"></div>
    <div class="btnDesign">
      <span v-for="(item, index) in btnConfigArr" :key="index">
        <el-button type="" @click="handleDetail(index)">{{ item.tagAttrs.value }}</el-button>
        <i type="danger" class="el-icon-circle-close middle " @click="handleDelBtn(index)"></i>
      </span>

      <el-dropdown @command="handleCommand">
        <el-button type="primary" plain>
          添加功能按钮<i class="el-icon-arrow-down el-icon--right"></i>
        </el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="add">新增按钮</el-dropdown-item>
          <el-dropdown-item command="edit">编辑按钮</el-dropdown-item>
          <el-dropdown-item command="check">查看按钮</el-dropdown-item>
          <el-dropdown-item command="download">导出按钮</el-dropdown-item>
          <el-dropdown-item command="batchDel">批量删除按钮</el-dropdown-item>
          <el-dropdown-item command="custom">自定义按钮</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
      <!-- 
      <el-dropdown @command="handleCommand">
        <span class="el-dropdown-link">
          添加功能按钮<i class="el-icon-arrow-down el-icon--right"></i>
        </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="add">新增按钮</el-dropdown-item>
          <el-dropdown-item command="edit">编辑按钮</el-dropdown-item>
          <el-dropdown-item command="check">查看按钮</el-dropdown-item>
          <el-dropdown-item command="download">导出按钮</el-dropdown-item>
          <el-dropdown-item command="batchDel">批量删除按钮</el-dropdown-item>
          <el-dropdown-item command="custom">自定义按钮</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown> -->
    </div>

    <el-container>
      <el-main>
        <div style="overflow:auto;height: 780px">
          <single-setup-table ref="singleSetupTable" :parse-json="parseJson" :raw-table-data.sync="tableData" edit-mode>
          </single-setup-table>
        </div>
      </el-main>
      <el-aside style="min-width: 60px;background: #fff;padding: 10px; margn-top: 60px;margin-bottom: 60px;">
        <div class="title">常用表格属性设置</div>

        <div class="el-divider el-divider--horizontal"></div>
        <el-form :model="tableAttrs" :rules="rules" ref="ruleForm" label-width="100px">
          <el-form-item label="是否分页" prop="showPagination">
            <el-switch v-model="tableAttrs.showPagination" />
          </el-form-item>
          <el-form-item label="是否显示序号" prop="isShowIndex">
            <el-switch v-model="tableAttrs.isShowIndex" />
          </el-form-item>
          <el-form-item label="是否多选" prop="isShowCheckbox">
            <el-switch v-model="tableAttrs.isShowCheckbox" />
          </el-form-item>
          <el-form-item label="是否斑马线" prop="isShowStripe">
            <el-switch v-model="tableAttrs.isShowStripe" />
          </el-form-item>
          <el-form-item label="是否边框" prop="isShowBorder">
            <el-switch v-model="tableAttrs.isShowBorder" />
          </el-form-item>
          <el-form-item label="是否合并" prop="isShowSummary">
            <el-switch v-model="tableAttrs.isShowSummary" />
          </el-form-item>
          <el-form-item label="合并函数" prop="summaryMethod" v-if="tableAttrs.isShowSummary">
            <el-input v-model="tableAttrs.summaryMethod" type="textarea" :rows="2" placeholder="请输入内容"></el-input>
          </el-form-item>
          <el-form-item label="组件大小" prop="size">
            <el-select v-model="tableAttrs.size" placeholder="请选择">
              <el-option v-for="item in sizeOptions" :key="item.value" :label="item.label" :value="item.value">
              </el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </el-aside>
    </el-container>
    <el-drawer title="按钮属性设置" :visible.sync="drawer" :direction="direction" :before-close="handleClose">
      <setupBtnConfig ref="setupBtnConfig" @onSubmit="onSubmit" @onClose="onClose"></setupBtnConfig>
    </el-drawer>

    <el-dialog title="预览" :visible.sync="dialogVisiblePreview" :close-on-click-modal="false"
      :close-on-press-escape="false" width="900px" :before-close="handleClosePreview">
      <complete-table ref="table" :parse-json="parseJson" :generalRequest="generalRequest">
      </complete-table>
    </el-dialog>
  </div>
</template>

<script>
import { getSingleTableData } from '../../baseConfig/tableBaseConfig'
import { setTableAttrs } from '../../utils';
import completeTable from '../completeTable';
import setupBtnConfig from '../setupBtnConfig';
import singleSetupTable from './components/singleSetupTable';
export default {
  name: 'setupTable',
  components: {
    completeTable,
    singleSetupTable,
    setupBtnConfig,
  },
  props: {
    parseJson: {
      type: Function,
      require: true
    },
    // 获取元数据信息
    requestFieldList: {
      type: Function,
      require: true
    },
    // 保存
    saveListConfigJSON: {
      type: Function,
      require: true
    },
    // 获取可关联表单 
    requestFormList: {
      type: Function,
      require: true
    },
    // 获取已保存数据
    getListConfigJSON: {
      type: Function,
      require: true
    },
    // 获取主键
    requestPrimekey: {
      type: Function,
      require: true
    },
    // 通用请求
    generalRequest: {
      type: Function,
      require: true
    },
  },
  data () {
    return {
      dialogVisibleBtnConfig: false,
      dialogVisiblePreview: false,
      tableData: [getSingleTableData(), getSingleTableData()],
      setupForm: {
      },
      setupFormOptions: [],
      curRowData: {},
      _groupID: '',
      btnConfigArr: [],
      formList: [],
      _options: '',
      direction: 'rtl',
      drawer: false,
      rules: {},
      tableAttrs: {
        showPagination: true,
        isShowIndex: true,
        isShowCheckbox: true,
        isShowStripe: false,
        isShowBorder: false,
        isShowSummary: false,
        summaryMethod: '',
        size: '',
        // 主键
      },
      keyField: '',
      sizeOptions: [{
        value: 'medium',
        label: '中等'
      }, {
        value: 'small',
        label: '小'
      }, {
        value: 'mimi',
        label: '迷你'
      },],
      downloadExpression: 'this.download(this.selectList.map(item => item[this.keyField]))',
      batchDelExpression: 'this.batchDel(this.selectList.map(item => item[this.keyField]))',
      // editExpression: '(() => {if(this.selectList.length === 1){this.primaryKeyValue = this.selectList[0][this.keyField];}else{this.$warn("请确认只选中了一个值")} return this.selectList.length === 1})()',
      editExpression: 'this.selectList.length === 1 ? this.primaryKeyValue = this.selectList[0][this.keyField] : this.$warn("请确认只选中了一个值")',

    };
  },
  mounted () {
    // this.init()
  },
  methods: {
    async init (id = '') {
      console.log(id, 'id');
      this._groupID = id;
      this.queryFormList()
      const { data } = await this.requestTableConfig()
      if (data) {
        const obj = JSON.parse(data);
        const { tableOptions, formOptions, keyField } = obj;
        setTableAttrs(obj, this.tableAttrs)
        this.keyField = keyField;
        this.tableData = tableOptions;
        this.btnConfigArr = formOptions
      } else {
        this.queryFieldList();
        this.getPrimekey()

      }
    },

    requestTableConfig () {
      return this.getListConfigJSON(this._groupID);
    },


    getPrimekey () {
      this.requestPrimekey(this._groupID).then(res => {
        this.keyField = res.data.columnName
      });
    },
    convertData (data) {
      return data.map(item => {
        const rawData = getSingleTableData();
        return {
          ...rawData,
          fieldCode: item.fieldName,
          fieldName: item.fieldDisplayName
        };
      });
    },

    queryFieldList () {
      this.requestFieldList(this._groupID).then(res => {
        this.tableData = this.convertData(res.data);
      });
    },

    queryFormList () {
      this.requestFormList(this._groupID).then(res => {
        this._extraOption = {
          options: res.data, props:
          {
            label: 'formName',
            key: 'formID'
          }
        }

      });
    },

    async confirm () {
      await this.handleSubmitTableConfig();
      this.$emit('onSave');
    },

    getRenderParams () {
      const btnConfigFromArr = this.btnConfigArr
      const json = {
        formOptions: btnConfigFromArr,
        tableOptions: this.$refs.singleSetupTable.expose_getTableData(),
        ...this.tableAttrs
      };
      console.log('handleSubmitTableConfig', json);
      return json;
    },

    handleSubmitTableConfig () {
      const renderParams = this.getRenderParams();
      const params = {
        jsonContent: JSON.stringify(renderParams),
        listPageId: this._groupID
      };
      return this.saveListConfigJSON(params).then((data) => {
        if (data.result === "0") {
          this.$message.success("添加成功");
        } else {
          this.$message.warning("添加失败");
        }
      });
    },

    handleCommand (command) {
      this.drawer = true
      this.$nextTick(() => {
        // 还原配置
        this.$refs.setupBtnConfig.expose_setBtnConfigFromArr(this.btnConfigArr);
        this.$refs.setupBtnConfig.expose_reductionAll();
        this.$refs.setupBtnConfig.expose_setExtraOption(this._extraOption)
        const config = this.$refs.setupBtnConfig.expose_getBtnConfigFrom();
        console.log(command);
        switch (command) {
          case 'add':
            config.tagAttrs.value = '新增'
            config.extraOption.btnType = 'add';
            break
          case 'edit':
            config.tagAttrs.value = '编辑';
            // config.extraOption.defaultFn = this.editExpression;
            config.extraOption.btnType = 'edit';
            break
          case 'check':
            config.tagAttrs.value = '查看';
            // config.extraOption.defaultFn = this.editExpression;
            config.extraOption.btnType = 'check';
            break
          case 'download':
            this.$refs.setupBtnConfig.expose_hideSomeFieldOptions(['extraOption.fn', 'extraOption.openUrl', 'extraOption.isRefresh', 'extraOption.openType', 'extraOption.relateFrom']);
            // config.extraOption.fn = this.downloadExpression
            config.tagAttrs.value = '导出';
            config.extraOption.btnType = 'download';
            break;
          case 'batchDel':
            this.$refs.setupBtnConfig.expose_hideSomeFieldOptions(['extraOption.fn', 'extraOption.openUrl', 'extraOption.isRefresh', 'extraOption.openType', 'extraOption.relateFrom']);
            config.tagAttrs.value = '批量删除'
            config.extraOption.btnType = 'batchDel';
            // config.extraOption.fn = this.batchDelExpression
            break;
          case 'custom':
            config.extraOption.btnType = 'custom';
            break;
          default:
            break;
        }
        this.$refs.setupBtnConfig.expose_setBtnConfigFrom(config);
      })
    },

    handleClosePreview () {
      this.dialogVisiblePreview = false;
    },

    showPreview () {
      this.dialogVisiblePreview = true;
      const renderParams = this.getRenderParams();
      this.$nextTick(() => this.$refs.table.expose_preview(renderParams));
    },

    onSubmit () {
      this.btnConfigArr = this.$refs.setupBtnConfig.expose_getBtnConfigFromArr();
      this.drawer = false
    },

    onClose () { },
    handleDelBtn (index) {
      // this.$refs.setupBtnConfig.expose_delBtnConfigFromArr(index);
      // this.btnConfigArr = this.$refs.setupBtnConfig.expose_getBtnConfigFromArr();
      this.btnConfigArr.splice(index, 1)
    },
    handleDetail (index) {
      this.handleCommand(this.btnConfigArr[index].extraOption.btnType)
      this.$nextTick(() => {
        this.$refs.setupBtnConfig.expose_setBtnConfigFrom(this.btnConfigArr[index]);
      })
    },
    handleClose (done) {
      this.$confirm('确认关闭？')
        .then(_ => {
          done();
        })
        .catch(_ => { });
    }
  }

};
</script>

<style lang="scss" scoped>
.content {
  width: 100%;
  height: 100%;
}

.el-dropdown {
  vertical-align: top;
}

.el-dropdown+.el-dropdown {
  margin-left: 15px;
}

.el-icon-arrow-down {
  font-size: 12px;
}

.title {
  font-size: 18px;
  padding-top: 16px;
}

.el-divider--horizontal {
  display: block;
  height: 1px;
  width: 100%;
  margin: 24px 0;
}

.el-divider {
  background-color: #dcdfe6;
  position: relative;
}

.btnDesign {
  margin: -6px 56px;
}

.middle {
  position: relative;
  left: -8px;
  top: -20px;
  font-size: 16px;
}

.top {
  display: flex;
  justify-content: space-between;
  padding: 0 30px;
  align-items: center
}
</style>
