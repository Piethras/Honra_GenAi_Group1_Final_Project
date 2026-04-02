// IMPLEMENT: Drag-and-drop file upload zone (Client Component)
// - Use react-dropzone for drag-and-drop behavior
// - Accept: .csv, .xlsx, .json only; max file size 50MB (validate client-side first)
// - Visual states: idle (dashed border + icon), drag-over (highlighted), uploading (progress bar), success, error
// - On file drop/select: call POST /api/datasets/upload with FormData
// - Show upload progress percentage during upload (use XMLHttpRequest for progress events)
// - On success: show the new dataset name and a link to view it; call onSuccess() callback
// - On error: display the error message from the API response
