import React from 'react';
import {getBasePath, getFullPath, joinPaths, removePathPrefix} from "../core";

export interface FragmentProps extends React.IframeHTMLAttributes<HTMLIFrameElement> {
    basePath: string;
    topPath: string;
}
export const FragmentFrame = (props:FragmentProps) => {
    const basePath = joinPaths(getBasePath(), props.basePath);
    const mainFullPath = getFullPath();
    const localPath = removePathPrefix(mainFullPath, props.topPath);
    const src = joinPaths(basePath, localPath);

    const copyProps:any = {...props};
    delete copyProps.basePath;
    delete copyProps.topPath;
    delete copyProps.src;
    delete copyProps.className;

    return (
        <iframe className={`fragment-frame ${props.className || ''}`}
                data-base-path={basePath}
                data-top-path={props.topPath}
                src={src} {...copyProps} ></iframe>
    )
}