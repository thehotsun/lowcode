<template>
  <el-dialog
    title="树属性设置"
    :visible.sync="dialogVisibleTreeAttrs"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="1160px"
    :before-close="handleCloseTreeAttrs"
  >
    <div style="min-width: 60px;background: #fff;padding: 10px;">
      <el-tabs v-model="activeName">
        <el-tab-pane label="数据源设置" name="first">
          <treeConfig :form="treeAttrs"></treeConfig>
        </el-tab-pane>
        <el-tab-pane label="属性设置" name="second">
          <el-form ref="ruleForm" :model="treeAttrs" :rules="isDataModel ? rules1 : rules2" label-width="150px" style="padding-bottom: 20px">
            <el-form-item label="基础配置" prop="showCheckbox">
              <el-checkbox v-model="treeAttrs.showCheckbox">复选框</el-checkbox>
              <el-checkbox v-model="treeAttrs.filter">过滤框</el-checkbox>
              <el-tooltip
                class="item"
                effect="dark"
                content="是否在点击节点的时候展开或者收缩节点， 默认值为 true，如果为 false，则只有点箭头图标的时候才会展开或者收缩节点。"
                placement="top-start"
              >
                <el-checkbox v-model="treeAttrs.expandOnClickNode">
                  <span style="cursor: pointer;font-size: 14px">点击节点可收缩<i style="width: 20px" class="el-icon-question"></i></span>
                </el-checkbox>
              </el-tooltip>
              <el-checkbox v-model="treeAttrs.defaultExpandAll">默认展开所有节点</el-checkbox>
              <el-checkbox v-model="treeAttrs.lazy">懒加载</el-checkbox>
              <el-tooltip class="item" effect="dark" content="是否每次只打开一个同级树节点展开" placement="top-start">
                <el-checkbox v-model="treeAttrs.accordion">
                  <span style="cursor: pointer;font-size: 14px">手风琴模式<i style="width: 20px" class="el-icon-question"></i></span>
                </el-checkbox>
              </el-tooltip>

              <el-tooltip class="item" effect="dark" content="是否第一个节点高亮，比默认选中优先级低" placement="top-start">
                <el-checkbox v-model="treeAttrs.currentNodeKeyFirst">
                  <span style="cursor: pointer;font-size: 14px">默认第一个节点高亮<i style="width: 20px" class="el-icon-question"></i></span>
                </el-checkbox>
              </el-tooltip>
            </el-form-item>
            <el-row>
              <el-col :span="8">
                <el-form-item label="指定nodeId" prop="nodeKey">
                  <el-tooltip slot="label" class="item" effect="dark" content="每个树节点用来作为唯一标识的属性，整棵树应该是唯一的" placement="top-start">
                    <span style="cursor: pointer;font-size: 14px">指定nodeId<i style="width: 20px" class="el-icon-question"></i></span>
                  </el-tooltip>
                  <!-- <el-select v-if="isDataModel" v-model="treeAttrs.nodeKey" size="small" placeholder="请选择">
                <el-option v-for="item in deliveryFieldsOption.options" :key="item.id" :label="item.cnName" :value="item.id"> </el-option>
              </el-select> -->
                  <el-input v-model="treeAttrs.nodeKey" clearable size="small" placeholder="请输入"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="指定nodeName" prop="propsLabel">
                  <el-tooltip slot="label" class="item" effect="dark" content="节点文本展示的字段值" placement="top-start">
                    <span style="cursor: pointer;font-size: 14px">指定nodeName<i style="width: 20px" class="el-icon-question"></i></span>
                  </el-tooltip>
                  <!-- <el-select v-if="isDataModel" v-model="treeAttrs.propsLabel" size="small" placeholder="请选择">
                <el-option v-for="item in deliveryFieldsOption.options" :key="item.id" :label="item.cnName" :value="item.id"> </el-option>
              </el-select> -->
                  <el-input v-model="treeAttrs.propsLabel" clearable size="small" placeholder="请输入"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="指定children" prop="propsChildren">
                  <el-tooltip slot="label" class="item" effect="dark" content="指定子树为节点对象的某个属性值" placement="top-start">
                    <span style="cursor: pointer;font-size: 14px">指定children<i style="width: 20px" class="el-icon-question"></i></span>
                  </el-tooltip>
                  <!-- <el-select v-if="isDataModel" v-model="treeAttrs.propsChildren" size="small" placeholder="请选择">
                <el-option v-for="item in deliveryFieldsOption.options" :key="item.id" :label="item.cnName" :value="item.id"> </el-option>
              </el-select> -->
                  <el-input v-model="treeAttrs.propsChildren" clearable size="small" placeholder="请输入"></el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row>
              <el-col :span="8">
                <el-form-item label="当前选中">
                  <el-tooltip slot="label" class="item" effect="dark" content="匹配中的值会高亮,这里应该是你想当前选中节点的nodeId的值" placement="top-start">
                    <span style="cursor: pointer;font-size: 14px">当前选中<i style="width: 20px" class="el-icon-question"></i></span>
                  </el-tooltip>
                  <el-input v-model="treeAttrs.currentNodeKey" clearable size="small" placeholder="请输入nodeId的值"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="默认展开">
                  <el-tooltip slot="label" class="item" effect="dark" content="默认展开的节点的nodeId的数组" placement="top-start">
                    <span style="cursor: pointer;font-size: 14px">默认展开<i style="width: 20px" class="el-icon-question"></i></span>
                  </el-tooltip>
                  <el-input v-model="treeAttrs.defaultExpandedKeys" clearable size="small" placeholder="请输入数组格式nodeId的值"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="默认选中">
                  <el-tooltip slot="label" class="item" effect="dark" content="只有显示复选框时才生效，匹配的节点复选框会被选中" placement="top-start">
                    <span style="cursor: pointer;font-size: 14px">默认选中<i style="width: 20px" class="el-icon-question"></i></span>
                  </el-tooltip>
                  <el-input v-model="treeAttrs.defaultCheckedKeys" clearable size="small" placeholder="请输入数组格式nodeId的值"></el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row>
              <el-col :span="8">
                <el-form-item label="" prop="props">
                  <el-tooltip slot="label" class="item" effect="dark" content="单位支持px和%，不填单位默认px" placement="top-start">
                    <span style="cursor: pointer;font-size: 14px">宽度（px|%）<i style="width: 20px" class="el-icon-question"></i></span>
                  </el-tooltip>
                  <el-input v-model="treeAttrs.width" clearable size="small" placeholder="请输入宽度"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="自定义图标">
                  <el-tooltip slot="label" class="fontSize14" effect="dark" content="如果选择图标，则会替换原本▶的icon" placement="top-start">
                    <span style="font-size: 14px;">自定义图标<i style="width: 20px; font-size: 14px;" class="el-icon-question"></i></span>
                  </el-tooltip>
                  <icon-picker v-model="treeAttrs.iconClass" size="small"></icon-picker>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="自定义样式" prop="style">
              <el-tooltip slot="label" class="item" effect="dark" content="应用到整个区域（包括输入框）的外层" placement="top-start">
                <span style="cursor: pointer;font-size: 14px">自定义样式<i style="width: 20px" class="el-icon-question"></i></span>
              </el-tooltip>
              <el-input v-model="treeAttrs.style" clearable size="small" placeholder="请输入样式"></el-input>
            </el-form-item>

            <el-form-item v-if="treeAttrs.lazy" label="懒加载函数">
              <el-input
                v-model="treeAttrs.loadFn"
                size="small"
                placeholder="请输入function(node, resolve){ if (node.level === 0) {
          return resolve([{ name: 'region' }]);
        }}格式"
                @focus="handleShow('loadFn', '懒加载函数', $event)"
              ></el-input>
            </el-form-item>

            <el-form-item label="数据转换函数">
              <el-tooltip
                slot="label"
                class="item"
                effect="dark"
                content="由于当前通过sql查询很难直接生成树形结构所需的数据结构，因此通过此函数进行数据结构转换（优先级最高）"
                placement="top-start"
              >
                <span style="cursor: pointer;font-size: 14px">数据转换函数</span><i style="width: 20px; font-size: 14px;" class="el-icon-question"></i>
              </el-tooltip>
              <el-input
                v-model="treeAttrs.dataTransitionFn"
                size="small"
                placeholder="请输入数据转换函数"
                @focus="handleShow('dataTransitionFn', '数据转换函数', $event)"
              ></el-input>
            </el-form-item>
            <el-form-item v-if="false" label="数据转换配置">
              <el-tooltip
                slot="label"
                class="item"
                effect="dark"
                content="由于当前通过sql查询很难直接生成树形结构所需的数据结构，因为通过配置父子字段进行数据关联生成树状结构（优先级最比数据转换函数低）"
                placement="top-start"
              >
                <span style="cursor: pointer;font-size: 14px">数据转换配置<i style="width: 20px" class="el-icon-question"></i></span>
              </el-tooltip>
              <span>父级id字段：</span>
              <el-input v-model="treeAttrs.dataTransitionParentField" size="small" placeholder="请输入" class="w315"></el-input>
              <!-- <el-select v-model="treeAttrs.dataTransitionParentField" size="small" placeholder="请选择">
                <el-option v-for="item in deliveryFieldsOption.options" :key="item.id" :label="item.cnName" :value="item.id"> </el-option>
              </el-select> -->
              <span>id字段：</span>
              <!-- <el-select v-model="treeAttrs.dataTransitionCurField" size="small" placeholder="请选择">
                <el-option v-for="item in deliveryFieldsOption.options" :key="item.id" :label="item.cnName" :value="item.id"> </el-option>
              </el-select> -->
              <el-input v-model="treeAttrs.dataTransitionCurField" size="small" placeholder="请输入" class="w315"></el-input>
            </el-form-item>

            <el-form-item label="渲染函数">
              <el-input
                v-model="treeAttrs.renderContent"
                size="small"
                placeholder="请输入function(h, { node, data, store }){ return <span>{node.label}</span>}格式"
                @focus="handleShow('renderContent', '渲染函数', $event)"
              ></el-input>
            </el-form-item>

            <el-form-item label="筛选函数">
              <el-input
                v-model="treeAttrs.filterFn"
                size="small"
                placeholder="请输入function(value, data){  return data.label.indexOf(value) !== -1;}格式"
                @focus="handleShow('filterFn', '筛选函数', $event)"
              ></el-input>
            </el-form-item>

            <el-form-item label="点击事件">
              <el-input v-model="treeAttrs.nodeClick" size="small" placeholder="请输入function(data){ }格式" @focus="handleShow('nodeClick', '点击事件', $event)"></el-input>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="handleCloseTreeAttrs">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </span>
    <el-dialog :before-close="handleClose" :title="codeEditorTil" :visible="showCodeEditor" width="900px" :append-to-body="true">
      <js-code-editor ref="chEditor" mode="javascript" :readonly="false" :value="treeAttrs[curFn]" @input="handleEditorInput"></js-code-editor>
      <codeExample :val="treeAttrsCodeExampleList[curFn]" @copy="handleCopy"></codeExample>
    </el-dialog>
  </el-dialog>
</template>

<script>
import { TreeAttrs } from "/baseConfig/treeBaseConfig";
import IconPicker from "../setupBtnConfig/components/iconPicker";
import { cloneDeep } from "lodash";
import treeConfig from "./components/treeConfig.vue";
import codeExample from "./components/codeExample.vue";
import { treeAttrsCodeExampleList } from "/utils/codeExampleList";

export default {
  components: {
    IconPicker,
    treeConfig,
    codeExample
  },
  data() {
    return {
      dialogVisibleTreeAttrs: false,
      showCodeEditor: false,
      treeAttrs: new TreeAttrs(),
      curFn: "",
      codeEditorTil: "",
      activeName: "first",
      rules1: {
        nodeKey: [{ required: true, message: "请选择活动区域", trigger: "change" }],
        propsLabel: [{ required: true, message: "请选择活动区域", trigger: "change" }],
        propsChildren: [{ required: true, message: "请选择活动区域", trigger: "change" }]
      },
      rules2: {
        nodeKey: [{ required: true, message: "请输入nodeId", trigger: "blur" }],
        propsLabel: [{ required: true, message: "请输入propsLabel", trigger: "blur" }],
        propsChildren: [{ required: true, message: "请输入propsChildren", trigger: "blur" }]
      },
      deliveryFieldsOption: {
        options: []
      },
      treeAttrsCodeExampleList
    };
  },

  inject: ["getPageInfo"],
  computed: {
    isDataModel() {
      return this.treeAttrs.isDataModel;
    }
  },

  methods: {
    showTreeAttrs(attrs) {
      this.treeAttrs = cloneDeep(attrs);
      this.dialogVisibleTreeAttrs = true;
    },
    handleCloseTreeAttrs() {
      this.dialogVisibleTreeAttrs = false;
    },
    async handleCopy(val) {
      this.treeAttrs[this.curFn] = val;
      await this.$nextTick();
      this.$refs.chEditor.aceEditor.setOptions({
        value: this.treeAttrs[this.curFn]
      });
      this.$refs.chEditor.codeValue = this.treeAttrs[this.curFn];
    },
    async handleShow(field, codeEditorTil) {
      this.curFn = field;
      this.codeEditorTil = codeEditorTil;
      this.showCodeEditor = true;
      await this.$nextTick();
      this.$refs.chEditor.aceEditor.setOptions({
        value: this.treeAttrs[this.curFn]
      });
      this.$refs.chEditor.codeValue = this.treeAttrs[this.curFn];
    },
    handleEditorInput(val) {
      this.treeAttrs[this.curFn] = val;
    },
    handleClose() {
      this.showCodeEditor = false;
    },
    handleConfirm() {
      this.$refs.ruleForm.validate(valid => {
        if (valid) {
          this.$emit("changeTreeAttrs", this.treeAttrs);
          this.handleCloseTreeAttrs();
        } else {
          console.log("error submit!!");
          return false;
        }
      });
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
.marginR5 {
  margin-right: 5px;
}
::v-deep .el-form-item {
  margin-bottom: 10px;
}
.w315 {
  width: 319px;
}
::v-deep .el-form-item__error {
  top: 78%;
}
</style>
