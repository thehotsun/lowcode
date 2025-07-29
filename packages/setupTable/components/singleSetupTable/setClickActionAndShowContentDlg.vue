<template>
  <el-dialog
    v-dialogDrag
    title="设置点击行为和展示内容"
    :visible.sync="dialogVisibleContentTextAttr"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="900px"
    class="setClickActionAndShowContentDlg"
    :before-close="handleCloseContentTextAttr"
    append-to-body
  >
    <div class="flex">
      <el-tabs v-model="editableTabsValue" type="card" editable @edit="handleTabsEdit">
        <el-tab-pane v-for="item in editableTabs" :key="item.name" :label="item.title" :name="item.name">
          <el-form ref="form" :model="contentTextAttrForm" label-width="160px">
            <el-form-item label="关联按钮：">
              <el-tooltip slot="label" class="fontSize14" effect="dark" content="此渲染内容的点击行为相当于选中当前行后立刻点击关联的这个按钮" placement="top-start">
                <span>关联按钮<i style=";width: 20px;" class="el-icon-question"></i>：</span>
              </el-tooltip>
              <el-select v-model="contentTextAttrForm.clickEvent.relateBtnId" placeholder="请选择关联按钮" filterable clearable="">
                <el-option v-for="btnItem in btnConfigArr" :key="btnItem.btnId" :label="btnItem.tagAttrs.value" :value="btnItem.btnId"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="字体大小：">
              <el-input-number v-model="contentTextAttrForm.fontSize" :min="1" :max="100"></el-input-number>
            </el-form-item>
            <el-form-item label="字体样式：">
              <el-checkbox v-model="contentTextAttrForm.isBold">变粗</el-checkbox>
              <el-checkbox v-model="contentTextAttrForm.isItalic">斜体</el-checkbox>
              <el-checkbox v-model="contentTextAttrForm.isStrikethrough">删除线</el-checkbox>
              <el-checkbox v-model="contentTextAttrForm.isUnderline">下划线</el-checkbox>
              <el-checkbox v-model="contentTextAttrForm.cursor" true-label="pointer" false-label="inherit">
                <el-tooltip class="fontSize14" effect="dark" content="鼠标移动到内容上是否展示一个小手的标识" placement="top-start">
                  <span>显示点击标识<i style="width: 20px;" class="el-icon-question"></i></span>
                </el-tooltip>
              </el-checkbox>
            </el-form-item>
            <el-form-item label="字体颜色：">
              <div class="flexCenter">
                <el-color-picker v-model="contentTextAttrForm.color"></el-color-picker>
                <span style="margin-left: 10px">
                  快捷按钮：
                </span>
                <el-button type="text" style="color: #409eff;" @click="setColor('#409eff')">主要-蓝色</el-button>
                <el-button type="text" style="color: #67c23a;" @click="setColor('#67c23a')">成功-绿色</el-button>
                <el-button type="text" style="color: #e6a23c;" @click="setColor('#e6a23c')">警告-橙色</el-button>
                <el-button type="text" style="color: #f56c6c;" @click="setColor('#f56c6c')">危险-红色</el-button>
                <el-button type="text" style="color: #909399;" @click="setColor('#909399')">信息-灰色</el-button>
              </div>
            </el-form-item>

            <el-form-item label="显示文本：">
              <el-tooltip
                slot="label"
                class="fontSize14"
                effect="dark"
                content="新增操作列输入什么展示什么，如果不输入则不展示。非新增操作列如果输入显示文本，则会覆盖原本prop的值, 如果不想展示任何文本，请输入一个空格"
                placement="top-start"
              >
                <span>显示文本<i style="width: 20px" class="el-icon-question"></i>：</span>
              </el-tooltip>
              <el-input v-model="contentTextAttrForm.textVal"></el-input>
            </el-form-item>
            <el-form-item label="图标：">
              <el-tooltip slot="label" class="fontSize14" effect="dark" content="如果选择图标，则会覆盖原本prop的值" placement="top-start">
                <span>图标<i style="width: 20px" class="el-icon-question"></i>：</span>
              </el-tooltip>
              <icon-picker v-model="contentTextAttrForm.iconName"></icon-picker>
            </el-form-item>
            <el-form-item label="图标位置：">
              <el-radio-group v-model="contentTextAttrForm.iconPosition">
                <el-radio label="front">icon前置</el-radio>
                <el-radio label="behind">icon后置</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="图标样式：">
              <el-tooltip slot="label" class="fontSize14" effect="dark" content="用于设置icon行内样式，大部分使用场景为设置和另一渲染内容或文字的间距" placement="top-start">
                <span>图标样式<i style="width: 20px" class="el-icon-question"></i>：</span>
              </el-tooltip>
              <el-input v-model="contentTextAttrForm.iconStyle"></el-input>
            </el-form-item>
            <el-form-item label="文字样式：">
              <el-tooltip slot="label" class="fontSize14" effect="dark" content="用于设置文字样式，大部分使用场景为设置和另一渲染内容或icon的间距" placement="top-start">
                <span>文字样式<i style="width: 20px" class="el-icon-question"></i>：</span>
              </el-tooltip>
              <el-input v-model="contentTextAttrForm.textStyle"></el-input>
            </el-form-item>
            <el-form-item label="条件判断：">
              <el-tooltip slot="label" class="fontSize14" effect="dark" content="通过函数返回值确认当前行为是否被展示，返回true展示，返回false隐藏" placement="top-start">
                <span>判断显隐<i style="width: 20px" class="el-icon-question"></i>：</span>
              </el-tooltip>
              <el-input
                v-model="contentTextAttrForm.conditionalJudgment"
                placeholder="请输入function(row){ return true}格式"
                @focus="handleShow('conditionalJudgment', '判断显隐函数', $event)"
              ></el-input>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
    <onlineCode
      v-if="showCodeEditor"
      :title="codeEditorTil"
      :model-value="contentTextAttrForm[curFn]"
      :code-example-val="setClickActionAndShowCodeExampleList[curFn]"
      @confirm="handleEditorInput"
      @close="handleClose"
    ></onlineCode>
    <span slot="footer" class="dialog-footer">
      <el-button @click="handleCloseContentTextAttr">取消</el-button>
      <el-button type="primary" @click="confirmContentTextAttr">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { ContentTextAttrForm } from "../../../../baseConfig/tableBaseConfig";
import IconPicker from "../setupBtnConfig/components/iconPicker";
import { setClickActionAndShowCodeExampleList } from "/utils/codeExampleList";
import { cloneDeep, merge } from "lodash";
import onlineCode from "/packages/completeTable/component/onlineCode.vue";
export default {
  components: { IconPicker, onlineCode },
  props: {
    generalRequest: {
      type: Function,
      default: () => {}
    },
    btnConfigArr: {
      type: Array,
      default: () => {
        return [];
      }
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
      setClickActionAndShowCodeExampleList,
      curRowData: null,
      editableTabs: [
        {
          title: "渲染内容1",
          name: "0",
          contentTextAttrForm: new ContentTextAttrForm()
        }
      ],
      contentTextAttrForm: new ContentTextAttrForm(),
      editableTabsValue: "0",
      dialogVisibleContentTextAttr: false,
      showCodeEditor: false,
      curFn: "",
      codeEditorTil: ""
    };
  },

  watch: {
    editableTabsValue: {
      handler(val) {
        this.contentTextAttrForm = this.editableTabs[val].contentTextAttrForm;
        console.log(this.contentTextAttrForm, val, this.editableTabs[val].contentTextAttrForm, "2");
      }
    }
  },
  methods: {
    openDlg(row) {
      this.curRowData = row;
      this.editableTabsValue = "0";
      if (row.contentTextAttrArr && row.contentTextAttrArr.length) {
        this.editableTabs = [];
        row.contentTextAttrArr.map((contentTextAttr, index) => {
          this.editableTabs.push({
            title: "渲染内容" + (index + 1),
            name: index + "",
            contentTextAttrForm: merge(new ContentTextAttrForm(), cloneDeep(contentTextAttr))
          });
        });
      } else {
        this.editableTabs = [
          {
            title: "渲染内容1",
            name: "0",
            contentTextAttrForm: new ContentTextAttrForm()
          }
        ];
      }
      this.contentTextAttrForm = this.editableTabs[this.editableTabsValue].contentTextAttrForm;
      console.log("1", this.editableTabs[this.editableTabsValue].contentTextAttrForm);
      this.dialogVisibleContentTextAttr = true;
    },
    handleCloseContentTextAttr() {
      this.dialogVisibleContentTextAttr = false;
    },
    async handleShow(field, codeEditorTil) {
      this.curFn = field;
      this.codeEditorTil = codeEditorTil;
      this.showCodeEditor = true;
    },
    handleClose() {
      this.showCodeEditor = false;
    },
    handleEditorInput(value) {
      // 处理编辑器输入的逻辑
      this.contentTextAttrForm[this.curFn] = value;
    },
    setColor(color) {
      this.contentTextAttrForm.color = color;
    },
    confirmContentTextAttr() {
      this.curRowData.contentTextAttrArr = this.editableTabs.map(tab => tab.contentTextAttrForm);
      this.handleCloseContentTextAttr();
    },
    handleTabsEdit(targetName, action) {
      if (action === "add") {
        const newTabName = this.editableTabs.length;
        this.editableTabs.push({
          title: "渲染内容" + (newTabName + 1),
          name: newTabName + "",
          contentTextAttrForm: new ContentTextAttrForm()
        });
        this.editableTabsValue = newTabName + "";
      }
      if (action === "remove") {
        this.editableTabs = this.editableTabs
          .filter(tab => tab.name !== targetName)
          .map((tab, index) => {
            tab.name = `${index}`;
            tab.title = "渲染内容" + (index + 1);
            return tab;
          });
        const activeName = this.editableTabsValue;
        if (activeName > targetName) {
          this.editableTabsValue = --this.editableTabsValue + "";
        }
        if (activeName === targetName) {
          if (activeName === this.editableTabs.length + "") {
            this.editableTabsValue = --this.editableTabsValue + "";
          } else {
            this.contentTextAttrForm = this.editableTabs[this.editableTabsValue].contentTextAttrForm;
          }
        }
      }
    }
  }
};
</script>

<style lang="less" scoped>
.setClickActionAndShowContentDlg {
}
</style>
