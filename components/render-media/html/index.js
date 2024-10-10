import React, { useContext, useState, useRef, useEffect } from 'react'
import {
    dataRUIToBuffer,
    prepareFilesFromZIP,
    validateFiles,
} from './utils/html';

const uid = Math.round(Math.random() * 100000000).toString()

export const HTMLComponent = ({ src, displayUri, preview }) => {
    console.log("src", src);
    // console.log("displayUri", displayUri);
    // preview
    const iframeRef = useRef(null)
    const unpackedFiles = useRef(null)
    const unpacking = useRef(false)
    const [validHTML, setValidHTML] = useState(null)
    const [validationError, setValidationError] = useState(null)

    const [containerStyle, setContainerStyle] = useState({})

    const loaded = () => {
        // console.log("loaded")
        setContainerStyle({ background: blue })

    }

    const unpackZipFiles = async () => {
        unpacking.current = true

        console.log("src", src);

        const buffer = dataRUIToBuffer(src)
        const filesArr = await prepareFilesFromZIP(buffer)
        const files = {}
        filesArr.forEach((f) => {
            files[f.path] = f.blob
        })

        unpackedFiles.current = files

        const result = await validateFiles(unpackedFiles.current)
        if (result.error) {
            console.error(result.error)
            setValidationError(result.error)
        } else {
            setValidationError(null)
        }
        setValidHTML(result.valid)

        unpacking.current = false
    }

    if (preview && !unpackedFiles.current && !unpacking.current) {
        unpackZipFiles()
    }

    const [resizeCounter, setResizeCounter] = useState(0);
    useEffect(() => {
        const handleResize = () => {
            var counter = resizeCounter + 1
            setResizeCounter(counter)
            // console.log(counter)
        }
        global.addEventListener('resize', handleResize)
        const handler = async (event) => {
            if (event.data !== uid) {
                return
            }

            iframeRef.current.contentWindow.postMessage(
                {
                    target: 'akaswap-html-preview',
                    data: unpackedFiles.current,
                },
                '*'
            )
        }

        window.addEventListener('message', handler)

        return () => window.removeEventListener('message', handler)
    }, [src, resizeCounter])

    console.log("unpacking", unpacking);
    console.log("unpackedFiles", unpackedFiles);
    return (
        <div>
            <h1>HTMLComponent</h1>
            {/* <iframe
                title="html-embed"
                src={`${src}`}
                sandbox="allow-scripts allow-same-origin allow-popups"
                scrolling="no"
            // onLoad={() => loaded()}
            /> */}
            {/* <iframe
                ref={iframeRef}
                title="html-zip-embed"
                // src={`https://beta.akaswap.com/gh-pages/html-preview/?uid=${uid}&creator=${_creator_}&viewer=${_viewer_}`}
                // src={`https://beta.akaswap.com/api/preview/html-preview/?uid=${uid}&creator=${_creator_}&viewer=${_viewer_}`}
                src={`https://assets.akaswap.com/ipfs/?uid=${uid}`}
                sandbox="allow-scripts allow-same-origin allow-modals allow-popups"
            // allow="accelerometer; camera; gyroscope; microphone; xr-spatial-tracking;"
            /> */}
        </div>
    );
}