<template>
  <el-dialog title="选择字典" :visible.sync="dialogVisible" width="750px" append-to-body :close-on-click-modal="false">
    <el-input v-model="filterText" placeholder="搜索字典名称或编码" size="small" clearable style="margin-bottom: 10px" />
    <div class="enumDicTreeDlg-body">
      <div class="enumDicTreeDlg-left">
        <el-tree
          ref="dicTree"
          :data="treeList"
          :props="{ label: 'groupName', children: 'childList', isLeaf: 'isLeaf' }"
          :filter-node-method="filterNode"
          node-key="groupId"
          default-expand-all
          highlight-current
          style="height: 100%; overflow-y: auto"
          @node-click="handleNodeClick"
        >
          <span slot-scope="{ data }" class="enum-tree-node">
            <i v-if="data.isGroup === 1" class="el-icon-folder-opened" style="margin-right: 4px; color: #E6A23C" />
            <i v-else class="el-icon-document" style="margin-right: 4px; color: #409EFF" />
            <span>{{ data.groupName }}</span>
            <span v-if="data.isGroup === 0" style="color: #909399; font-size: 12px; margin-left: 4px">-{{ data.groupId }}</span>
          </span>
        </el-tree>
      </div>
      <div class="enumDicTreeDlg-right">
        <template v-if="selectedNode && enumItems.length">
          <el-table :data="enumItems" size="small" max-height="380">
            <el-table-column prop="dicId" label="值" width="100" align="center" />
            <el-table-column prop="cnName" label="名称" min-width="100" align="center" />
            <el-table-column prop="remark" label="备注" min-width="100" show-overflow-tooltip align="center" />
            <el-table-column prop="tag" label="标签" width="80" align="center" />
            <el-table-column label="操作" width="130" align="center">
              <template slot-scope="{ row }">
                <color-picker :value="(row.contentStyle && row.contentStyle.backgroundColor) || ''" @change="handleColorSelect(row, $event)" />
              </template>
            </el-table-column>
          </el-table>
        </template>
        <div v-else class="enumDicTreeDlg-placeholder">
          <span>请选择字典</span>
        </div>
      </div>
    </div>
    <div slot="footer">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :disabled="!selectedNode" @click="handleConfirm">确定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import ColorPicker from "../setupBtnConfig/components/colorPicker.vue";

export default {
  components: { ColorPicker },
  inject: {
    onUpdateItemColor: {
      default: () => (dicId, color) => {
        console.log("[enumDicTreeDlg] onUpdateItemColor not provided", { dicId, color });
      }
    }
  },
  props: {
    generalRequest: {
      type: Function,
      default: () => {}
    }
  },
  data() {
    return {
      dialogVisible: false,
      pendingConfig: null,
      treeList: [],
      filterText: "",
      selectedNode: null,
      enumItems: []
    };
  },
  computed: {},
  watch: {
    filterText(val) {
      this.$refs.dicTree && this.$refs.dicTree.filter(val);
    }
  },
  methods: {
    openDlg(config) {
      this.pendingConfig = config || null;
      this.selectedNode = null;
      this.enumItems = [];
      this.filterText = "";
      this.dialogVisible = true;
      if (!this.treeList.length) {
        this.loadTree().then(() => {
          this.$nextTick(() => {
            this.$refs.dicTree && this.$refs.dicTree.filter("");
            this.restoreInitialConfig();
          });
        });
      } else {
        this.$nextTick(() => {
          this.$refs.dicTree && this.$refs.dicTree.filter("");
          this.restoreInitialConfig();
        });
      }
    },

    async loadTree() {
      if (typeof this.generalRequest !== "function") return;
      try {
        const res = await this.generalRequest("/dic-group/list", "post", { pid: "", groupName: "" });
        this.treeList = res.data || [];
      } catch (e) {
        console.error("加载字典树失败", e);
      }
    },

    restoreInitialConfig() {
      const config = this.pendingConfig;
      if (!config || !config.dicCode) return;
      this.$refs.dicTree && this.$refs.dicTree.setCurrentKey(config.dicCode);
      const findNode = list => {
        for (const item of list) {
          if (item.groupId === config.dicCode && item.isGroup === 0) {
            this.selectedNode = item;
            this.loadItemsForNode(item.groupId);
            return true;
          }
          if (item.childList && findNode(item.childList)) return true;
        }
        return false;
      };
      findNode(this.treeList);
    },

    filterNode(value, data) {
      if (!value) return true;
      const v = value.toLowerCase();
      return (data.groupName && data.groupName.toLowerCase().indexOf(v) !== -1) || (data.groupId && data.groupId.toLowerCase().indexOf(v) !== -1);
    },

    handleNodeClick(data) {
      if (data.isGroup === 0) {
        this.selectedNode = data;
        this.loadItemsForNode(data.groupId);
      } else {
        this.selectedNode = null;
        this.enumItems = [];
      }
    },

    async loadItemsForNode(groupId) {
      if (typeof this.generalRequest !== "function") return;
      try {
        const res = await this.generalRequest("/admin/dic/getDicContentList", "get", { dicCode: groupId });
        const items = (res.data || []).map(item => {
          let contentStyle = {};
          if (item.contentStyle) {
            try {
              contentStyle = JSON.parse(item.contentStyle);
            } catch (e) {
              /* ignore */
            }
          }
          return { ...item, contentStyle };
        });
        this.enumItems = items;
      } catch (e) {
        console.error("加载字典项失败", e);
      }
    },

    handleConfirm() {
      if (!this.selectedNode || this.selectedNode.isGroup !== 0) return;
      this.$emit("confirm", {
        groupId: this.selectedNode.groupId,
        groupName: this.selectedNode.groupName
      });
      this.dialogVisible = false;
    },

    handleColorSelect(row, color) {
      this.$set(row, "contentStyle", { ...row.contentStyle, backgroundColor: color });
      if (typeof this.onUpdateItemColor === "function") {
        this.onUpdateItemColor({ ...row, newDicId: row.dicId, contentStyle: JSON.stringify(row.contentStyle) });
      }
    },

    handleCancel() {
      this.dialogVisible = false;
    }
  }
};
</script>

<style lang="less" scoped>
.enumDicTreeDlg-body {
  display: flex;
  height: 380px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}
.enumDicTreeDlg-left {
  flex: 0 0 220px;
  border-right: 1px solid #ebeef5;
  padding: 8px 0 8px 8px;
  overflow: hidden;
}
.enumDicTreeDlg-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.enumDicTreeDlg-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 14px;
}
</style>
