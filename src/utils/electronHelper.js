export const handleElectronResult = async (operation, showToast, successMessage, errorPrefix = '操作失败') => {
  const result = await operation();
  if (result.success) {
    if (successMessage) {
      showToast(successMessage, 'success');
    }
    return true;
  } else {
    showToast(`${errorPrefix}: ${result.error}`, 'error');
    return false;
  }
};

