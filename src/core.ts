export const EVENT_HISTORY_STATE_CHANGED = 'history-state-changed';
export function getBasePath() {
    if (window !== parent && window.frameElement) {
        // We are in iframe - get base path from iframe
        try {
            return window.frameElement.getAttribute('data-base-path') ?? '/';
        } catch (e) {
            //Ignore
            console.warn('Failed to get base path from frame element', e);
        }
    }
    const bases = window.document?.head?.getElementsByTagName('base');
    if (bases.length === 0) {
        return '/';
    }
    return bases[0].getAttribute('href') || '/';
}

export function getLocalPath() {
    if (window !== parent && window.frameElement) {
        // We are in iframe - get base path from iframe
        try {
            return window.frameElement.getAttribute('data-local-path');
        } catch (e) {
            //Ignore
            console.warn('Failed to get base path from frame element', e);
        }
    }

    return window.location.pathname;
}

export function getTopPath() {
    if (window !== parent && window.frameElement) {
        // We are in iframe - get base path from iframe
        try {
            return window.frameElement.getAttribute('data-top-path') || '/';
        } catch (e) {
            //Ignore
            console.warn('Failed to get base path from frame element', e);
        }
    }

    return '/';
}

export function setLocalPath(iframe:HTMLIFrameElement, path:string) {
    if (!iframe.contentWindow) {
        return false;
    }


    try {
        console.log('Setting local path', path);
        iframe.contentWindow.history.replaceState({}, '', path);
        iframe.contentWindow.dispatchEvent(new CustomEvent(EVENT_HISTORY_STATE_CHANGED));
    } catch (e) {
        //ignore
        return false;
    }

    return true;
}

export function onParentNavigation(callback:(localPath:string) => void) {

    const handler = () => {
        const basePath = getBasePath();
        const fullPath = getFullPath();
        const newPath = removePathPrefix(fullPath, basePath);
        callback(newPath);
    }

    window.addEventListener(EVENT_HISTORY_STATE_CHANGED, handler);
    return () => {
        window.removeEventListener(EVENT_HISTORY_STATE_CHANGED, handler);
    }
}

function getFragmentFrame() {
    const elm = document.querySelector('iframe.fragment-frame');
    if (!elm) {
        return null;
    }
    return elm as HTMLIFrameElement
}

export function onSelfNavigation() {
    const fullPath = getFullPath();
    const fragment = getFragmentFrame();
    if (fragment) {
        const topPathPrefix = fragment.getAttribute('data-top-path') ?? '/';
        const basePath = fragment.getAttribute('data-base-path') ?? '/';;
        if (fullPath.startsWith(topPathPrefix)) {
            const localPath = removePathPrefix(fullPath, topPathPrefix);
            console.log('Parent is telling fragment to navigate %s > %s', topPathPrefix, basePath, localPath);
            setLocalPath(fragment, joinPaths(basePath, localPath));
        }
    }

    if (window === window.parent) {
        return;
    }
    const basePath = getBasePath();
    const topPath = getTopPath()

    const localPath = removePathPrefix(fullPath, basePath);
    const topLocalPath = joinPaths(topPath, localPath);
    const parentFullPath = getFullPath(window.parent);
    if (parentFullPath !== topLocalPath) {
        console.log('Frame wants to navigate to %s > %s [%s]', basePath, fullPath, localPath, topLocalPath);
        window.parent.history.replaceState({}, '', topLocalPath);
    }
}

export function joinPaths(path1:string, path2:string) {
    if (path2.startsWith('/')) {
        path2 = path2.substring(1);
    }
    if (!path1.endsWith('/')) {
        path1 += '/';
    }
    return path1 + path2;
}

export function removePathPrefix(path:string, prefix:string) {
    if (prefix.endsWith('/')) {
        prefix = prefix.substring(0, prefix.length - 1);
    }
    if (path.startsWith(prefix)) {
        return path.substring(prefix.length);
    }

    return path;
}

export function getFullPath(win?:Window) {
    if (!win) {
        win = window;
    }
    return toFullPath(win.location.href);
}

export function toFullPath(urlString:string) {
    if (urlString.startsWith('/')) {
        return urlString;
    }
    const url = new URL(urlString);
    let out = url.pathname;
    if (url.search) {
        out += '?' + url.search;
    }
    if (url.hash) {
        out += '#' + url.hash;
    }
    return out;
}