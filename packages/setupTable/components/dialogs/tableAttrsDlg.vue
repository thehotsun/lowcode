<template>
  <el-dialog
    v-draggable
    title="表格属性设置"
    :visible.sync="dialogVisibleTableAttrs"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="985px"
    :before-close="handleCloseTableAttrs"
  >
    <div style="min-width: 60px;background: #fff;padding: 10px;">
      <el-form ref="ruleForm" :model="tableAttrs" :rules="rules" label-width="130px" style="padding-bottom: 20px">
        <el-form-item label="基础配置">
          <el-checkbox v-model="tableAttrs.showPagination">分页</el-checkbox>
          <el-checkbox v-model="tableAttrs.isShowIndex">显示序号</el-checkbox>
          <el-tooltip class="item" effect="dark" content="开启此功能后，列表左侧展示复选框" placement="top-start">
            <el-checkbox v-model="tableAttrs.isShowCheckbox">
              <span style="cursor: pointer;font-size: 14px">多选</span><i style="width: 20px" class="el-icon-question"></i>
            </el-checkbox>
          </el-tooltip>
          <el-checkbox v-model="tableAttrs.stripe">斑马线</el-checkbox>
          <el-checkbox v-model="tableAttrs.border">边框</el-checkbox>
          <el-tooltip
            class="item"
            effect="dark"
            content="开启此功能后，单击列表的某行数据会调用其查看按钮相关功能（如果有），不开启此功能，则默认为双击时触发，如果设置了双击关联按钮，则双击时会优先触发关联按钮的功能"
            placement="top-start"
          >
            <el-checkbox v-model="tableAttrs.clickRowShowDetialDialog">
              <span style="cursor: pointer;font-size: 14px">单击列展示详情</span><i style="width: 20px" class="el-icon-question"></i>
            </el-checkbox>
          </el-tooltip>
          <el-tooltip
            class="item"
            effect="dark"
            content="若表格展示的是各类数字，可以在表尾显示各列的合计。默认情况下，对于合计行，第一列不进行数据求合操作，而是显示「合计」二字，其余列会将本列所有数值进行求合操作，并显示出来。当然，你也可以定义自己的合计函数"
            placement="top-start"
          >
            <el-checkbox v-model="tableAttrs.showSummary">
              <span style="cursor: pointer;font-size: 14px">合计</span><i style="width: 20px" class="el-icon-question"></i>
            </el-checkbox>
          </el-tooltip>
          <el-tooltip class="item" effect="dark" content="多行或多列共用一个数据时，可以合并行或列。必须通过合并函数定义合并规则" placement="top-start">
            <el-checkbox v-model="tableAttrs.isMerge"><span style="cursor: pointer;font-size: 14px">合并</span><i style="width: 20px" class="el-icon-question"></i> </el-checkbox>
          </el-tooltip>
          <el-tooltip
            class="item"
            effect="dark"
            content="当 row 中包含 children 字段时，被视为树形数据。渲染树形数据时，必须要指定row-key。支持子节点数据异步加载（配置懒加载和传递字段）。"
            placement="top-start"
          >
            <el-checkbox v-model="tableAttrs.isTree">
              <span style="cursor: pointer;font-size: 14px">树类型数据</span><i style="width: 20px" class="el-icon-question"></i>
            </el-checkbox>
          </el-tooltip>
          <el-checkbox v-if="tableAttrs.isTree" v-model="tableAttrs.lazy">懒加载</el-checkbox>
          <el-tooltip class="item" effect="dark" content="隐藏列表上方右侧默认搜索、刷新、设置、导出功能区域。" placement="top-start">
            <el-checkbox v-model="tableAttrs.hiddenDefaultArea">
              <span style="cursor: pointer;font-size: 14px">隐藏右侧默认搜索、刷新等功能区域</span><i style="width: 20px" class="el-icon-question"></i>
            </el-checkbox>
          </el-tooltip>
        </el-form-item>

        <el-row>
          <el-col :span="7">
            <el-form-item v-show="tableAttrs.showPagination" label="分页显示条数" prop="showPagination">
              <el-select v-model="tableAttrs.paginationSize" placeholder="请选择">
                <el-option v-for="item in paginationSizeOptions" :key="item.value" :label="item.label" :value="item.value"> </el-option>
              </el-select>
              <!-- <el-button type="text" @click="handleShow('setPaginationSize', '设置分页', $event)">编辑</el-button> -->
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-button type="text" style="margin-top: 8px;" @click="handleShow('setPaginationSize', '设置分页', $event)">编辑</el-button>
          </el-col>
          <el-col :span="7">
            <el-form-item label="双击关联按钮" prop="dbClickRelateBtnId">
              <el-tooltip slot="label" class="fontSize14" effect="dark" content="双击后要触发的按钮" placement="top-start">
                <span>双击关联按钮<i style="width: 20px;" class="el-icon-question"></i></span>
              </el-tooltip>
              <el-select v-model="tableAttrs.dbClickRelateBtnId" placeholder="请选择关联按钮" filterable clearable="">
                <el-option v-for="btnItem in btnConfigArr" :key="btnItem.btnId" :label="btnItem.tagAttrs.value" :value="btnItem.btnId"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="7">
            <el-form-item label="组件大小" prop="size">
              <el-select v-model="tableAttrs.size" placeholder="请选择组件大小">
                <el-option v-for="item in sizeOptions" :key="item.value" :label="item.label" :value="item.value"> </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item v-if="tableAttrs.isShowIndex" label="自定义索引函数">
          <el-input v-model="tableAttrs.index" placeholder="请输入function(index){ return index}格式" @focus="handleShow('index', '自定义索引函数', $event)"></el-input>
        </el-form-item>

        <el-form-item v-if="tableAttrs.showSummary" label="合计函数" prop="summaryMethod">
          <el-input v-model="tableAttrs.summaryMethod" placeholder="请输入格式为Function({ columns, data })" @focus="handleShow('summaryMethod', '合计函数', $event)"></el-input>
        </el-form-item>

        <el-form-item v-if="tableAttrs.isMerge" label="合并函数" prop="spanMethod">
          <el-input
            v-model="tableAttrs.spanMethod"
            placeholder="请输入格式为Function({ row, column, rowIndex, columnIndex })"
            @focus="handleShow('spanMethod', '合并函数', $event)"
          ></el-input>
        </el-form-item>

        <el-row>
          <el-col :span="12">
            <el-form-item v-if="tableAttrs.isTree" label="配置tree-props" prop="treeProps">
              <el-input v-model="tableAttrs.treeProps" type="textarea" :rows="2" placeholder="请输入{children, hasChildren}格式"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="tableAttrs.isTree" label="指定row-key">
              <el-input v-model="tableAttrs.rowKey" placeholder="请输入字段名"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item v-if="tableAttrs.isTree" label="数据转换函数">
          <el-tooltip
            slot="label"
            class="item"
            effect="dark"
            content="由于当前通过sql查询很难直接生成树形结构所需的数据结构，因此通过此函数进行数据结构转换（优先级最高）"
            placement="top-start"
          >
            <span style="cursor: pointer;font-size: 14px">数据转换函数</span><i style="width: 20px; font-size: 14px;" class="el-icon-question"></i>
          </el-tooltip>
          <el-input v-model="tableAttrs.dataTransitionFn" placeholder="请输入数据转换函数" @focus="handleShow('dataTransitionFn', '数据转换函数', $event)"></el-input>
        </el-form-item>
        <el-form-item v-if="tableAttrs.isTree" label="数据转换配置">
          <el-tooltip
            slot="label"
            class="item"
            effect="dark"
            content="由于当前通过sql查询很难直接生成树形结构所需的数据结构，因此通过配置父子字段进行数据关联生成树状结构（优先级最比数据转换函数低）"
            placement="top-start"
          >
            <span style="cursor: pointer;font-size: 14px">数据转换配置</span><i style="width: 20px; font-size: 14px;" class="el-icon-question"></i>
          </el-tooltip>
          <el-row>
            <el-col :span="12">
              <span>父级id字段：</span>
              <el-select v-model="tableAttrs.dataTransitionParentField" placeholder="请选择">
                <el-option v-for="item in deliveryFieldsOption.options" :key="item.id" :label="item.cnName" :value="item.id"> </el-option>
              </el-select>
            </el-col>
            <el-col :span="12">
              <span>id字段：</span>
              <el-input v-model="tableAttrs.dataTransitionCurField" style="width: 314px;" placeholder="请输入字段名"></el-input>
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item v-if="tableAttrs.isTree && tableAttrs.lazy" label="传递字段">
          <el-tooltip slot="label" class="item" effect="dark" content="一般懒加载时的load函数需要传递当前row的某个字段当作参数获取下一级的tableData" placement="top-start">
            <span style="cursor: pointer;font-size: 14px">传递字段</span>
          </el-tooltip>
          <el-select v-model="tableAttrs.deliveryLoadFnField" placeholder="请选择">
            <el-option v-for="item in deliveryFieldsOption.options" :key="item.id" :label="item.cnName" :value="item.id"> </el-option>
          </el-select>
        </el-form-item>

        <!-- <el-form-item label="重置按钮事件">
          <el-tooltip slot="label" class="item" effect="dark" content="点击重置按钮触发的js脚本，如不填则执行默认行为（清空搜索数据并重新请求表格）" placement="top-start">
            <span style="cursor: pointer;font-size: 14px">重置按钮事件</span><i style="width: 20px; font-size: 14px;" class="el-icon-question"></i>
          </el-tooltip>
          <el-input v-model="tableAttrs.resetBtnEvent" placeholder="请输入数据转换函数" @focus="handleShow('resetBtnEvent', '数据转换函数', $event)"></el-input>
        </el-form-item> -->

        <el-form-item label="自定义样式" prop="style">
          <el-input v-model="tableAttrs.style" type="textarea" :rows="2" placeholder="请输入整体样式（包括列表、搜索区域和按钮区域）"></el-input>
        </el-form-item>

        <!-- <el-form-item label="列表自定义样式" prop="elTableStyle">
            <el-tooltip slot="label" class="item" effect="dark"
              content="开启此功能后，单击列表的某行数据会调用其查看按钮相关功能（如果有），不开启此功能，则默认为双击时触发" placement="top-start">
              <span style="cursor: pointer;font-size: 14px"></span>
            </el-tooltip>
            <el-input v-model="tableAttrs.elTableStyle" type="textarea" :rows="2"
              placeholder="请输入列表样式（包括列表、搜索区域和按钮区域）"></el-input>
          </el-form-item> -->
      </el-form>
      <onlineCode
        v-if="showCodeEditor"
        :title="codeEditorTil"
        :model-value="tableAttrs[curFn]"
        :code-example-val="tableAttrsCodeExampleList[curFn]"
        @confirm="handleEditorInput"
        @close="handleClose"
      ></onlineCode>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="handleCloseTableAttrs">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import onlineCode from "/packages/completeTable/component/onlineCode.vue";
import { cloneDeep } from "lodash";
import { tableAttrsCodeExampleList } from "/utils/codeExampleList";
import { getTableAttrs } from "/baseConfig/tableBaseConfig";
import { str2obj } from "/utils";
export default {
  components: {
    onlineCode
  },
  props: {
    deliveryFieldsOption: {
      type: Object,
      default() {
        return {
          options: []
        };
      }
    },
    btnConfigArr: {
      type: Array,
      default: () => {
        return [];
      }
    }
  },
  data() {
    return {
      tableAttrs: getTableAttrs(),
      dialogVisibleTableAttrs: false,
      showCodeEditor: false,
      curFn: "",
      codeEditorTil: "",
      rules: {},
      sizeOptions: [
        {
          value: "medium",
          label: "中等"
        },
        {
          value: "small",
          label: "小"
        },
        {
          value: "mimi",
          label: "迷你"
        }
      ],
      paginationOptions: [
        {
          label: "10条/页",
          value: 10
        },
        {
          label: "20条/页",
          value: 20
        },
        {
          label: "50条/页",
          value: 50
        },
        {
          label: "100条/页",
          value: 100
        }
      ],
      tableAttrsCodeExampleList
    };
  },
  computed: {
    paginationSizeOptions() {
      let options;
      try {
        if (this.tableAttrs.setPaginationSize) {
          options = str2obj(this.tableAttrs.setPaginationSize);
        }
      } catch (error) {
        console.warn("分页设置转换失败：", error);
      }
      return options || this.paginationOptions;
    }
  },
  methods: {
    showDlg(attrs) {
      this.tableAttrs = cloneDeep(attrs);
      this.dialogVisibleTableAttrs = true;
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
      this.tableAttrs[this.curFn] = value;
    },
    handleCloseTableAttrs() {
      this.dialogVisibleTableAttrs = false;
    },
    handleConfirm() {
      this.$refs.ruleForm.validate(valid => {
        if (!valid) {
          return;
        } else {
          this.$emit("changeTableAttrs", this.tableAttrs);
          this.handleCloseTableAttrs();
        }
      });
    }
  }
};
</script>
<style lang="less" scoped>
.w158 {
  width: 158px;
}
.fontSize14 {
  font-size: 14px;
}
</style>
