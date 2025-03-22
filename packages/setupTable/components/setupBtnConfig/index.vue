<template>
  <div class="wrap">
    <base-render-form
      ref="form"
      :form-data="btnConfigFrom"
      :form-options="btnConfigFormOptions"
      :use-dialog="useDialog"
      style="background: #fff;padding:5px 20px 30px"
      @onSubmit="onSubmit"
      @onClose="onClose"
    >
      <template #requestUrl="{ formData }">
        <div>
          <el-input v-model="formData.extraOption.requestUrl" style="width: 180px" placeholder="请输入接口地址"></el-input>
          <el-button type="text" @click="handleRequestParamsConfigEdit"> 编辑请求 </el-button>
          <el-button type="text" @click="handleRequestTest"> 测试 </el-button>
        </div>
      </template>

      <template #deliverySelectListFields="{ formData }">
        <div>
          <div class="flex">
            <div v-if="formData.extraOption.deliverySelectListFields.length > 0" class="showdeliveryField">
              {{ getDisplayText(formData.extraOption.deliverySelectListFields) }}
            </div>
            <el-button type="text" @click="showRenameDlg">
              设置 <el-tooltip content="提示：如果不设置提交字段，则默认提交主键字段"><i style="width: 20px" class="el-icon-question"></i> </el-tooltip>
            </el-button>
          </div>
        </div>
      </template>

      <template #color>
        <el-row>
          <span v-for="item in colorList" :key="item">
            <el-button :type="item" @click="setBtnType(item)"></el-button> <i v-if="btnConfigFrom.tagAttrs.type === item" class="el-icon-check middle"></i>
          </span>
        </el-row>
      </template>
      <template #iconName="{ formData }"> <icon-picker v-model="formData.extraOption.iconName"></icon-picker> </template>

      <template #formDownloadSlot class="formDownloadSlot">
        <el-divider content-position="center">打印模板</el-divider>
        <div class="file-actions">
          <!-- 自定义触发按钮 -->
          <el-upload ref="upload" :http-request="uploadFile" class="upload-file" accept=".docx" :show-file-list="false" style="display: inline-block; margin: 0 10px" action="/">
            <el-button type="primary" size="mini" plain icon="el-icon-upload2">
              {{ printDesignForm.templateFileId ? "重新上传" : "上传" }}
            </el-button>
          </el-upload>

          <!-- 上传格式提示组件 -->
          <el-tooltip placement="top" content="本地上传只能上传docx格式的模板">
            <i class="el-icon-question" style="margin-left: 2px; margin-right: 5px"></i>
          </el-tooltip>
          <!-- 条件渲染的下载按钮 -->
          <el-button v-if="printDesignForm.templateFileId" type="" size="mini" @click="handleDesignDown">
            下载
          </el-button>

          <!-- 带条件渲染的删除按钮 -->
          <el-button v-if="printDesignForm.templateFileId" type="danger" size="mini" @click="handleDesignDel">
            删除
          </el-button>

          <el-button v-if="printDesignForm.templateFileId" type="text" @click="handlePreview">
            预览
          </el-button>
        </div>
        <el-divider content-position="center">成果文件</el-divider>
        <div>
          文件名：{{ printDesignForm.resultFileName }} <el-button type="text" @click="handleResultFileName"> {{ printDesignForm.resultFileName ? "编辑" : "命名" }}</el-button>
        </div>
        <el-divider content-position="center">数据设计</el-divider>

        <div>
          自定义字段
          <el-button type="" size="mini" @click="addCustomField">添加</el-button>
        </div>

        <div>
          <el-table :data="printDesignForm.customFields" border stripe max-height="300" style="width: 100%">
            <el-table-column prop="customizedFieldName" label="字段名称" width="150px" align="center" show-overflow-tooltip></el-table-column>
            <el-table-column prop="customizedFieldDisplayName" label="显示名称" align="center" show-overflow-tooltip></el-table-column>
            <el-table-column label="操作" prop="" align="center">
              <template #default="{ row }">
                <el-button type="text" class="operBtn" @click.stop="editCustomField('customField', row)">编辑</el-button>
                <el-button type="text" class="operBtn" @click.stop="delCustomField(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div>
          自定义数据
          <el-button type="" size="mini" @click="editCustomField('customData')">编辑</el-button>
        </div>
        <div>自定义方法： {{ printDesignForm?.customizedMethod }}</div>
        <div>自定义SQL： {{ printDesignForm?.customizedSql }}</div>
      </template>
    </base-render-form>

    <interfaceDlg ref="interfaceDlg" :params-config="paramsConfig" :interface-config="interfaceConfig" @confirm="handleConfirm"></interfaceDlg>

    <fieldRenameDlg ref="fieldRenameDlg" @confirm="handleFieldRenameConfirm"></fieldRenameDlg>
    <!-- 模板弹窗 -->
    <component :is="editPrintTemplateDataDlg" ref="codeMirrorDlg" @ok="getTemplateInfo"></component>
    <!-- 内容构造器 -->
    <setTemplateNameDlg ref="setTemplateNameDlg" @ok="handleUpdateTemplateName"></setTemplateNameDlg>
  </div>
</template>

<script>
import BaseRenderForm from "../../../BaseRenderForm/index";
import { BtnConfigFormOptions, BtnConfigFrom } from "../../../../baseConfig/btnBaseConfig";
import { findFromOptionsIndexByfieldName } from "../../../../utils";
import interfaceDlg from "../dialogs/interfaceDlg.vue";
import fieldRenameDlg from "../dialogs/fieldRenameDlg.vue";
import setTemplateNameDlg from "./components/setTemplateNameDlg.vue";
import IconPicker from "./components/iconPicker";
import { cloneDeep, merge } from "lodash";
function PrintDesignForm() {
  return {
    templateFileId: "",
    templateFileVersion: 1,
    templateFileName: "",
    resultFileName: null,
    customFields: []
  };
}
export default {
  name: "SetupBtnConfig",
  components: {
    interfaceDlg,
    fieldRenameDlg,
    BaseRenderForm,
    IconPicker,
    setTemplateNameDlg
  },
  inject: {
    printTemplateUpload: {
      default: () => () => {}
    },
    getPrintTemplateInfo: {
      default: () => () => {}
    },
    updateTemplateName: {
      default: () => () => {}
    },
    delTemplate: {
      default: () => () => {}
    },
    deleteCustomField: {
      default: () => () => {}
    },
    queryEnterpriseIdhiddenFolder: {
      default: () => () => {}
    },
    enterpriseId: {
      default: () => {}
    },
    downloadUrltoken: {
      default: () => () => {}
    },
    downloadFile: {
      default: () => () => {}
    },
    filePreviewV1: {
      default: () => () => {}
    },
    editPrintTemplateDataDlg: {
      default: () => {}
    }
  },
  props: {
    useDialog: Boolean,
    keyField: {
      type: String,
      default: () => {
        return "";
      }
    },
    groupId: {
      type: String,
      default: () => {
        return "";
      }
    }
  },
  data() {
    return {
      colorList: ["", "primary", "success", "info", "warning", "danger"],
      btnConfigFormOptions: new BtnConfigFormOptions(),
      btnConfigFromArr: [],
      originConfigForm: {},
      btnConfigFrom: new BtnConfigFrom(),
      showParamsConfig: false,
      paramsConfig: {
        params: [],
        data: [],
        headers: []
      },
      printDesignForm: new PrintDesignForm()
      // nameRules: { required: true, trigger: ['blur', 'change'], message: '请输入名称' },
    };
  },
  computed: {
    interfaceConfig() {
      const apiUrl = this.btnConfigFrom.extraOption.requestUrl;
      const apiMethod = this.btnConfigFrom.extraOption.requestType;
      return {
        apiUrl,
        apiMethod
      };
    }
  },

  created() {
    // const target = this.btnConfigFormOptions.find(option => option.formItem.formField === 'authorize');
    // if (target) {
    //   target.listeners = {
    //     change: this.handleAuthorizeChange
    //   }
    // }
  },

  mounted() {},
  methods: {
    expose_reductionAll() {
      this.btnConfigFormOptions = new BtnConfigFormOptions();
      this.btnConfigFrom = new BtnConfigFrom();
      this.printDesignForm = new PrintDesignForm();
    },

    expose_hideSomeFieldOptions(fieldName) {
      if (typeof fieldName === "string") {
        fieldName = [fieldName];
      } else if (Array.isArray(fieldName)) {
        fieldName.map(item => {
          const index = findFromOptionsIndexByfieldName(this.btnConfigFormOptions, item);
          console.log(index, "index");
          index !== -1 && this.btnConfigFormOptions.splice(index, 1);
        });
      } else {
        console.error("expose_hideSomeFieldOptions只能接受字符串或者数组");
      }
    },

    expose_setBtnConfigFormOptions(options) {
      this.btnConfigFormOptions = options;
    },

    expose_getBtnConfigFormOptions() {
      return this.btnConfigFormOptions;
    },

    expose_getRawBtnConfigFormOptions() {
      return new BtnConfigFormOptions();
    },

    expose_getBtnConfigFromArr() {
      return this.btnConfigFromArr;
    },

    expose_setBtnConfigFromArr(arr) {
      this.btnConfigFromArr = arr;
    },

    expose_setBtnConfigFrom(obj, isEdit = false) {
      this.originConfigForm = obj;
      const btnDefaultConfigFrom = new BtnConfigFrom();
      if (!isEdit) {
        // 获取所有现有ID的集合（性能优化）
        const existingIds = new Set(this.btnConfigFromArr.map(item => item.btnId));
        console.log("existingIds", existingIds, existingIds.has(btnDefaultConfigFrom.btnId));
        // 安全计数器防止无限循环
        let attempts = 0;
        const maxAttempts = 200;
        do {
          // 首次循环检查初始ID是否可用
          if (attempts === 0 && !existingIds.has(btnDefaultConfigFrom.btnId)) {
            console.log("break");
            break;
          }

          // 生成新ID
          btnDefaultConfigFrom.btnId = Math.floor(Math.random() * 900) + 100;
          attempts++;

          // 当尝试次数超过理论最大值时报错
          if (attempts > maxAttempts) {
            throw new Error("无法生成唯一ID，尝试次数超过200次");
          }
        } while (existingIds.has(btnDefaultConfigFrom.btnId));
      }
      this.btnConfigFrom = merge(btnDefaultConfigFrom, obj);
      if (isEdit && this.btnConfigFrom.extraOption.btnType === "formDownload") {
        this.getTemplateInfo();
      }
    },

    expose_getBtnConfigFrom() {
      return this.btnConfigFrom;
    },

    expose_setExtraOption(options, field) {
      let target;
      this.btnConfigFormOptions.some(item => {
        if (item.formItem.child?.length) {
          const index = item.formItem.child.findIndex(child => child.formField === field);
          if (index !== -1) {
            target = item.formItem.child[index];
          }
          return target;
        }
        if (item.formItem.formField === field) {
          target = item.formItem;
        }
        return target;
      });
      console.log(target, "target");
      if (target) {
        target.extraOption = options;
      }
    },

    expose_delBtnConfigFromArr(index) {
      this.btnConfigFromArr.splice(index, 1);
    },

    getExtraOption(field) {
      let target;
      this.btnConfigFormOptions.some(item => {
        if (item.formItem.child?.length) {
          const index = item.formItem.child.findIndex(child => child.formField === field);
          if (index !== -1) {
            target = item.formItem.child[index];
          }
          return target;
        }
        if (item.formItem.formField === field) {
          target = item.formItem;
        }
        return target;
      });
      return target.extraOption;
    },

    handleRequestParamsConfigEdit(dlgParams) {
      this.paramsConfig = {
        ...this.paramsConfig,
        ...cloneDeep(this.btnConfigFrom.extraOption.requestParamsConfig)
      };
      this.$refs.interfaceDlg.showDlg(dlgParams);
    },

    handleRequestTest() {
      this.handleRequestParamsConfigEdit({
        hiddenFooter: true,
        showTestRequest: true
      });
    },

    handleConfirm(paramsConfig) {
      this.btnConfigFrom.extraOption.requestParamsConfig = paramsConfig;
    },

    onSubmit(data) {
      const iconName = data.extraOption.iconName;
      const val = data.extraOption.iconPosition;
      if (val === "front") {
        data.tagAttrs.icon = iconName;
        data.contentTextBehindTagOptions = {};
      } else {
        data.tagAttrs.icon = "";
        data.contentTextBehindTagOptions = {
          tagName: "i",
          className: iconName
        };
      }
      // 如果相同则说明是编辑，不同则是新增
      if (!this.btnConfigFromArr.some(item => item === this.originConfigForm)) {
        data.renderId = Math.random();
        this.btnConfigFromArr.push(data);
      } else {
        Object.assign(this.originConfigForm, data);
      }
      this.$emit("onSubmit");
      this.btnConfigFrom = new BtnConfigFrom();
      this.printDesignForm = new PrintDesignForm();
    },
    onClose() {
      this.$emit("onClose");
      this.originConfigForm = {};
      this.printDesignForm = new PrintDesignForm();
      this.btnConfigFrom = new BtnConfigFrom();
    },
    setBtnType(type) {
      this.btnConfigFrom.tagAttrs.type = type;
    },

    showRenameDlg() {
      const deliverySelectListFields = this.btnConfigFrom.extraOption.deliverySelectListFields;
      const fieldArr = this.getExtraOption("extraOption.deliverySelectListFields")?.options?.map(item => {
        const target = deliverySelectListFields?.find?.(filedInfo => filedInfo?.fieldCode === item.fieldCode || filedInfo === item.fieldCode);
        return {
          errorMessage: "",
          fieldCode: item.fieldCode,
          fieldName: item.fieldName,
          renamed: target?.renamed || "",
          isSelected: !!target
        };
      });
      const target = deliverySelectListFields?.find?.(filedInfo => filedInfo?.fieldCode === this.keyField || filedInfo === this.keyField);
      fieldArr.unshift({
        errorMessage: "",
        fieldCode: this.keyField,
        fieldName: "主键",
        // this?.btnConfigFrom?.extraOption?.paramName 是 paramName字段的兼容性代码
        renamed: target?.renamed || this?.btnConfigFrom?.extraOption?.paramName || "",
        isSelected: !!target
      });
      this.$refs.fieldRenameDlg.openDialog(fieldArr);
      console.log("showRenameDlg");
    },

    handleFieldRenameConfirm(deliverySelectListFields) {
      this.btnConfigFrom.extraOption.deliverySelectListFields = deliverySelectListFields;
      // paramName字段的兼容性代码
      if (this.btnConfigFrom.extraOption.openType === 5 && this.btnConfigFrom.extraOption.paramName) {
        this.btnConfigFrom.extraOption.paramName = "";
      }
    },

    getDisplayText(deliverySelectListFields) {
      const that = this;
      function getLabel(field) {
        if (typeof field === "string") {
          field = that.getExtraOption("extraOption.deliverySelectListFields")?.options?.find(item => item.fieldCode === field);
        }
        return `${field?.fieldName}(${field?.renamed || field?.fieldCode})`;
      }
      let str = "";
      str += getLabel(deliverySelectListFields[0]);
      if (deliverySelectListFields.length > 1) {
        str += "， ";
        str += getLabel(deliverySelectListFields[1]);
      }
      const maxlength = 30;
      if (deliverySelectListFields.length > 2 || str.length > maxlength) {
        str = str.slice(0, maxlength) + "...";
      }
      return str;
    },

    async uploadFile({ file }) {
      try {
        this.loading = true;
        const data = new FormData();
        data.append("file", file);
        data.append("listPageId", this.groupId);
        data.append("buttonId", this.btnConfigFrom.btnId);
        await this.printTemplateUpload(data);
        this.$success("上传成功");
        this.getTemplateInfo();
      } catch (error) {
        console.error(error);
        this.$message.error("上传失败");
        this.loading = false;
      }
    },

    // 隐藏文件夹
    async getFolder() {
      const { data } = await this.queryEnterpriseIdhiddenFolder(this.enterpriseId);
      return data || "";
    },

    handleDesignDown() {
      // TODO
      const fileId = this.printDesignForm.templateFileId;
      const url = this.downloadUrltoken("EnterpriseDoc", fileId);
      this.downloadFile(url);
    },
    handleResultFileName() {
      this.$refs.setTemplateNameDlg.handleGenerateName(this.printDesignForm.resultFileName, this.groupId);
    },

    async handleUpdateTemplateName(resultFileName) {
      const params = {
        listPageId: this.groupId,
        buttonId: this.btnConfigFrom.btnId,
        resultFileName
      };
      await this.updateTemplateName(params);
      this.getTemplateInfo();
    },

    handleDesignDel() {
      this.$confirm("警告：如果删除模板，将不会再生成成果文件，确认继续吗？", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(async () => {
        await this.delTemplate(this.groupId, this.btnConfigFrom.btnId);
        this.getTemplateInfo();
      });
    },
    handlePreview() {
      const { templateFileId: fileId, templateFileVersion: versionId } = this.printDesignForm;
      const data = { fileId, versionId, fileType: 12 };
      this.filePreviewV1(data);
    },
    addCustomField() {
      this.$refs.codeMirrorDlg.open({ val: "customField", mode: 0, listPageId: this.groupId, buttonId: this.btnConfigFrom.btnId }, "table");
    },
    editCustomField(val, row) {
      let params = {};
      if (val === "customField") {
        params = { ...row };
      } else {
        params = {
          customizedMethod: this.printDesignForm.customizedMethod,
          customizedSql: this.printDesignForm.customizedSql
        };
      }
      this.$refs.codeMirrorDlg.open({ val, mode: 1, listPageId: this.groupId, buttonId: this.btnConfigFrom.btnId, params }, "table");
    },
    async delCustomField(row) {
      await this.$confirm(`您确定要删除这个自定义字段吗?`, { type: "warning" });
      const { customizedFieldName } = row;
      await this.deleteCustomField(customizedFieldName, this.groupId, this.btnConfigFrom.btnId);
      this.$message.success("删除成功");
      this.getTemplateInfo();
    },
    async getTemplateInfo() {
      const res = await this.getPrintTemplateInfo(this.groupId, this.btnConfigFrom.btnId);
      this.printDesignForm = res.data || new PrintDesignForm();
    }

    // handleAuthorizeChange (authorize) {
    //   const map = {
    //     A: 'add',
    //     U: 'edit',
    //     V: 'check',
    //     D: 'batchDel',
    //     E: 'download',
    //     I: 'import',
    //   }
    //   this.btnConfigFrom.btnType = map[authorize]
    // },

    // setRules () {
    //   const target1 = this.btnConfigFormOptions.find(item => item.formItem.formField === 'extraOption.relateFrom')
    //   target1.formItem.formItemAttrs.rules = {
    //     validator: this.validateRelateFrom,
    //     trigger: 'change',
    //   }
    //   const target2 = this.btnConfigFormOptions.find(item => item.formItem.formField === 'extraOption.flowKey')
    //   target2.formItem.formItemAttrs.rules = {
    //     validator: this.validateFlowKey,
    //     trigger: 'change',
    //   }
    //   const target3 = this.btnConfigFormOptions.find(item => item.formItem.formField === 'extraOption.openUrl')
    //   target3.formItem.formItemAttrs.rules = {
    //     validator: this.validateOpenUrl,
    //     trigger: 'blur',
    //   }
    // },

    // validateRelateFrom (rule, value, callback) {
    //   console.log('././');
    //   if (this.btnConfigFrom.extraOption.openType === 0 && !value) {
    //     callback(new Error('请选择表单'));
    //   } else {
    //     callback();
    //   }
    // },
    // validateOpenUrl (rule, value, callback) {
    //   if ([1, 3].includes(this.btnConfigFrom.extraOption.openType) && !value) {
    //     callback(new Error('请输入url'));
    //   } else {
    //     callback();
    //   }
    // },
    // validateFlowKey (rule, value, callback) {
    //   if (this.btnConfigFrom.extraOption.openType === 2 && !value) {
    //     callback(new Error('请选择流程'));
    //   } else {
    //     callback();
    //   }
    // },
  }
};
</script>

<style lang="less" scoped>
.wrap {
  width: 100%;
  height: 100%;

  .middle {
    vertical-align: -webkit-baseline-middle;
  }

  .edit {
    position: fixed;
    top: 20%;
    left: 0;
    right: 0;
    z-index: 999;
  }

  .flex {
    display: flex;
    align-items: center;
  }

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
  .formDownloadSlot {
    padding: 0 30px;
  }

  .showdeliveryField {
    display: inline-block;
    white-space: nowrap; /* 不允许文本换行 */
  }
  ::v-deep .el-form-item {
    margin-bottom: 8px !important;
  }
}
</style>
