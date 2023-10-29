/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

export const EVENT_HISTORY_STATE_CHANGED = 'history-state-changed';
export const QUERY_FRAGMENT = '_kap_fragment';
export const QUERY_BASEPATH = '_kap_basepath';

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
export function replaceStateOnWindow(win: Window, path: string) {

    try {
        const currentPath = getFullPath(win);
        if (!isSamePath(currentPath, path)) {
            // Only replace if the path has changed
            win.history.replaceState({}, '', normalizePath(path));
            win.dispatchEvent(new CustomEvent(EVENT_HISTORY_STATE_CHANGED));
        }
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
 * Syncs the location of the current frame with the child frame - if any.
 */
function syncLocationToChildFrames() {
    const fullPath = getFullPath();
    const fragment = getFragmentFrame();
    if (fragment && fragment.contentWindow) {
        const parentPath = getPathInParentForFrame(fragment);
        const basePath = getBasePathForFrame(fragment);
        if (fullPath.startsWith(parentPath)) {
            const localPath = removePathPrefix(fullPath, parentPath);
            replaceStateOnWindow(fragment.contentWindow, joinPaths(basePath, localPath));
        }
    }
}

/**
 * Syncs the location of the current frame with the parent frame.
 */

function normalizePath(path: string) {
    let [pathname, searchpart] = path.split('?');
    let [search, hash] = searchpart?.split('#') || [];

    if (pathname.endsWith('/')) {
        pathname = pathname.substring(0, path.length - 1);
    }
    let normalized = pathname;
    if (search) {
        const params = new URLSearchParams(search);
        params.delete(QUERY_BASEPATH);
        params.delete(QUERY_FRAGMENT);
        search = params.toString();
        if (search) {
            normalized += '?' + params.toString();
        }
    }
    if (hash) {
        normalized += '#' + hash;
    }
    return normalized;
}

function isSamePath(path1: string, path2: string) {
    return normalizePath(path1) === normalizePath(path2);
}

function syncLocationToParent() {
    if (window === window.parent) {
        // We are the top level window - no parent to sync to
        return;
    }

    const fullPath = getFullPath();
    const basePath = getBasePath();
    const topPath = getPathInParent();

    const localPath = removePathPrefix(fullPath, basePath);
    const topLocalPath = joinPaths(topPath, localPath);
    const parentFullPath = getFullPath(window.parent);
    if (!isSamePath(parentFullPath, topLocalPath)) {
        replaceStateOnWindow(window.parent, topLocalPath);
    }
}

/**
 * This should be invoked whenever the current frame has navigated itself.
 *
 * Also goes for the top level window.
 */
export function onSelfNavigation() {
    syncLocationToChildFrames();
    syncLocationToParent();
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
    if (urlString.startsWith('about:')) {
        return '';
    }

    if (urlString.startsWith('/')) {
        return urlString;
    }
    const url = new URL(urlString);
    let out = url.pathname;
    if (url.search && url.search.length > 1) {
        out += url.search;
    }
    if (url.hash && url.hash.length > 1) {
        out += url.hash;
    }
    return out;
}
