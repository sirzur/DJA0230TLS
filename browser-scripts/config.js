/* Downloader */
function exportConfig() {
    $.fileDownload("/modals/gateway-modal.lp", {
        httpMethod: "POST",
        data: new Array(
            { name : "action", value : "export_config" },
            { name : "CSRFtoken", value : $("meta[name=CSRFtoken]").attr("content") }),
    });
}