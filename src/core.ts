export const EVENT_HISTORY_STATE_CHANGED = 'history-state-changed';

function getBasePathForFrame(frame: Element) {
    const basePath = frame.getAttribute('data-base-path');
    if (basePath) {
        return basePath;
    }
    return '/';
}

/**
 * The base path is the path that is used to resolve local paths.
 * E.g.
 * /my/base/<local-path>
 */
export function getBasePath() {
    if (window !== parent && window.frameElement) {
        // We are in iframe - get base path from iframe
        try {
            return getBasePathForFrame(window.frameElement);
        } catch (e) {
            //Ignore
            console.warn('Failed to get base path from frame element', e);
        }
    }
    const bases = window.document?.head?.getElementsByTagName('base');
    if (!bases || bases.length === 0) {
        return '/';
    }
    return bases[0].getAttribute('href') || '/';
}

function getPathInParentForFrame(frame: Element) {
    const basePath = frame.getAttribute('data-parent-path');
    if (basePath) {
        return basePath;
    }
    return '/';
}

/**
 * Gets the base path for this window in the parent window.
 * E.g.
 * /user > /fragment/user
 * where /user is the path in the parent
 *
 * Used to translate paths from the parent window to the frame.
 */
export function getPathInParent() {
    if (window !== parent && window.frameElement) {
        // We are in iframe - get base path from iframe
        try {
            return getPathInParentForFrame(window.frameElement);
        } catch (e) {
            //Ignore
            console.warn('Failed to get base path from frame element', e);
        }
    }

    return '/';
}

/**
 * Replaces the history state of the iframe and emits and event on its window.
 */
export function replaceFrameHistoryState(iframe: HTMLIFrameElement, path: string) {
    if (!iframe.contentWindow) {
        return false;
    }

    try {
        iframe.contentWindow.history.replaceState({}, '', path);
        iframe.contentWindow.dispatchEvent(new CustomEvent(EVENT_HISTORY_STATE_CHANGED));
    } catch (e) {
        //ignore
        return false;
    }

    return true;
}

/**
 * The callback is invoked whenever a parent has navigated the current frame
 */
export function onParentNavigation(callback: (localPath: string) => void) {
    const handler = () => {
        const basePath = getBasePath();
        const fullPath = getFullPath();
        const newPath = removePathPrefix(fullPath, basePath);
        callback(newPath);
    };

    window.addEventListener(EVENT_HISTORY_STATE_CHANGED, handler);
    return () => {
        window.removeEventListener(EVENT_HISTORY_STATE_CHANGED, handler);
    };
}

function getFragmentFrame() {
    const elm = document.querySelector('iframe.fragment-frame');
    if (!elm) {
        return null;
    }
    return elm as HTMLIFrameElement;
}

/**
 * This should be invoked whenever the current frame has navigated itself.
 *
 * Also goes for the top level window.
 */
export function onSelfNavigation() {
    const fullPath = getFullPath();
    const fragment = getFragmentFrame();
    if (fragment) {
        const parentPath = getPathInParentForFrame(fragment);
        const basePath = getBasePathForFrame(fragment);
        if (fullPath.startsWith(parentPath)) {
            const localPath = removePathPrefix(fullPath, parentPath);
            replaceFrameHistoryState(fragment, joinPaths(basePath, localPath));
        }
    }

    if (window === window.parent) {
        return;
    }
    const basePath = getBasePath();
    const topPath = getPathInParent();

    const localPath = removePathPrefix(fullPath, basePath);
    const topLocalPath = joinPaths(topPath, localPath);
    const parentFullPath = getFullPath(window.parent);
    if (parentFullPath !== topLocalPath) {
        window.parent.history.replaceState({}, '', topLocalPath);
    }
}

/**
 * Joins two url paths together.
 */
export function joinPaths(path1: string, path2: string) {
    if (path2.startsWith('/')) {
        path2 = path2.substring(1);
    }
    if (!path1.endsWith('/')) {
        path1 += '/';
    }
    return path1 + path2;
}

/**
 * Removes the prefix from the given path - if it exists.
 */
export function removePathPrefix(path: string, prefix: string) {
    if (prefix.endsWith('/')) {
        prefix = prefix.substring(0, prefix.length - 1);
    }
    if (path.startsWith(prefix)) {
        return path.substring(prefix.length);
    }

    return path;
}

/**
 * Gets everything after host and port for the provided window.
 *
 * If no window is provided, the current window is used.
 */
export function getFullPath(win?: Window) {
    if (!win) {
        win = window;
    }
    return toFullPath(win.location.href);
}

/**
 * Gets everything after host and port.
 */
export function toFullPath(urlString: string) {
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
