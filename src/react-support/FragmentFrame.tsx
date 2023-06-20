import React from 'react';
import {getBasePath, getFullPath, joinPaths, QUERY_BASEPATH, QUERY_FRAGMENT, removePathPrefix} from '../core';

export interface FragmentProps extends React.IframeHTMLAttributes<HTMLIFrameElement> {
    basePath: string;
    topPath: string;
}
export const FragmentFrame = (props: FragmentProps) => {
    const basePath = joinPaths(getBasePath(), props.basePath);
    const mainFullPath = getFullPath();
    const localPath = removePathPrefix(mainFullPath, props.topPath);
    let src = joinPaths(basePath, localPath);

    if (src.indexOf('?') === -1) {
        src += '?';
    } else {
        src += '&';
    }
    src += `${QUERY_FRAGMENT}=true&${QUERY_BASEPATH}=${encodeURIComponent(basePath)}`;

    const copyProps: any = { ...props };
    delete copyProps.basePath;
    delete copyProps.topPath;
    delete copyProps.src;
    delete copyProps.className;

    return (
        <iframe
            className={`fragment-frame ${props.className || ''}`}
            data-base-path={basePath}
            data-parent-path={props.topPath}
            src={src}
            {...copyProps}
        ></iframe>
    );
};
