<template>
  <el-dialog v-dialog-drag :width="width" top="50px" :title="title" :visible.sync="visible" :close-on-click-modal="false" append-to-body :before-close="cancel">
    <div class="root">
      <el-tree ref="tree" lazy :load="treeLoad" :props="treeProps" node-key="folderId" highlight-current>
        <template #default="{ node, data }">
          <label class="tree-node" :ref="node.key" :class="{ 'is-target': node.key === parentId }">
            <el-checkbox v-if="data.$check" class="tree-btn" :key="checkList.length" :value="idList" :label="data.folderId" @input="setList(node)">{{ undefined }}</el-checkbox>
            <img class="tree-icon" :src="data.$icon" alt="文件" />
            <div class="tree-ellipsis" :title="data.folderName">
              {{ data.folderName }}
            </div>
          </label>
        </template>
      </el-tree>

      <el-table v-if="showTable" class="jy-table" :data="checkList" height="100%" border>
        <el-table-column label="#" align="center" type="index" width="50px"></el-table-column>
        <el-table-column label="名称" prop="fullName" show-overflow-tooltip></el-table-column>
        <el-table-column label="操作" align="center" width="60px">
          <template #default="{ row }">
            <i class="el-icon-delete" @click="delFolder(row)" style="font-size: 14px"></i>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <div class="footer">
        <div class="custom-slot">
          <component :is="customSlots.footer"></component>
        </div>
        <el-button @click="cancel" size="small">取消</el-button>
        <el-button type="primary" @click="confirm" size="small">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script>
import { isFunction } from "lodash";
export default {
  inject: ["queryTree", "queryFolderDetail", "tableRowIcon"],
  props: {
    queryRoot: {
      type: Function,
      async default() {
        const params = {
          folderId: 0,
          isRead: 1,
          priviAll: "1",
          noRightClickMenu: true,
          prjId: this.prjId
        };
        const { data } = await this.queryTree(params);
        return data;
      }
    },
    queryFolder: {
      type: Function,
      async default(node) {
        const params = {
          folderId: node.data.folderId,
          isRead: node.data.isRead,
          priviAll: node.data.priviAll,
          noRightClickMenu: true,
          prjId: this.prjId
        };
        const { data } = await this.queryTree(params);
        return data;
      }
    },
    beforeSuccess: { type: Function, default: () => {} },
    customCheck: { type: [Function, undefined], default: undefined },
    check: { type: Function, default: Vo => Vo.isFolder === 0 },
    filter: { type: Function, default: Vo => Vo.folderId !== "recycle" },
    title: { type: String, default: "选择文件" },
    prjId: { type: String, default: "" },
    defaultList: { type: Array, default: () => [] }, // 已选择列表
    showTable: { type: Boolean, default: true },
    width: { type: String, default: () => "1024px" },
    multiple: { type: Boolean, default: true },
    customSlots: { type: Object, default: () => ({}) },
    isLeaf: { type: Function, default: vo => vo.childFlag === 0 },
    parentId: { type: String, default: "" }
  },
  data() {
    return {
      visible: false,
      checkList: [],
      folderId: "",
      treeProps: {
        label: "folderName",
        isLeaf: "leaf"
      }
    };
  },
  computed: {
    idList() {
      return this.checkList.map(({ folderId }) => folderId);
    }
  },
  created() {
    this.checkList = [...this.defaultList];
  },
  methods: {
    cancel() {
      this.visible = false;
      this.checkList = [];
    },
    async confirm() {
      const { checkList } = this;
      const beforeSuccess = this.beforeSuccess.bind(this);
      await beforeSuccess(checkList);
      this.$emit("confirm", checkList);
      this.visible = false;
    },
    async delFolder(row) {
      const index = this.checkList.findIndex(({ folderId }) => folderId === row.folderId);
      if (index > -1 && row.folderId) this.checkList.splice(index, 1);
    },
    addFolder(node) {
      if (this.checkList.some(({ folderId }) => node.key === folderId)) {
        return this.$message.warning("不得重复添加");
      }
      let anode = node;
      const names = [];
      const ids = [];
      while (anode?.key) {
        names.unshift(anode.label);
        ids.unshift(anode.data.folderId);
        anode = anode.parent;
      }
      if (!this.multiple) this.checkList = [];
      console.log("checkList", this.checkList);

      this.checkList.push({
        ...node.data,
        fullName: names.join("/"),
        fullIdPath: ids.join("/")
      });
      console.log("checkList", this.checkList);
    },
    async setList(node) {
      console.log("setList", node, customCheck);

      const { customCheck } = this;
      if (isFunction(customCheck)) {
        const res = await Reflect.apply(customCheck, this, [node]);
        if (res === false) return;
      }
      const isCheck = this.idList.find(id => id === node.data.folderId);
      console.log("isCheck", isCheck);

      if (isCheck) this.delFolder(node.data);
      else this.addFolder(node);
    },
    // 打开窗口
    async open() {
      this.visible = true;
    },
    // 进入文件夹
    async intoFolderById(folderId) {
      await this.$nextTick();
      // 为了异步触发方法 返回Promise
      return new Promise((resolve, reject) => {
        const tree = this.$refs.tree;
        const node = tree.getNode(folderId);
        // 调用Tree的加载 触发load
        try {
          node?.loadData(resolve);
        } catch (error) {
          reject();
        }
      });
    },
    async getParentLevel() {
      if (!this.parentId) return [];
      const {
        data: { absolutPathId }
      } = await this.queryFolderDetail(this.parentId);
      return absolutPathId ? absolutPathId.split("/") : [];
    },
    // tree绑定加载方法
    async treeLoad(node, cb) {
      const isRoot = node.level === 0;
      const pid = isRoot ? "0" : node.key;
      const query = isRoot ? this.queryRoot : this.queryFolder;
      try {
        // 获取数据
        if (pid === "recycle") {
          cb([]);
        } else {
          const reqList = [query.call(this, node)];
          if (isRoot) reqList.push(this.getParentLevel());
          const [list, levels] = await Promise.all(reqList);
          const voList = [];
          const { filter, check, isLeaf } = this;
          for (const item of list) {
            if (filter.call(this, item)) voList.push(item);
            else continue;
            item.$check = check.call(this, item);
            item.leaf = isLeaf.call(this, item);
            item.$icon = this.tableRowIcon(item);
          }
          cb(voList);
          // 添加子元素
          if (isRoot) {
            let lastId;
            if (!levels.length) {
              // 根目录时 自动访问第一个文件夹
              const id = node.childNodes[0]?.key;
              id && levels.push(id);
            }
            const index = levels.findIndex(id => voList.some(vo => id === vo.folderId));
            for (const nextId of levels.slice(index)) {
              const node = this.$refs.tree.getNode(nextId);
              await this.intoFolderById(nextId);
              node.expanded = true;
              lastId = nextId;
            }
            if (lastId) {
              const el = this.$refs[lastId];
              el && el.scrollIntoView();
            }
          }
        }
      } catch (error) {
        cb([]);
      }
    }
  }
};
</script>
<style lang="less" scoped>
.root {
  display: flex;
  flex-flow: row nowrap;
  height: 500px;
}

.el-tree {
  flex: 0 0 460px;
  height: 100%;
  overflow: auto;
  background-color: #fafafa;
  padding: 8px;

  /deep/ .el-tree-node {
    .el-tree-node__loading-icon {
      position: absolute;
      margin-left: 5px;
      z-index: 1;
    }
  }

  .tree-node {
    display: flex;
    align-items: center;
    width: 100%;
    overflow: hidden;
    cursor: pointer;
    padding-right: 4px;

    &.is-target {
      animation: highL 2s both;
    }
  }

  .tree-icon {
    margin-right: 6px;
  }

  .tree-btn {
    margin: 0 -4px 0 0;
  }

  .tree-ellipsis {
    flex-grow: 1;
    font-size: 14px;
    letter-spacing: 1px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    user-select: none;
  }
}

.el-table {
  flex: 1 1;
  margin: 0 0 0 16px;
}

.footer {
  display: flex;
  flex-flow: row nowrap;
  text-align: left;
  align-items: center;

  .custom-slot {
    flex-grow: 1;
  }
}

@keyframes highL {
  from {
    background-color: red;
  }
  to {
    background-color: transparent;
  }
}
</style>
