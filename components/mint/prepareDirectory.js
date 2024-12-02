import readJsonLines from 'read-json-lines-sync';

export const prepareDirectory = async ({ files }) => {
    // upload directory of files
    const hashes = await uploadFilesToDirectory(files)
    // const cid = `ipfs://${hashes.directory}`
    // console.log("hashes", hashes);
    return hashes
}

function not_directory(file) {
    return file.blob.type !== 'application/x-directory'
}

async function uploadFilesToDirectory(files) {
    files = files.filter(not_directory)
    // console.log("files", files);
    // const form = new FormData()

    // await Promise.all(files.map(async (file) => {
    //     form.append('file', file.blob, encodeURIComponent(file.path))
    // }))
    // const endpoint = `${infuraUrl}/api/v0/add?pin=true&recursive=true&wrap-with-directory=true`

    // const [res,] = await Promise.all([
    //     axios.post(endpoint, form, {
    //         headers: { 'Content-Type': 'multipart/form-data' },
    //     }),
    //     axios.post(serverUrl, form, {
    //         headers: { 'Content-Type': 'multipart/form-data' },
    //     }),
    // ])

    // const data = readJsonLines(res.data)

    // const formDataArray = Array.from(form.entries());
    // const rootDir = formDataArray.find((e) => e.Name === '')

    // const directory = rootDir.Hash
    return { files }
}
