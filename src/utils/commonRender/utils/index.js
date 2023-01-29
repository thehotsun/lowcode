export function setPlaceholder(tagName, fieldName) {
  console.log(tagName);
  const inputs = ['el-input', 'el-input-number'];
  return `请${inputs.includes(tagName) ? '输入' : '选择'}${fieldName}`;
}


export function setFilterAndResetBtnConfig(handleFilter, handleReset ) {
  console.log(tagName);
  const inputs = ['el-input', 'el-input-number'];
  return `请${inputs.includes(tagName) ? '输入' : '选择'}${fieldName}`;
}