function showToast(message)
{
    let toastElement = $('#error-toast');
    let toast = new bootstrap.Toast(toastElement[0]);
    toastElement.find('.toast-body').first().text(message);
    toast.show();
}