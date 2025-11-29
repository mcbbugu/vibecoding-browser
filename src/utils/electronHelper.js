export const handleElectronResult = async (operation, showToast, successMessage, errorPrefix) => {
  const result = await operation();
  if (result.success) {
    if (successMessage) {
      showToast(successMessage, 'success');
    }
    return true;
  } else {
    const prefix = errorPrefix || 'Operation failed';
    showToast(`${prefix}: ${result.error}`, 'error');
    return false;
  }
};

